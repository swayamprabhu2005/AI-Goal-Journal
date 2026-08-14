import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.models.domain import User, Goal, JournalEntry, WeeklySummary
from app.schemas.goal import GoalCreate, GoalUpdate, GoalStatus
from app.schemas.journal import JournalCreate, ActivityStatus
from app.repositories.in_memory import (
    InMemoryUserRepository,
    InMemoryGoalRepository,
    InMemoryJournalRepository,
    InMemorySummaryRepository,
)
from app.services.goal_service import GoalService
from app.main import app
from app.core.auth import get_current_user, AuthenticatedUser

# --- Test 1: Pydantic Schema Validation ---
def test_goal_schema_validation():
    goal = GoalCreate(title="Complete Compiler Project", status=GoalStatus.ACTIVE)
    assert goal.title == "Complete Compiler Project"
    assert goal.status == GoalStatus.ACTIVE

    with pytest.raises(Exception):
        GoalCreate(title="")  # Empty title must fail validation

def test_journal_schema_validation():
    journal = JournalCreate(content="Studied discrete mathematics today", source="text")
    assert journal.content == "Studied discrete mathematics today"
    assert journal.source == "text"

# --- Test 2: In-Memory Repositories & User Isolation ---
def test_repository_user_isolation():
    user_repo = InMemoryUserRepository()
    goal_repo = InMemoryGoalRepository()
    journal_repo = InMemoryJournalRepository()

    user_a = "user_alpha_123"
    user_b = "user_beta_456"

    # User A creates goals
    goal_a = Goal(
        id="goal-1",
        user_id=user_a,
        title="Finish Thesis",
        status="Active"
    )
    goal_repo.create(goal_a)

    # User B creates goals
    goal_b = Goal(
        id="goal-2",
        user_id=user_b,
        title="Learn Rust",
        status="Active"
    )
    goal_repo.create(goal_b)

    # Verify User A only sees their goal
    user_a_goals = goal_repo.get_all_by_user(user_a)
    assert len(user_a_goals) == 1
    assert user_a_goals[0].id == "goal-1"
    assert goal_repo.get_by_id(user_a, "goal-2") is None

    # Verify User B only sees their goal
    user_b_goals = goal_repo.get_all_by_user(user_b)
    assert len(user_b_goals) == 1
    assert user_b_goals[0].id == "goal-2"
    assert goal_repo.get_by_id(user_b, "goal-1") is None

    # Test Journal isolation
    j_a = JournalEntry(id="j-1", user_id=user_a, content="Entry for A")
    j_b = JournalEntry(id="j-2", user_id=user_b, content="Entry for B")
    journal_repo.create(j_a)
    journal_repo.create(j_b)

    assert len(journal_repo.get_all_by_user(user_a)) == 1
    assert journal_repo.get_all_by_user(user_a)[0].content == "Entry for A"
    assert journal_repo.get_by_id(user_a, "j-2") is None

# --- Test 3: Deterministic Goal Matching Logic ---
def test_deterministic_goal_matching():
    service = GoalService()
    existing_goals = [
        Goal(id="g-101", user_id="u1", title="Learn FastAPI Framework", status="Active"),
        Goal(id="g-102", user_id="u1", title="Prepare for Marathon", status="Active"),
    ]

    # Test keyword matching
    activity_text = "Today I studied FastAPI dependency injection"
    matched_id, matched_title = service.match_activity_to_existing_goal(
        activity_text=activity_text, hint=None, existing_goals=existing_goals
    )
    assert matched_id == "g-101"
    assert matched_title == "Learn FastAPI Framework"

    # Test hint matching
    matched_id, matched_title = service.match_activity_to_existing_goal(
        activity_text="Ran 5km in the morning", hint="Marathon", existing_goals=existing_goals
    )
    assert matched_id == "g-102"
    assert matched_title == "Prepare for Marathon"

    # Test non-matching activity
    matched_id, matched_title = service.match_activity_to_existing_goal(
        activity_text="Cooked dinner for friends", hint=None, existing_goals=existing_goals
    )
    assert matched_id is None

# --- Test 4: API Endpoints with Mocked Auth & Services ---
@pytest.fixture
def client_with_mock_auth():
    mock_user = AuthenticatedUser(
        uid="test_user_unit_999",
        email="unit_test@example.com",
        name="Unit Tester",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_health_check_endpoint():
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["persistence"] == "in-memory"

def test_user_profile_endpoint(client_with_mock_auth):
    response = client_with_mock_auth.get("/api/v1/users/me")
    assert response.status_code == 200
    data = response.json()
    assert data["firebase_uid"] == "test_user_unit_999"
    assert data["email"] == "unit_test@example.com"
    assert "stats" in data

def test_goals_crud_endpoints(client_with_mock_auth):
    # 1. Create goal
    create_res = client_with_mock_auth.post(
        "/api/v1/goals",
        json={"title": "Master React 18", "category": "Learning", "status": "Active"},
    )
    assert create_res.status_code == 201
    goal_id = create_res.json()["id"]

    # 2. List goals
    list_res = client_with_mock_auth.get("/api/v1/goals")
    assert list_res.status_code == 200
    assert any(g["id"] == goal_id for g in list_res.json())

    # 3. Update goal
    update_res = client_with_mock_auth.put(
        f"/api/v1/goals/{goal_id}",
        json={"status": "Completed"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"

    # 4. Delete goal
    del_res = client_with_mock_auth.delete(f"/api/v1/goals/{goal_id}")
    assert del_res.status_code == 200

def test_journal_creation_with_mocked_gemini(client_with_mock_auth):
    mock_ai_analysis = {
        "mood": "motivated",
        "mood_confidence": 0.9,
        "activities": [
            {"text": "Wrote unit tests", "status": "completed", "related_goal_hint": None}
        ],
        "goals": [],
        "blockers": [
            {"text": "None", "category": "other"}
        ],
        "insights": ["Great testing discipline!"],
        "quick_summary": "Created thorough unit test coverage.",
    }

    with patch("app.services.gemini_service.gemini_service.analyze_journal", return_value=mock_ai_analysis):
        res = client_with_mock_auth.post(
            "/api/v1/journals",
            json={"content": "Wrote full unit tests for the backend application", "source": "text"},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["content"] == "Wrote full unit tests for the backend application"
        assert data["ai_analysis"]["mood"] == "motivated"
        assert len(data["ai_analysis"]["activities"]) == 1
        assert data["ai_analysis"]["activities"][0]["status"] == "completed"
