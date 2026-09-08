import uuid
import logging
from typing import Optional, Any
from app.models.domain import JournalEntry
from app.schemas.journal import JournalCreate, JournalUpdate
from app.schemas.goal import GoalUpdate
from app.repositories.postgres import journal_repo
from app.services.goal_service import goal_service
from app.services.gemini_service import gemini_service
from app.services.progress_service import progress_service
from app.schemas.progress import ProgressCreate
from app.core.crypto import crypto_service

logger = logging.getLogger(__name__)

class JournalService:
    def _decrypt_entry(self, entry: Optional[JournalEntry]) -> Optional[JournalEntry]:
        if not entry:
            return None
        return JournalEntry(
            id=entry.id,
            user_id=entry.user_id,
            content=crypto_service.decrypt(entry.content) or "",
            source=entry.source,
            title=entry.title,
            ai_analysis=entry.ai_analysis,
            created_at=entry.created_at,
            updated_at=entry.updated_at,
        )

    def list_journals(self, user_id: str) -> list[JournalEntry]:
        raw_entries = journal_repo.get_all_by_user(user_id=user_id)
        return [self._decrypt_entry(j) for j in raw_entries if j]

    def get_journal(self, user_id: str, journal_id: str) -> Optional[JournalEntry]:
        entry = journal_repo.get_by_id(user_id=user_id, journal_id=journal_id)
        return self._decrypt_entry(entry)

    def create_journal(self, user_id: str, data: JournalCreate) -> JournalEntry:
        # 1. Prepare base journal entry
        entry_id = str(uuid.uuid4())
        content = data.content.strip()

        # 2. Fetch user's existing goals for context and deterministic matching
        existing_goals = goal_service.list_goals(user_id=user_id)
        goals_dict_list = [
            {"id": g.id, "title": g.title, "status": g.status}
            for g in existing_goals
        ]

        # 3. Call Gemini AI extraction
        ai_raw = gemini_service.analyze_journal(content=content, existing_goals=goals_dict_list)

        # 4. AI Automatic Goal Creation with Deduplication
        extracted_candidate_goals = ai_raw.get("goals", [])
        auto_created_goals = goal_service.auto_create_goals_from_journal(
            user_id=user_id,
            extracted_goals=extracted_candidate_goals,
            existing_goals=existing_goals,
        )

        # 5. Perform deterministic matching on extracted activities & record progress
        activities = ai_raw.get("activities", [])
        for act in activities:
            text = act.get("text", "")
            hint = act.get("related_goal_hint")
            matched_id, matched_title = goal_service.match_activity_to_existing_goal(
                activity_text=text, hint=hint, existing_goals=existing_goals
            )
            if matched_id:
                act["related_goal_id"] = matched_id
                act["related_goal_title"] = matched_title

        # 6. Process AI Progress Updates & save to progress_repo
        progress_updates = ai_raw.get("progress_updates", [])
        for prog in progress_updates:
            hint = prog.get("related_goal_hint")
            note = prog.get("note", "AI journal progress detection")
            q_comp = prog.get("quantified_completed")
            q_tot = prog.get("quantified_total")
            effort = prog.get("effort_level", "moderate")
            inc = prog.get("progress_increment", 15)

            matched_id, matched_title = goal_service.match_activity_to_existing_goal(
                activity_text=note, hint=hint, existing_goals=existing_goals
            )
            if matched_id:
                existing_goal = goal_service.get_goal(user_id=user_id, goal_id=matched_id)
                current_val = existing_goal.progress_value if existing_goal else 0

                if q_comp is not None and q_tot is not None and q_tot > 0:
                    new_val = min(100, max(current_val, int((q_comp / q_tot) * 100)))
                elif effort == "completion":
                    new_val = 100
                else:
                    effort_inc = 5 if effort == "minor" else (15 if effort == "moderate" else 25)
                    actual_inc = min(30, max(effort_inc, inc))
                    new_val = min(100, current_val + actual_inc)

                progress_service.record_progress(
                    user_id=user_id,
                    goal_id=matched_id,
                    data=ProgressCreate(progress_value=new_val, note=f"{note} (Progress: {new_val}%)")
                )
                # Update goal in repository with new progress & note
                # Auto-transition: 100% -> Completed; Stalled -> Active on forward progress
                if new_val >= 100:
                    new_status = "Completed"
                elif existing_goal.status == "Stalled" and new_val > current_val:
                    new_status = "Active"
                else:
                    new_status = existing_goal.status

                goal_service.update_goal(
                    user_id=user_id,
                    goal_id=matched_id,
                    data=GoalUpdate(progress_value=new_val, status=new_status, latest_progress_note=note)
                )

        # AI Stalled Goal Detection based on blockers
        blockers = ai_raw.get("blockers", [])
        for blk in blockers:
            b_text = blk.get("text", "") if isinstance(blk, dict) else str(blk)
            b_hint = blk.get("related_goal_hint") if isinstance(blk, dict) else None
            m_id, _ = goal_service.match_activity_to_existing_goal(
                activity_text=b_text, hint=b_hint, existing_goals=existing_goals
            )
            if m_id:
                target_g = goal_service.get_goal(user_id=user_id, goal_id=m_id)
                if target_g and target_g.status == "Active":
                    # Check if this goal received progress in this same entry
                    updated_in_entry = any(
                        p.get("related_goal_hint") == m_id or target_g.title.lower() in str(p.get("note", "")).lower()
                        for p in progress_updates
                    )
                    if not updated_in_entry:
                        logger.info("Goal %s marked Stalled due to AI detected blocker: %s", m_id, b_text)
                        goal_service.update_goal(
                            user_id=user_id,
                            goal_id=m_id,
                            data=GoalUpdate(status="Stalled", latest_progress_note=f"Stalled: {b_text[:120]}")
                        )

        # 7. Deterministic matching on extracted goals
        goals_suggested = ai_raw.get("goals", [])
        for g_sug in goals_suggested:
            text = g_sug.get("text", "")
            matched_id, matched_title = goal_service.match_activity_to_existing_goal(
                activity_text=text, hint=None, existing_goals=existing_goals
            )
            if matched_id:
                g_sug["is_new"] = False
                g_sug["matched_existing_goal_id"] = matched_id
                g_sug["matched_existing_goal_title"] = matched_title

        # 8. Assemble and persist encrypted JournalEntry
        encrypted_content = crypto_service.encrypt(content)
        journal_entry = JournalEntry(
            id=entry_id,
            user_id=user_id,
            content=encrypted_content,
            source=data.source or "text",
            title=ai_raw.get("title"),
            ai_analysis=ai_raw,
        )

        saved = journal_repo.create(journal_entry)
        logger.info("Saved encrypted journal %s for user %s with AI analysis", saved.id, user_id)
        return self._decrypt_entry(saved)

    def update_journal(self, user_id: str, journal_id: str, data: JournalUpdate) -> Optional[JournalEntry]:
        encrypted_content = crypto_service.encrypt(data.content.strip())
        updated = journal_repo.update(user_id=user_id, journal_id=journal_id, content=encrypted_content)
        return self._decrypt_entry(updated)

    def delete_journal(self, user_id: str, journal_id: str) -> bool:
        return journal_repo.delete(user_id=user_id, journal_id=journal_id)

journal_service = JournalService()
