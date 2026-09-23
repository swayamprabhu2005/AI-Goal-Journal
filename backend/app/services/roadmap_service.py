import uuid
from datetime import datetime
from typing import Optional, Any
from app.models.domain import Roadmap
from app.schemas.roadmap import RoadmapResponse, Milestone
from app.repositories.postgres import roadmap_repo, goal_repo
from app.services.gemini_service import gemini_service

class RoadmapService:
    def _domain_to_response(self, roadmap: Roadmap) -> RoadmapResponse:
        milestone_objs = []
        completed_count = 0
        for m in roadmap.milestones:
            if isinstance(m, dict):
                ms = Milestone(
                    step_number=m.get("step_number", 1),
                    title=m.get("title", ""),
                    short_description=m.get("short_description", ""),
                    estimated_duration=m.get("estimated_duration", "1 week"),
                    key_action_item=m.get("key_action_item", ""),
                    completed=m.get("completed", False),
                )
            elif isinstance(m, Milestone):
                ms = m
            else:
                ms = Milestone(
                    step_number=getattr(m, "step_number", 1),
                    title=getattr(m, "title", ""),
                    short_description=getattr(m, "short_description", ""),
                    estimated_duration=getattr(m, "estimated_duration", "1 week"),
                    key_action_item=getattr(m, "key_action_item", ""),
                    completed=getattr(m, "completed", False),
                )

            if ms.completed:
                completed_count += 1
            milestone_objs.append(ms)

        total = len(milestone_objs)
        pct = int((completed_count / total) * 100) if total > 0 else 0

        created_str = (
            roadmap.created_at.strftime("%Y-%m-%d %H:%M:%S")
            if isinstance(roadmap.created_at, datetime)
            else str(roadmap.created_at or "")
        )

        return RoadmapResponse(
            goal_id=roadmap.goal_id,
            goal_title=roadmap.goal_title,
            total_milestones=total,
            estimated_total_duration=roadmap.estimated_total_duration,
            milestones=milestone_objs,
            completed_count=completed_count,
            progress_percentage=pct,
            created_at=created_str,
        )

    def _response_to_domain(self, user_id: str, goal_id: str, response: RoadmapResponse) -> Roadmap:
        milestones_list = []
        for m in response.milestones:
            if isinstance(m, Milestone):
                milestones_list.append(m.model_dump())
            elif isinstance(m, dict):
                milestones_list.append(m)

        return Roadmap(
            id=str(uuid.uuid4()),
            goal_id=goal_id,
            user_id=user_id,
            goal_title=response.goal_title,
            total_milestones=response.total_milestones,
            estimated_total_duration=response.estimated_total_duration,
            milestones=milestones_list,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

    def get_or_create_roadmap(
        self,
        user_id: str,
        goal_id: str,
        goal_title: str,
        timeline: str = "Self-paced",
        level: str = "Beginner",
    ) -> RoadmapResponse:
        """
        Retrieves existing saved roadmap for a goal/user, or generates and persists a new one.
        """
        existing = roadmap_repo.get_by_goal(user_id=user_id, goal_id=goal_id)
        if existing:
            return self._domain_to_response(existing)

        generated = gemini_service.generate_goal_roadmap(
            goal_title=goal_title,
            timeline=timeline,
            level=level,
            goal_id=goal_id,
        )

        domain_roadmap = self._response_to_domain(user_id=user_id, goal_id=goal_id, response=generated)
        saved = roadmap_repo.save(domain_roadmap)
        return self._domain_to_response(saved)

    def get_roadmap(self, user_id: str, goal_id: str) -> Optional[RoadmapResponse]:
        """
        Retrieves saved roadmap for a goal if it exists.
        """
        existing = roadmap_repo.get_by_goal(user_id=user_id, goal_id=goal_id)
        if not existing:
            return None
        return self._domain_to_response(existing)

    def toggle_milestone(
        self,
        user_id: str,
        goal_id: str,
        step_number: int,
        completed: Optional[bool] = None,
    ) -> Optional[RoadmapResponse]:
        """
        Toggles or sets completion status for a specific milestone in a goal's roadmap,
        persisting changes and updating goal progress.
        """
        updated = roadmap_repo.toggle_milestone(
            user_id=user_id,
            goal_id=goal_id,
            step_number=step_number,
            completed=completed,
        )
        if not updated:
            return None

        res = self._domain_to_response(updated)
        try:
            from app.services.progress_service import progress_service
            progress_service.create_progress(
                user_id=user_id,
                goal_id=goal_id,
                progress_value=res.progress_percentage,
                note=f"Roadmap milestone step {step_number} updated",
            )
        except Exception as e:
            pass

        return res

roadmap_service = RoadmapService()
