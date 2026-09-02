import pytest
from app.services.goal_service import GoalService
from app.models.domain import Goal
from app.schemas.journal import JournalCreate
from app.services.journal_service import journal_service

@pytest.fixture
def goal_service():
    return GoalService()

# 1. Test Exact & Fuzzy Deduplication
def test_fuzzy_deduplication(goal_service):
    existing_goals = [
        Goal(id="1", user_id="user1", title="Run a 5k Marathon", status="Active")
    ]
    
    # Case A: Exact/Similar match should return the existing goal
    duplicate = goal_service.is_duplicate_goal("Run 5k marathon", existing_goals)
    assert duplicate is not None
    assert duplicate.id == "1"

    # Case B: Completely new goal should return None
    not_duplicate = goal_service.is_duplicate_goal("Learn Kubernetes cluster deployment", existing_goals)
    assert not_duplicate is None

# 2. Test Auto-Creation Logic
def test_auto_create_goals_from_journal(goal_service):
    user_id = "test_user"
    existing_goals = [
        Goal(id="1", user_id=user_id, title="Learn FastAPI", status="Active")
    ]
    
    extracted_goals = [
        {
            "title": "Learn FastAPI framework",  # Duplicate of goal #1
            "description": "Backend API development",
            "category": "Career",
            "is_new": True,
            "confidence": 0.9,
        },
        {
            "title": "Complete React Redux Course",  # Brand new goal
            "description": "State management mastering",
            "category": "Learning",
            "is_new": True,
            "confidence": 0.88,
        },
        {
            "title": "Drink water",  # Low confidence -> should be skipped
            "description": "Hydration",
            "category": "Health",
            "is_new": True,
            "confidence": 0.4,
        }
    ]

    created = goal_service.auto_create_goals_from_journal(user_id, extracted_goals, existing_goals)

    # Only the React Redux goal should be created
    assert len(created) == 1
    assert created[0].title == "Complete React Redux Course"