"""Client for the local Ollama server. All model calls go through here so the
provider can be swapped (e.g. for a hosted API) without touching routes."""

import json
from collections.abc import AsyncIterator

import httpx

from app.core.config import get_settings


class LLMError(Exception):
    """The model server was unreachable or returned an error."""


class OllamaClient:
    def __init__(self, base_url: str, model: str, timeout: float) -> None:
        self.base_url = base_url
        self.model = model
        self.timeout = timeout

    async def stream_chat(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        """Yield the reply text piece by piece as the model generates it."""
        payload = {"model": self.model, "messages": messages, "stream": True}
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
                async with client.stream("POST", "/api/chat", json=payload) as resp:
                    if resp.status_code != 200:
                        body = (await resp.aread()).decode(errors="replace")
                        raise LLMError(f"Ollama returned {resp.status_code}: {body[:300]}")
                    # Ollama streams one JSON object per line.
                    async for line in resp.aiter_lines():
                        if not line:
                            continue
                        chunk = json.loads(line)
                        if "error" in chunk:
                            raise LLMError(chunk["error"])
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
                        if chunk.get("done"):
                            break
        except httpx.HTTPError as exc:
            raise LLMError(f"Could not reach Ollama at {self.base_url}: {exc}") from exc

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=3) as client:
                resp = await client.get("/api/tags")
            return resp.status_code == 200
        except httpx.HTTPError:
            return False


def get_llm() -> OllamaClient:
    settings = get_settings()
    return OllamaClient(settings.ollama_url, settings.chat_model, settings.llm_timeout_seconds)
