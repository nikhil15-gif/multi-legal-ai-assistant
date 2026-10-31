"""
FastAPI Endpoint Integration Tests for LegalSaathi AI.
"""

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "LegalSaathi AI"
    assert data["status"] == "operational"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["knowledge_base_records"] > 0

def test_ai_status_endpoint():
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "provider" in data
    assert "ollama_reachable" in data

def test_languages_endpoint():
    response = client.get("/api/languages")
    assert response.status_code == 200
    data = response.json()
    codes = [item["code"] for item in data]
    assert "en" in codes
    assert "hi" in codes
    assert "kn" in codes

def test_categories_endpoint():
    response = client.get("/api/legal/categories")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) > 0
    assert "Consumer Rights" in categories

def test_legal_search_endpoint():
    response = client.get("/api/legal/search?q=refund")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert any("refund" in r["title"].lower() or "consumer" in r["legal_category"].lower() for r in data["results"])

def test_chat_endpoint_english():
    payload = {
        "query": "What are my rights if an employer refuses to pay my salary?",
        "language": "en"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["answer"]) > 0
    assert len(data["sources"]) > 0
    assert "disclaimer" in data

def test_chat_endpoint_hindi():
    payload = {
        "query": "दुकानदार खराब सामान दे तो क्या करें?",
        "language": "hi"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "hi"
    assert len(data["sources"]) > 0

def test_chat_endpoint_emergency():
    payload = {
        "query": "Help me I am facing immediate danger domestic violence attack now!",
        "language": "en"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["emergency_contact"] is not None
    assert data["emergency_contact"]["is_emergency"] is True
    assert "112" in str(data["emergency_contact"]["helplines"])

if __name__ == "__main__":
    test_root_endpoint()
    test_health_endpoint()
    test_ai_status_endpoint()
    test_languages_endpoint()
    test_categories_endpoint()
    test_legal_search_endpoint()
    test_chat_endpoint_english()
    test_chat_endpoint_hindi()
    test_chat_endpoint_emergency()
    print("All API integration tests passed successfully!")
