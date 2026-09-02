from datetime import datetime, timezone, timedelta
from typing import List, Any
from app.schemas.productivity import ProductivityScoreResponse, ProductivityBreakdown


class ProductivityScoreService:

    @staticmethod
    def _calculate_goal_progress_score(active_goals: List[Any], now: datetime) -> float:
        if not active_goals:
            return 0.0

        effective_scores = []
        for goal in active_goals:
            # Default to neutral midpoint (50) if not explicitly tracked
            raw_progress = getattr(goal, "progress_percent", None)
            progress = 50.0 if raw_progress is None else float(raw_progress)

            # Decay progress contribution toward 0 if not updated in > 30 days
            updated_at = getattr(goal, "updated_at", getattr(goal, "created_at", now))
            if updated_at.tzinfo is None:
                updated_at = updated_at.replace(tzinfo=timezone.utc)

            days_stale = (now - updated_at).days
            if days_stale > 30:
                # Decay factor drops from 1.0 down to 0.0 past day 30 (zeroed out by day 60)
                decay_factor = max(0.0, 1.0 - ((days_stale - 30) / 30.0))
                progress *= decay_factor

            effective_scores.append(progress)

        return sum(effective_scores) / len(effective_scores)

    @staticmethod
    def _calculate_goal_completion_score(total_goals_count: int, completed_goals_count: int) -> float:
        if total_goals_count == 0:
            return 0.0

        ratio = (completed_goals_count / total_goals_count) * 100.0
        # Dampen slightly (x0.8) if user has fewer than 3 goals total
        if total_goals_count < 3:
            ratio *= 0.8

        return min(100.0, ratio)

    @classmethod
    def compute_score(
        cls,
        goals: List[Any],
        recent_journals: List[Any],  # Journals created within the last 7 days
    ) -> ProductivityScoreResponse:
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)

        # 1. Goal Metrics
        active_goals = [g for g in goals if getattr(g, "status", "").lower() == "active"]
        completed_goals = [g for g in goals if getattr(g, "status", "").lower() == "completed"]
        
        goal_progress_score = cls._calculate_goal_progress_score(active_goals, now)
        goal_completion_score = cls._calculate_goal_completion_score(len(goals), len(completed_goals))

        # 2. Journal & Activity Extraction Metrics (last 7 days)
        completed_activities_count = 0
        blocker_count = 0
        journal_dates = set()

        for journal in recent_journals:
            created_at = getattr(journal, "created_at", None)
            if created_at:
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                if created_at >= seven_days_ago:
                    journal_dates.add(created_at.date())

            # Parse Gemini structured output from ai_analysis JSON/dict
            ai_analysis = getattr(journal, "ai_analysis", {}) or {}
            
            activities = ai_analysis.get("activities", [])
            for act in activities:
                if isinstance(act, dict) and act.get("status") == "completed":
                    completed_activities_count += 1
                elif isinstance(act, str):
                    # fallback if simple strings are stored as completed
                    completed_activities_count += 1

            blockers = ai_analysis.get("blockers", [])
            blocker_count += len(blockers)

        # 3. Component Scores
        # Scaled against 10 activities/week
        completed_activities_score = min(100.0, (completed_activities_count / 10.0) * 100.0)

        # Scaled against 5 active days/week
        days_journaled = len(journal_dates)
        journal_consistency_score = min(100.0, (days_journaled / 5.0) * 100.0)

        # 4. Final Aggregation & Deductions
        base_score = (
            (0.30 * goal_progress_score)
            + (0.20 * goal_completion_score)
            + (0.20 * completed_activities_score)
            + (0.20 * journal_consistency_score)
        )

        blocker_penalty = min(15.0, float(blocker_count * 3))
        final_score = int(round(max(0.0, min(100.0, base_score - blocker_penalty))))

        # Feedback messaging
        if final_score >= 70:
            message = "Solid progress, keep the consistency going."
        elif final_score >= 35:
            message = "Making some headway."
        else:
            message = "Just getting started."

        breakdown = ProductivityBreakdown(
            goal_progress_score=round(goal_progress_score, 2),
            goal_completion_score=round(goal_completion_score, 2),
            completed_activities_score=round(completed_activities_score, 2),
            journal_consistency_score=round(journal_consistency_score, 2),
            base_score=round(base_score, 2),
            blocker_penalty=round(blocker_penalty, 2),
            total_blockers_last_7_days=blocker_count,
            active_goals_count=len(active_goals),
            completed_activities_count=completed_activities_count,
            days_journaled_last_7_days=days_journaled,
        )

        return ProductivityScoreResponse(
            final_score=final_score,
            breakdown=breakdown,
            message=message
        )

productivity_service = ProductivityScoreService()