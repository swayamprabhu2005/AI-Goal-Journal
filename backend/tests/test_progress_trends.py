import pytest
from datetime import datetime, timezone, timedelta
from app.services.progress_service import progress_service
from app.services.goal_service import goal_service
from app.schemas.goal import GoalCreate, GoalUpdate
from app.models.domain import Goal


def test_progress_history_and_trend_deltas():
    user_id = "test-trend-user-1"
    
    # 1. Create a Goal
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(
            title="Complete System Refactor",
            target_date=(datetime.now(timezone.utc) + timedelta(days=20)).strftime("%Y-%m-%d"),
            progress_value=10,
        )
    )
    
    # 2. Record historical progress checkpoints: 10% -> 25% -> 40% -> 65%
    progress_service.create_progress(user_id=user_id, goal_id=goal.id, progress_value=25, note="Phase 1 complete")
    progress_service.create_progress(user_id=user_id, goal_id=goal.id, progress_value=40, note="Phase 2 complete")
    progress_service.create_progress(user_id=user_id, goal_id=goal.id, progress_value=65, note="Phase 3 complete")
    
    # 3. Retrieve trend data
    trend = progress_service.get_progress_trend(user_id=user_id, goal_id=goal.id)
    
    assert trend.goal_id == goal.id
    assert trend.goal_title == "Complete System Refactor"
    assert trend.current_progress == 65
    assert trend.initial_progress == 25
    assert trend.net_change == 40
    assert trend.trend_direction == "improving"
    assert len(trend.history) == 3
    
    # Verify deltas:
    # First item change = 0 (baseline)
    assert trend.history[0].progress_value == 25
    assert trend.history[0].change_from_previous == 0
    # Second item change = 40 - 25 = +15%
    assert trend.history[1].progress_value == 40
    assert trend.history[1].change_from_previous == 15
    # Third item change = 65 - 40 = +25%
    assert trend.history[2].progress_value == 65
    assert trend.history[2].change_from_previous == 25


def test_smart_goal_prioritization_rules():
    now = datetime.now(timezone.utc)
    today = now.date()
    
    # 1. Completed goal -> Low Priority
    completed_goal = Goal(
        id="g-comp", user_id="u1", title="Finished Thesis", status="Completed",
        progress_value=100, target_date=(today - timedelta(days=5)).isoformat()
    )
    assert goal_service.calculate_goal_priority(completed_goal) == "Low Priority"
    
    # 2. Overdue and incomplete -> High Priority
    overdue_goal = Goal(
        id="g-overdue", user_id="u1", title="Overdue Project", status="Active",
        progress_value=30, target_date=(today - timedelta(days=2)).isoformat()
    )
    assert goal_service.calculate_goal_priority(overdue_goal) == "High Priority"
    
    # 3. Approaching deadline (3 days away) with low progress (20%) -> High Priority
    urgent_goal = Goal(
        id="g-urgent", user_id="u1", title="Upcoming Exam", status="Active",
        progress_value=20, target_date=(today + timedelta(days=3)).isoformat()
    )
    assert goal_service.calculate_goal_priority(urgent_goal) == "High Priority"
    
    # 4. Explicitly Stalled goal -> High Priority
    stalled_goal = Goal(
        id="g-stalled", user_id="u1", title="Blocked On Review", status="Stalled",
        progress_value=40, target_date=(today + timedelta(days=25)).isoformat()
    )
    assert goal_service.calculate_goal_priority(stalled_goal) == "High Priority"
    
    # 5. Approaching deadline (14 days) with moderate progress (40%) -> Medium Priority
    medium_goal = Goal(
        id="g-medium", user_id="u1", title="Quarterly OKR", status="Active",
        progress_value=40, target_date=(today + timedelta(days=14)).isoformat()
    )
    assert goal_service.calculate_goal_priority(medium_goal) == "Medium Priority"
    
    # 6. High progress (85%) or distant deadline (60 days) -> Low Priority
    healthy_goal = Goal(
        id="g-healthy", user_id="u1", title="Read 10 Books", status="Active",
        progress_value=85, target_date=(today + timedelta(days=60)).isoformat()
    )
    assert goal_service.calculate_goal_priority(healthy_goal) == "Low Priority"
