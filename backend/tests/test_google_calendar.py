import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.models.domain import Goal
from app.repositories.postgres import goal_repo
from app.services.google_calendar_service import google_calendar_service

@pytest.fixture
def client():
    return TestClient(app, follow_redirects=False)

@pytest.fixture
def auth_override():
    from app.core.auth import get_current_user, AuthenticatedUser
    mock_user = AuthenticatedUser(uid="test_cal_user_1", email="user@example.com", name="Cal User")
    app.dependency_overrides[get_current_user] = lambda: mock_user
    yield mock_user
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_google_config(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "123456-mock.apps.googleusercontent.com")
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_SECRET", "mock-secret-key-123")

def test_calendar_auth_url(client, auth_override):
    res = client.get("/api/v1/calendar/auth-url")
    assert res.status_code == 200
    data = res.json()
    assert data["is_configured"] is True
    assert "auth_url" in data
    assert "test_cal_user_1" in data["auth_url"]

def test_calendar_status_initial(client, auth_override):
    # Ensure fresh disconnected state
    google_calendar_service.disconnect("test_cal_user_1")
    res = client.get("/api/v1/calendar/status")
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is False

@patch.object(google_calendar_service, "exchange_code")
def test_calendar_oauth_callback(mock_exchange, client, auth_override):
    mock_exchange.return_value = {"connected": True, "email": "test@gmail.com"}
    res = client.get("/api/v1/calendar/callback?code=mock_code&state=test_cal_user_1")
    assert res.status_code == 307
    assert "calendar_connected=success" in res.headers["location"]
    mock_exchange.assert_called_once_with(code="mock_code", user_id="test_cal_user_1")

@patch.object(google_calendar_service, "sync_goal_to_calendar")
def test_calendar_sync_goal(mock_sync, client, auth_override):
    # 1. Create a goal in repository
    goal = Goal(
        id="goal_cal_test_1",
        user_id="test_cal_user_1",
        title="Master Python Data Structures",
        description="Solve 10 problems on trees and graphs",
        category="Coding",
        target_date="2026-09-15",
        progress_value=25,
    )
    created_goal = goal_repo.create(goal)

    mock_sync.return_value = {
        "success": True,
        "goal_id": created_goal.id,
        "google_event_id": "mock_event_123",
        "google_event_link": "https://calendar.google.com/event/mock",
        "message": "Goal 'Master Python Data Structures' successfully added to your Google Calendar!",
    }

    # 2. Sync goal to calendar
    payload = {
        "goal_id": created_goal.id,
        "target_date": "2026-09-15",
        "start_time": "14:00",
        "duration_minutes": 60,
    }
    sync_res = client.post("/api/v1/calendar/sync-goal", json=payload)
    assert sync_res.status_code == 200
    data = sync_res.json()
    assert data["success"] is True
    assert data["google_event_id"] == "mock_event_123"
    assert "Master Python Data Structures" in data["message"]

def test_calendar_disconnect(client, auth_override):
    disc_res = client.delete("/api/v1/calendar/disconnect")
    assert disc_res.status_code == 200
    assert disc_res.json()["success"] is True

    status_res = client.get("/api/v1/calendar/status")
    assert status_res.json()["connected"] is False
