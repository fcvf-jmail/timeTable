from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_info():
    response = client.get("/api/is_running")
    assert response.status_code == 200