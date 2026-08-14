import uuid
import logging
from typing import Optional
from app.models.domain import WeeklySummary
from app.repositories.in_memory import summary_repo, journal_repo, goal_repo
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

class SummaryService:
    def get_latest_summary(self, user_id: str) -> Optional[WeeklySummary]:
        return summary_repo.get_latest_by_user(user_id)

    def generate_weekly_summary(self, user_id: str, user_name: str = "") -> WeeklySummary:
        # 1. Fetch user's journals and goals
        recent_journals = journal_repo.get_all_by_user(user_id)
        journals_dict_list = [
            {
                "id": j.id,
                "content": j.content,
                "created_at": j.created_at.isoformat(),
                "ai_analysis": j.ai_analysis,
            }
            for j in recent_journals[:10]
        ]

        goals = goal_repo.get_all_by_user(user_id)
        goals_dict_list = [
            {
                "id": g.id,
                "title": g.title,
                "status": g.status,
                "category": g.category,
            }
            for g in goals
        ]

        # 2. Synthesize with Gemini
        ai_summary = gemini_service.generate_weekly_summary(
            user_name=user_name,
            recent_journals=journals_dict_list,
            goals=goals_dict_list,
        )

        # 3. Create WeeklySummary model
        summary = WeeklySummary(
            id=str(uuid.uuid4()),
            user_id=user_id,
            headline=ai_summary.get("headline", "Weekly Progress Reflection"),
            wins=ai_summary.get("wins", []),
            recurring_blockers=ai_summary.get("recurring_blockers", []),
            goal_status_changes=ai_summary.get("goal_status_changes", []),
            mood_trend=ai_summary.get("mood_trend", "stable"),
            coaching_suggestion=ai_summary.get("coaching_suggestion", ""),
        )

        saved = summary_repo.save(summary)
        logger.info("Generated new weekly summary %s for user %s", saved.id, user_id)
        return saved

summary_service = SummaryService()
