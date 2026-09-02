import logging
logger = logging.getLogger(__name__)
import uuid
import re
import difflib
from typing import Optional, Any
from app.models.domain import Goal
from app.schemas.goal import GoalCreate, GoalUpdate
from app.repositories.in_memory import goal_repo

import math
from datetime import datetime, timezone

class GoalService:
    @staticmethod
    def calculate_goal_priority(goal: Goal) -> str:
        """
        Classify goals into High Priority, Medium Priority, or Low Priority.
        Rules:
        - Completed goals -> Low Priority (never treated as urgent)
        - Overdue + incomplete -> High Priority
        - Approaching deadline (<= 7 days) + low progress (< 50%) -> High Priority
        - Status Stalled -> High Priority
        - Deadline within 30 days with moderate progress -> Medium Priority
        - Distant deadline (> 30 days) or healthy progress -> Low Priority
        """
        status = (goal.status or "Active").capitalize()
        if status == "Completed" or (goal.progress_value and goal.progress_value >= 100):
            return "Low Priority"

        val = goal.progress_value or 0
        now = datetime.now(timezone.utc)
        today = now.date()

        days_until_deadline: Optional[int] = None
        if goal.target_date:
            try:
                t_str = str(goal.target_date).split("T")[0]
                target_d = datetime.strptime(t_str, "%Y-%m-%d").date()
                days_until_deadline = (target_d - today).days
            except Exception:
                pass

        # 1. Overdue and incomplete
        if days_until_deadline is not None and days_until_deadline < 0:
            return "High Priority"

        # 2. Approaching deadline (<= 7 days) and progress < 50%
        if days_until_deadline is not None and days_until_deadline <= 7 and val < 50:
            return "High Priority"

        # 3. Goal is explicitly stalled
        if status == "Stalled":
            return "High Priority"

        # 4. Approaching deadline (<= 7 days) with decent progress, or 8-30 days with moderate progress
        if days_until_deadline is not None and days_until_deadline <= 30 and val < 75:
            return "Medium Priority"

        # 5. Distant deadline or healthy progress
        if val >= 75 or (days_until_deadline is not None and days_until_deadline > 30):
            return "Low Priority"

        return "Medium Priority"

    def _enrich_goal(self, goal: Optional[Goal]) -> Optional[Goal]:
        if not goal:
            return None

        # Sync latest progress record from progress table if present
        try:
            from app.repositories.postgres import progress_repo
            latest_progress = progress_repo.get_latest_by_goal(user_id=goal.user_id, goal_id=goal.id)
            if latest_progress and latest_progress.progress_value is not None:
                goal.progress_value = max(goal.progress_value or 0, latest_progress.progress_value)
        except Exception:
            pass

        val = goal.progress_value or 0
        if val >= 100:
            goal.status = "Completed"
            goal.estimated_days_remaining = 0
            goal.priority = "Low Priority"
            return goal

        if goal.status == "Completed":
            goal.estimated_days_remaining = 0
            goal.priority = "Low Priority"
            return goal

        # Active or Stalled goal velocity calculation
        created_dt = goal.created_at or datetime.now(timezone.utc)
        if created_dt.tzinfo is None:
            created_dt = created_dt.replace(tzinfo=timezone.utc)

        days_active = max(1, (datetime.now(timezone.utc) - created_dt).days)
        velocity = max(val / days_active, 2.0)  # Default min 2% / day
        remaining_percentage = max(0, 100 - val)
        goal.estimated_days_remaining = math.ceil(remaining_percentage / velocity)

        # Smart Goal Prioritization
        goal.priority = self.calculate_goal_priority(goal)
        return goal

    def list_goals(self, user_id: str, status: Optional[str] = None) -> list[Goal]:
        raw_goals = goal_repo.get_all_by_user(user_id=user_id, status=status)
        return [self._enrich_goal(g) for g in raw_goals if g]

    def get_goal(self, user_id: str, goal_id: str) -> Optional[Goal]:
        goal = goal_repo.get_by_id(user_id=user_id, goal_id=goal_id)
        return self._enrich_goal(goal)

    def create_goal(self, user_id: str, data: GoalCreate) -> Goal:
        prog_val = data.progress_value or 0
        init_status = "Completed" if prog_val >= 100 else (data.status.value if hasattr(data.status, "value") else str(data.status))
        temp_g = Goal(
            id="",
            user_id=user_id,
            title=data.title.strip(),
            status=init_status,
            target_date=data.target_date,
            progress_value=prog_val,
        )
        init_priority = data.priority or self.calculate_goal_priority(temp_g)
        goal = Goal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=data.title.strip(),
            description=data.description.strip() if data.description else None,
            category=data.category.strip() if data.category else None,
            status=init_status,
            priority=init_priority,
            target_date=data.target_date,
            progress_value=prog_val,
        )
        saved = goal_repo.create(goal)
        return self._enrich_goal(saved)

    def update_goal(self, user_id: str, goal_id: str, data: GoalUpdate) -> Optional[Goal]:
        updates = {}
        if data.title is not None:
            updates["title"] = data.title.strip()
        if data.description is not None:
            updates["description"] = data.description.strip()
        if data.category is not None:
            updates["category"] = data.category.strip()
        if data.status is not None:
            updates["status"] = data.status.value if hasattr(data.status, "value") else str(data.status)
        if data.priority is not None:
            updates["priority"] = data.priority
        if data.target_date is not None:
            updates["target_date"] = data.target_date
        if data.progress_value is not None:
            updates["progress_value"] = data.progress_value
        if updates.get("status") == "Completed" or updates.get("progress_value") == 100:
            updates["status"] = "Completed"
            updates["progress_value"] = 100
            note = data.latest_progress_note or "Goal marked as completed (100%)"
            updates["latest_progress_note"] = note
            try:
                from app.repositories.in_memory import progress_repo
                from app.models.domain import Progress
                progress_repo.create(
                    Progress(
                        id=str(uuid.uuid4()),
                        goal_id=goal_id,
                        progress_value=100,
                        note=note,
                        created_at=datetime.utcnow(),
                    )
                )
            except Exception as e:
                logger.warning("Could not auto-create completed progress entry: %s", e)

        updated = goal_repo.update(user_id=user_id, goal_id=goal_id, **updates)
        return self._enrich_goal(updated)

    def delete_goal(self, user_id: str, goal_id: str) -> bool:
        return goal_repo.delete(user_id=user_id, goal_id=goal_id)

    def match_activity_to_existing_goal(
        self, activity_text: str, hint: Optional[str], existing_goals: list[Goal]
    ) -> tuple[Optional[str], Optional[str]]:
        """
        Deterministic matching comparing activity text and optional hint
        against the user's active goals to prevent duplicate goal generation.
        Returns (matched_goal_id, matched_goal_title).
        """
        if not existing_goals:
            return None, None

        # 1. Direct hint check
        if hint:
            hint_clean = hint.strip().lower()
            for goal in existing_goals:
                if goal.id.lower() == hint_clean or goal.title.lower() in hint_clean or hint_clean in goal.title.lower():
                    return goal.id, goal.title

        # 2. Token overlap check between activity and goal title
        activity_words = set(re.findall(r"\w+", activity_text.lower()))
        # Filter stop words
        stop_words = {"the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "my", "i", "was", "with"}
        activity_keywords = activity_words - stop_words

        best_match: Optional[Goal] = None
        highest_overlap = 0

        for goal in existing_goals:
            goal_words = set(re.findall(r"\w+", goal.title.lower())) - stop_words
            overlap = len(activity_keywords & goal_words)
            if overlap > 0 and overlap > highest_overlap:
                highest_overlap = overlap
                best_match = goal

        if best_match and highest_overlap >= 1:
            return best_match.id, best_match.title

        return None, None

    def is_duplicate_goal(
        self, candidate_title: str, existing_goals: list[Goal], threshold: float = 0.60
    ) -> Optional[Goal]:
        if not candidate_title or not existing_goals:
            return None

        candidate_norm = candidate_title.strip().lower()
        stop_words = {"to", "a", "an", "the", "in", "for", "on", "with", "my", "and", "learn", "complete", "finish"}
        cand_tokens = set(re.findall(r"\w+", candidate_norm)) - stop_words

        for goal in existing_goals:
            existing_title = goal.title.strip().lower()

            if candidate_norm == existing_title or candidate_norm in existing_title or existing_title in candidate_norm:
                return goal

            exist_tokens = set(re.findall(r"\w+", existing_title)) - stop_words
            if cand_tokens and exist_tokens:
                overlap = len(cand_tokens & exist_tokens)
                if overlap >= 2 or (len(cand_tokens) <= 2 and overlap == len(cand_tokens)):
                    return goal

            ratio = difflib.SequenceMatcher(None, candidate_norm, existing_title).ratio()
            if ratio >= threshold:
                return goal

        return None

    def auto_create_goals_from_journal(
        self, user_id: str, extracted_goals: list[dict], existing_goals: list[Goal]
    ) -> list[Goal]:
        created = []
        for g_data in extracted_goals:
            if not g_data.get("is_new", True) or g_data.get("confidence", 1.0) < 0.65:
                continue

            title = (g_data.get("title") or g_data.get("text") or "").strip()
            if not title or len(title) < 3:
                continue

            duplicate = self.is_duplicate_goal(title, existing_goals)
            if duplicate:
                g_data["is_new"] = False
                g_data["matched_existing_goal_id"] = duplicate.id
                g_data["matched_existing_goal_title"] = duplicate.title
                logger.info("Auto-goal skipped duplicate: '%s' matched with '%s'", title, duplicate.title)
                continue

            new_goal_dto = GoalCreate(
                title=title,
                description=g_data.get("description") or "Auto-generated from journal entry.",
                category=g_data.get("category") or "Personal",
                status="Active",
                target_date=g_data.get("target_date"),
                progress_value=0,
            )

            new_goal = self.create_goal(user_id=user_id, data=new_goal_dto)
            created.append(new_goal)
            existing_goals.append(new_goal)

            g_data["is_new"] = True
            g_data["auto_created_goal_id"] = new_goal.id
            logger.info("Auto-created goal '%s' (ID: %s) for user %s", new_goal.title, new_goal.id, user_id)

        return created

goal_service = GoalService()
