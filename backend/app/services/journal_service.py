import uuid
import logging
from typing import Optional, Any
from app.models.domain import JournalEntry
from app.schemas.journal import JournalCreate, JournalUpdate
from app.repositories.in_memory import journal_repo
from app.services.goal_service import goal_service
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

class JournalService:
    def list_journals(self, user_id: str) -> list[JournalEntry]:
        return journal_repo.get_all_by_user(user_id=user_id)

    def get_journal(self, user_id: str, journal_id: str) -> Optional[JournalEntry]:
        return journal_repo.get_by_id(user_id=user_id, journal_id=journal_id)

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

        # 4. Perform deterministic matching on extracted activities
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

        # 5. Deterministic matching on extracted goals
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

        # 6. Assemble and persist JournalEntry
        journal_entry = JournalEntry(
            id=entry_id,
            user_id=user_id,
            content=content,
            source=data.source or "text",
            ai_analysis=ai_raw,
        )

        saved = journal_repo.create(journal_entry)
        logger.info("Saved journal %s for user %s with AI analysis", saved.id, user_id)
        return saved

    def update_journal(self, user_id: str, journal_id: str, data: JournalUpdate) -> Optional[JournalEntry]:
        return journal_repo.update(user_id=user_id, journal_id=journal_id, content=data.content.strip())

    def delete_journal(self, user_id: str, journal_id: str) -> bool:
        return journal_repo.delete(user_id=user_id, journal_id=journal_id)

journal_service = JournalService()
