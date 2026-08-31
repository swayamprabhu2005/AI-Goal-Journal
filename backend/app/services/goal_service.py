import uuid
import re
from typing import Optional, Any
from app.models.domain import Goal
from app.schemas.goal import GoalCreate, GoalUpdate
from app.repositories.postgres import goal_repo

import math
from datetime import datetime

class GoalService:
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
            return goal

        if goal.status == "Completed":
            goal.estimated_days_remaining = 0
            return goal

        # Active or Stalled goal velocity calculation
        created_dt = goal.created_at or datetime.utcnow()
        days_active = max(1, (datetime.utcnow() - created_dt).days)
        velocity = max(val / days_active, 2.0)  # Default min 2% / day
        remaining_percentage = max(0, 100 - val)
        goal.estimated_days_remaining = math.ceil(remaining_percentage / velocity)
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
        goal = Goal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=data.title.strip(),
            description=data.description.strip() if data.description else None,
            category=data.category.strip() if data.category else None,
            status=init_status,
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
        if data.target_date is not None:
            updates["target_date"] = data.target_date
        if data.progress_value is not None:
            updates["progress_value"] = data.progress_value
            if data.progress_value >= 100:
                updates["status"] = "Completed"
        if data.latest_progress_note is not None:
            updates["latest_progress_note"] = data.latest_progress_note.strip()

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

goal_service = GoalService()
