from datetime import datetime, timedelta
from typing import Optional, Any
from app.repositories.postgres import journal_repo, goal_repo, progress_repo
from app.schemas.user import UserStats

class ProductivityService:
    def calculate_user_productivity_score(self, user_id: str) -> dict[str, Any]:
        """
        Calculates a deterministic 0-100 Personal Productivity Score based on 
        extracted journal activities, goal progress records, journaling streak, and blockers.
        """
        journals = journal_repo.get_all_by_user(user_id)
        goals = goal_repo.get_all_by_user(user_id)

        # 1. Evaluate today's completed activities (Max 35 pts)
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        today_journals = [
            j for j in journals 
            if j.created_at and j.created_at.strftime("%Y-%m-%d") == today_str
        ]
        
        completed_activities_count = 0
        blockers_count = 0

        for j in (today_journals if today_journals else journals[:1]):
            analysis = j.ai_analysis or {}
            for act in analysis.get("activities", []):
                if act.get("status") == "completed":
                    completed_activities_count += 1
            blockers_count += len(analysis.get("blockers", []))

        s_activities = min(35, completed_activities_count * 7)

        # 2. Evaluate Goal Progress & Milestones (Max 30 pts)
        progress_points = 0
        for g in goals:
            if g.status == "Completed":
                progress_points += 15
            elif g.progress_value > 0:
                progress_points += min(15, int(g.progress_value * 0.2))

        s_goals = min(30, progress_points)

        # 3. Journal Consistency & Streak (Max 20 pts)
        has_logged_today = len(today_journals) > 0
        s_journal = 10 if has_logged_today else 0

        # Calculate streak
        dates = set(j.created_at.strftime("%Y-%m-%d") for j in journals if j.created_at)
        streak = 0
        cursor = datetime.utcnow()
        for _ in range(30):
            d_str = cursor.strftime("%Y-%m-%d")
            if d_str in dates:
                streak += 1
                cursor -= timedelta(days=1)
            else:
                break

        s_streak = min(10, streak * 2)
        s_journal += s_streak

        # 4. Blocker Penalty (Max -15 pts)
        s_blockers = min(15, blockers_count * 5)

        # Total score calculation
        total_score = max(0, min(100, s_activities + s_goals + s_journal - s_blockers))

        return {
            "score": total_score,
            "breakdown": {
                "activities_points": s_activities,
                "goals_points": s_goals,
                "consistency_points": s_journal,
                "blockers_penalty": s_blockers,
                "current_streak_days": streak,
            },
            "evaluation": (
                "Outstanding Momentum" if total_score >= 80 else (
                    "Steady Progress" if total_score >= 50 else "Focus Required"
                )
            )
        }

productivity_service = ProductivityService()
