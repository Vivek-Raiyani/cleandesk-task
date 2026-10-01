import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_operations_summary():
    response = client.get("/api/operations/summary")
    assert response.status_code == 200
    data = response.json()
    assert "team_efficiency" in data
    assert "ai_metrics" in data
    assert "notification_metrics" in data
