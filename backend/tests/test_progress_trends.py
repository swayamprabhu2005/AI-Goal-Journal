import pytest
from datetime import datetime, timezone, timedelta
from app.services.progress_service import progress_service
from app.services.goal_service import goal_service
from app.schemas.goal import GoalCreate, GoalUpdate
from app.models.domain import Goal, Progress
from app.repositories.postgres import progress_repo


def _insert_progress(user_id, goal_id, values_with_ages):
    """Insert progress records with controlled creation dates.

    `values_with_ages` is a list of (progress_value, age_days) tuples where
    age_days is how many days ago the record should appear to be created.
    """
    now = datetime.utcnow()
    inserted = []
    for value, age_days in values_with_ages:
        record = progress_repo.create(
            Progress(
                id="",
                goal_id=str(goal_id),
                progress_value=value,
                note=f"checkpoint {value}%",
                created_at=now - timedelta(days=age_days, minutes=5),
            )
        )
        inserted.append(record)
    return inserted


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


    # Verify progress analytics
    assert trend.average_progress_change == 20.0
    assert trend.stagnant_updates == 0
    # No `days` argument was passed, so period_days should be None.
    assert trend.period_days is None
    assert trend.period_progress_gain == 40
    
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

def test_progress_analytics_with_stagnant_updates():
    user_id = "test-trend-user-stagnant"

    # Create a goal
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(
            title="Learn PostgreSQL",
            target_date=(
                datetime.now(timezone.utc)
                + timedelta(days=30)
            ).strftime("%Y-%m-%d"),
            progress_value=20,
        )
    )

    # Progress history: 20% -> 20% -> 35% -> 35%
    progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=20,
        note="No progress yet",
    )

    progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=20,
        note="Still reviewing basics",
    )

    progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=35,
        note="Completed SQL basics",
    )

    progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=35,
        note="No additional progress",
    )

    trend = progress_service.get_progress_trend(
        user_id=user_id,
        goal_id=goal.id,
        days=7,
    )

    assert trend.goal_id == goal.id

    assert trend.initial_progress == 20
    assert trend.current_progress == 35
    assert trend.net_change == 15

    # Changes are:
    # 20 -> 20 = 0
    # 20 -> 35 = 15
    # 35 -> 35 = 0
    #
    # Average = (0 + 15 + 0) / 3 = 5
    assert trend.average_progress_change == 5.0

    # Two updates made no progress
    assert trend.stagnant_updates == 2

    # days=7 was passed, so period_days should reflect that.
    assert trend.period_days == 7
    assert trend.period_progress_gain == 15

    # The most recent update was stagnant, but overall
    # progress during the history increased.
    assert trend.trend_direction == "improving"

    assert len(trend.history) == 4    

def test_progress_gain_respects_selected_period():
    user_id = "test-trend-period-user"

    # Create a goal
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(
            title="Complete Backend Integration",
            target_date=(
                datetime.now(timezone.utc)
                + timedelta(days=30)
            ).strftime("%Y-%m-%d"),
            progress_value=10,
        )
    )

    # Create three PostgreSQL progress records
    old_progress = progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=20,
        note="Progress from ten days ago",
    )

    progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=40,
        note="Recent progress",
    )

    progress_service.create_progress(
        user_id=user_id,
        goal_id=goal.id,
        progress_value=60,
        note="Latest progress",
    )

    # Move the first progress record to 10 days ago
    from app.database.connection import SessionLocal
    from app.database.orm_models import ProgressORM

    db = SessionLocal()

    try:
        old_row = (
            db.query(ProgressORM)
            .filter(ProgressORM.id == int(old_progress.id))
            .first()
        )

        old_row.created_at = (
            datetime.utcnow() - timedelta(days=10)
        )

        db.commit()

    finally:
        db.close()

    # Request analytics for only the last 7 days
    trend = progress_service.get_progress_trend(
        user_id=user_id,
        goal_id=goal.id,
        days=7,
    )

    # days=7 was passed, so period_days should reflect that.
    assert trend.period_days == 7

    # Progress immediately before the 7-day period was 20%.
    # Latest progress is 60%.
    # Therefore progress gained during the period = 40%.
    assert trend.period_progress_gain == 40

    assert trend.current_progress == 60

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


# --- Added analytics: average progress change, stagnant updates, period-based gain ---


def test_average_progress_change():
    user_id = "test-avg-user-1"
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(title="Average Change Goal"),
    )

    # 20 -> 30 -> 50  => changes: +10, +20  => average = 15
    _insert_progress(user_id, goal.id, [(20, 3), (30, 2), (50, 1)])

    trend = progress_service.get_progress_trend(user_id=user_id, goal_id=goal.id)

    assert trend.average_progress_change == 15.0
    assert trend.current_progress == 50
    assert trend.initial_progress == 20
    assert trend.net_change == 30
    assert trend.total_updates == 3


def test_average_progress_change_no_history_is_zero():
    user_id = "test-avg-no-history-user-1"
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(title="Empty History Goal"),
    )
    # No explicit progress records -> baseline only, no deltas.
    trend = progress_service.get_progress_trend(user_id=user_id, goal_id=goal.id)
    assert trend.average_progress_change == 0.0
    assert trend.stagnant_updates == 0


def test_stagnant_updates():
    user_id = "test-stagnant-user-1"
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(title="Stagnant Updates Goal"),
    )

    # 20 -> 20 -> 30 -> 30  => stagnant updates = 2 (baseline 20 excluded)
    _insert_progress(user_id, goal.id, [(20, 4), (20, 3), (30, 2), (30, 1)])

    trend = progress_service.get_progress_trend(user_id=user_id, goal_id=goal.id)

    assert trend.stagnant_updates == 2
    assert trend.total_updates == 4
    assert trend.current_progress == 30
    assert trend.initial_progress == 20
    # Net still improved by 10, so the direction is not stagnant overall.
    assert trend.net_change == 10
    assert trend.trend_direction == "improving"


def test_period_based_progress_gain_seven_days():
    user_id = "test-period-user-1"
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(title="Period Gain Goal"),
    )

    # 20 (10 days ago) -> 25 (5 days ago) -> 40 (2 days ago)
    _insert_progress(user_id, goal.id, [(20, 10), (25, 5), (40, 2)])

    trend = progress_service.get_progress_trend(user_id=user_id, goal_id=goal.id, days=7)

    # Base at/before start of 7-day window is 20; latest in-window is 40; gain = +20.
    assert trend.period_days == 7
    assert trend.period_progress_gain == 20


def test_period_based_progress_gain_no_updates_in_period():
    user_id = "test-period-empty-user-1"
    goal = goal_service.create_goal(
        user_id=user_id,
        data=GoalCreate(title="Period Empty Goal"),
    )

    # Both records are older than the 7-day window.
    _insert_progress(user_id, goal.id, [(20, 15), (30, 12)])

    trend = progress_service.get_progress_trend(user_id=user_id, goal_id=goal.id, days=7)

    assert trend.period_days == 7
    assert trend.period_progress_gain == 0


def test_progress_trend_ownership_isolation():
    owner_user = "test-owner-user-1"
    other_user = "test-other-user-1"
    goal = goal_service.create_goal(
        user_id=owner_user,
        data=GoalCreate(title="Owned Goal"),
    )
    _insert_progress(owner_user, goal.id, [(30, 2), (50, 1)])

    # Owner can read the trend.
    trend = progress_service.get_progress_trend(user_id=owner_user, goal_id=goal.id)
    assert trend.goal_id == goal.id

    # Another user must not be able to read the owner's goal trend.
    with pytest.raises(LookupError):
        progress_service.get_progress_trend(user_id=other_user, goal_id=goal.id)
        