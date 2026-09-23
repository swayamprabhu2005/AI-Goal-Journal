import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user, AuthenticatedUser
from app.services.gemini_service import gemini_service
from app.schemas.roadmap import RoadmapGenerateRequest, RoadmapResponse, Milestone

@pytest.fixture
def client_with_mock_auth():
    mock_user = AuthenticatedUser(
        uid="test_user_roadmap_123",
        email="roadmap_tester@example.com",
        name="Roadmap Tester",
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

def test_gemini_generate_goal_roadmap_fallback():
    """Verify gemini_service fallback produces valid structured RoadmapResponse."""
    roadmap = gemini_service._rule_based_roadmap_fallback(
        goal_title="Learn Python Development",
        timeline="4 weeks",
        level="Beginner",
    )
    assert isinstance(roadmap, RoadmapResponse)
    assert roadmap.goal_title == "Learn Python Development"
    assert roadmap.total_milestones >= 4
    assert len(roadmap.milestones) == roadmap.total_milestones
    assert roadmap.milestones[0].step_number == 1
    assert roadmap.milestones[0].completed is False

def test_roadmap_generate_api_endpoint(client_with_mock_auth):
    """Test POST /api/v1/roadmap/generate endpoint."""
    response = client_with_mock_auth.post(
        "/api/v1/roadmap/generate",
        json={"goal_title": "Learn React Frontend", "timeline": "6 weeks", "level": "Intermediate"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["goal_title"] == "Learn React Frontend"
    assert "total_milestones" in data
    assert "milestones" in data
    assert len(data["milestones"]) > 0

def test_roadmap_sample_api_endpoint(client_with_mock_auth):
    """Test GET /api/v1/roadmap/sample endpoint."""
    response = client_with_mock_auth.get("/api/v1/roadmap/sample")
    assert response.status_code == 200
    data = response.json()
    assert "goal_title" in data
    assert len(data["milestones"]) > 0

def test_goal_roadmap_association(client_with_mock_auth):
    """Test POST /api/v1/goals/{goal_id}/roadmap endpoint."""
    # 1. Create a goal
    create_res = client_with_mock_auth.post(
        "/api/v1/goals",
        json={"title": "Master Data Structures in C++", "category": "Learning"},
    )
    assert create_res.status_code == 201
    goal_id = create_res.json()["id"]

    # 2. Generate roadmap for the goal
    roadmap_res = client_with_mock_auth.post(f"/api/v1/goals/{goal_id}/roadmap")
    assert roadmap_res.status_code == 200
    roadmap_data = roadmap_res.json()
    assert roadmap_data["goal_id"] == goal_id
    assert roadmap_data["goal_title"] == "Master Data Structures in C++"
    assert len(roadmap_data["milestones"]) > 0

def test_roadmap_persistence_and_milestone_toggle(client_with_mock_auth):
    """Test persistence of generated roadmap and toggling milestone completion."""
    # 1. Create a goal
    create_res = client_with_mock_auth.post(
        "/api/v1/goals",
        json={"title": "Learn Fullstack Web Development", "category": "Career"},
    )
    assert create_res.status_code == 201
    goal_id = create_res.json()["id"]

    # 2. Generate roadmap
    gen_res = client_with_mock_auth.post(f"/api/v1/goals/{goal_id}/roadmap")
    assert gen_res.status_code == 200
    r_data = gen_res.json()
    assert r_data["completed_count"] == 0
    assert r_data["progress_percentage"] == 0

    # 3. Toggle step 1 completion
    toggle_res = client_with_mock_auth.post(f"/api/v1/goals/{goal_id}/roadmap/milestones/1/toggle")
    assert toggle_res.status_code == 200
    t_data = toggle_res.json()
    assert t_data["milestones"][0]["completed"] is True
    assert t_data["completed_count"] == 1
    assert t_data["progress_percentage"] > 0

    # 4. Fetch roadmap again (simulating page refresh)
    get_res = client_with_mock_auth.get(f"/api/v1/goals/{goal_id}/roadmap")
    assert get_res.status_code == 200
    fetched = get_res.json()
    assert fetched["milestones"][0]["completed"] is True
    assert fetched["completed_count"] == 1

    # 5. Check goal progress value updated
    goal_res = client_with_mock_auth.get(f"/api/v1/goals/{goal_id}")
    assert goal_res.status_code == 200
    assert goal_res.json()["progress_value"] == fetched["progress_percentage"]

