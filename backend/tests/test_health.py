from tests.conftest import FakeLLM


def test_health_reports_llm_status(make_client):
    resp = make_client(FakeLLM()).get("/api/health")

    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "llm_available": True, "chat_model": "fake-model"}
