from app.services.chat import SYSTEM_PROMPT
from app.services.llm import LLMError
from tests.conftest import FakeLLM, parse_sse


def test_chat_streams_tokens_then_done(make_client):
    llm = FakeLLM(tokens=["Hello", " there"])
    resp = make_client(llm).post("/api/chat", json={"messages": [{"role": "user", "content": "Hi"}]})

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/event-stream")
    assert parse_sse(resp.text) == [
        {"type": "token", "content": "Hello"},
        {"type": "token", "content": " there"},
        {"type": "done"},
    ]


def test_chat_sends_system_prompt_and_history(make_client):
    llm = FakeLLM(tokens=["ok"])
    history = [
        {"role": "user", "content": "First question"},
        {"role": "assistant", "content": "First answer"},
        {"role": "user", "content": "Follow-up"},
    ]
    make_client(llm).post("/api/chat", json={"messages": history})

    assert llm.received == [{"role": "system", "content": SYSTEM_PROMPT}, *history]


def test_chat_reports_llm_errors_as_event(make_client):
    llm = FakeLLM(error=LLMError("Could not reach Ollama"))
    resp = make_client(llm).post("/api/chat", json={"messages": [{"role": "user", "content": "Hi"}]})

    assert parse_sse(resp.text) == [{"type": "error", "message": "Could not reach Ollama"}]


def test_chat_rejects_empty_conversation(make_client):
    resp = make_client(FakeLLM()).post("/api/chat", json={"messages": []})

    assert resp.status_code == 422
