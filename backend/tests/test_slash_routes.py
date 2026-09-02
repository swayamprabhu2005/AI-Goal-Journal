import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app

@pytest.fixture
def client():
    return TestClient(app, follow_redirects=False)

@pytest.fixture
def auth_override():
    from app.core.auth import get_current_user, AuthenticatedUser
    mock_user = AuthenticatedUser(uid="test_user_123", email="test@example.com", name="Test User")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield mock_user
    app.dependency_overrides.clear()

def test_journals_routes_no_redirect(client, auth_override):
    # Test GET /api/v1/journals
    res1 = client.get("/api/v1/journals")
    assert res1.status_code == 200

    # Test GET /api/v1/journals/
    res2 = client.get("/api/v1/journals/")
    assert res2.status_code == 200

def test_goals_routes_no_redirect(client, auth_override):
    # Test GET /api/v1/goals
    res1 = client.get("/api/v1/goals")
    assert res1.status_code == 200

    # Test GET /api/v1/goals/
    res2 = client.get("/api/v1/goals/")
    assert res2.status_code == 200

@patch("app.services.summary_service.summary_service.get_latest_summary")
@patch("app.services.summary_service.summary_service.generate_weekly_summary")
def test_summaries_weekly_routes(mock_generate, mock_get, client, auth_override):
    mock_get.return_value = {
        "id": "sum_123",
        "headline": "Great Progress This Week",
        "user_id": "test_user_123",
        "week_start_date": "2026-08-24",
        "week_end_date": "2026-08-30",
        "total_journals_logged": 3,
        "completed_activities": ["Finished project setup"],
        "ongoing_activities": ["UI design"],
        "recurring_blockers": ["Time management"],
        "goals_progress": [],
        "overall_sentiment": "Positive",
        "coach_verdict": "On Track",
        "coaching_advice": "Keep up the momentum",
        "created_at": "2026-08-30T12:00:00Z"
    }

    # Test GET /api/v1/summaries/weekly
    res1 = client.get("/api/v1/summaries/weekly")
    assert res1.status_code == 200

    # Test GET /api/v1/summaries/weekly/
    res2 = client.get("/api/v1/summaries/weekly/")
    assert res2.status_code == 200
