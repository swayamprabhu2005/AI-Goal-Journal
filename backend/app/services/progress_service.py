from datetime import datetime
import logging
from typing import Optional

from app.models.domain import Progress
from app.schemas.progress import ProgressCreate
from app.repositories.postgres import progress_repo, goal_repo


logger = logging.getLogger(__name__)


class ProgressService:

    def create_progress(
        self,
        user_id: str,
        goal_id: str,
        progress_value: int,
        note: Optional[str] = None,
    ) -> Progress:
        """
        Create a historical progress record for a goal.
        The goal must belong to the authenticated user.
        """

        goal = goal_repo.get_by_id(
            user_id=user_id,
            goal_id=goal_id,
        )

        if not goal:
            raise LookupError("Goal not found")

        progress = Progress(
            id="",
            goal_id=goal_id,
            progress_value=progress_value,
            note=note.strip() if note else None,
            created_at=datetime.utcnow(),
        )

        saved = progress_repo.create(progress)

        logger.info(
            "Recorded progress %d%% for goal %s",
            progress_value,
            goal_id,
        )

        return saved

    def record_progress(
        self,
        user_id: str,
        goal_id: str,
        data: ProgressCreate,
    ) -> Optional[Progress]:
        """
        Compatibility method used by the Goal API and AI journal pipeline.
        Saves AI/manual progress to PostgreSQL.
        """

        goal = goal_repo.get_by_id(
            user_id=user_id,
            goal_id=goal_id,
        )

        if not goal:
            logger.warning(
                "Attempted to record progress for nonexistent "
                "or unauthorized goal %s",
                goal_id,
            )
            return None

        return self.create_progress(
            user_id=user_id,
            goal_id=goal_id,
            progress_value=data.progress_value,
            note=data.note,
        )

    def get_progress_history(
        self,
        user_id: str,
        goal_id: str,
    ) -> list[Progress]:

        goal = goal_repo.get_by_id(
            user_id=user_id,
            goal_id=goal_id,
        )

        if not goal:
            return []

        return progress_repo.get_by_goal(
            user_id=user_id,
            goal_id=goal_id,
        )

    def get_latest_progress(
        self,
        user_id: str,
        goal_id: str,
    ) -> Optional[Progress]:

        goal = goal_repo.get_by_id(
            user_id=user_id,
            goal_id=goal_id,
        )

        if not goal:
            return None

        return progress_repo.get_latest_by_goal(
            user_id=user_id,
            goal_id=goal_id,
        )


progress_service = ProgressService()