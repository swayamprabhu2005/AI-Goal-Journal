from typing import Optional
from app.models.domain import User
from app.schemas.user import UserProfileResponse, UserStats, UserProfileUpdate
from app.repositories.in_memory import user_repo, goal_repo, journal_repo

class UserService:
    def get_or_create_profile(self, uid: str, email: str, name: Optional[str] = None) -> UserProfileResponse:
        user = user_repo.get_or_create(uid=uid, email=email, name=name)

        # Calculate live stats from in-memory repositories
        journals = journal_repo.get_all_by_user(uid)
        goals = goal_repo.get_all_by_user(uid)

        active_goals = sum(1 for g in goals if g.status.lower() == "active")
        completed_goals = sum(1 for g in goals if g.status.lower() == "completed")
        stalled_goals = sum(1 for g in goals if g.status.lower() == "stalled")

        blockers_count = 0
        for j in journals[:5]:
            if j.ai_analysis and isinstance(j.ai_analysis, dict):
                blockers_count += len(j.ai_analysis.get("blockers", []))

        stats = UserStats(
            total_journals=len(journals),
            active_goals=active_goals,
            completed_goals=completed_goals,
            stalled_goals=stalled_goals,
            active_blockers_count=blockers_count,
        )

        return UserProfileResponse(
            firebase_uid=user.firebase_uid,
            email=user.email,
            display_name=user.display_name,
            profession=user.profession,
            created_at=user.created_at,
            stats=stats,
        )

    def update_profile(self, uid: str, data: UserProfileUpdate) -> Optional[UserProfileResponse]:
        user = user_repo.update_profile(
            uid=uid,
            display_name=data.display_name,
            profession=data.profession,
        )
        if not user:
            return None
        return self.get_or_create_profile(uid=uid, email=user.email)

user_service = UserService()