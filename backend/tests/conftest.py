import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm import get_llm


class FakeLLM:
    """Stands in for Ollama so tests run without a model server."""

    model = "fake-model"

    def __init__(self, tokens: list[str] | None = None, error: Exception | None = None) -> None:
        self.tokens = tokens or []
        self.error = error
        self.received: list[dict] | None = None

    async def stream_chat(self, messages):
        self.received = messages
        if self.error:
            raise self.error
        for token in self.tokens:
            yield token

    async def is_available(self) -> bool:
        return True


@pytest.fixture
def make_client():
    def _make(llm: FakeLLM) -> TestClient:
        app.dependency_overrides[get_llm] = lambda: llm
        return TestClient(app)

    yield _make
    app.dependency_overrides.clear()


def parse_sse(body: str) -> list[dict]:
    return [json.loads(block.removeprefix("data: ")) for block in body.split("\n\n") if block]
