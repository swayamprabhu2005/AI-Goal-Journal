import pytest
from app.services.mood_service import mood_service
from app.services.groq_service import groq_service

def test_mood_service_predict_basic():
    """Test that mood_service can predict emotion and extract trigger keywords."""
    res = mood_service.predict("I am deeply focused on finishing all my goals today!")
    assert isinstance(res, dict)
    assert "mood" in res
    assert res["mood"] in [
        "accomplishment", "motivation", "focus", "gratitude", "breakthrough",
        "burnout", "overwhelmed", "frustration", "guilt", "neutral"
    ]
    assert "confidence" in res
    assert 0.0 <= res["confidence"] <= 1.0
    assert "trigger_keywords" in res
    assert isinstance(res["trigger_keywords"], list)

def test_mood_service_predict_empty():
    """Test that empty or whitespace input returns a safe fallback without crashing."""
    res = mood_service.predict("")
    assert res["mood"] == "neutral"
    assert res["confidence"] == 1.0
    assert res["trigger_keywords"] == []

def test_groq_service_offline_or_active(monkeypatch):
    """Test that groq_service handles requests safely with mocked client."""
    from unittest.mock import MagicMock
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Great progress today! Keep taking small steps."
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_completion.usage.prompt_tokens = 25
    mock_completion.usage.completion_tokens = 12
    mock_client.chat.completions.create.return_value = mock_completion

    monkeypatch.setattr(groq_service, "_get_client", lambda: mock_client)
    monkeypatch.setattr(groq_service, "_build_user_context", lambda user_id: "Mock goals and habits")
    res = groq_service.chat(user_id="test_user", message="Hello coach")
    assert isinstance(res, dict)
    assert "reply" in res
    assert "Great progress" in res["reply"]
    assert "model" in res
