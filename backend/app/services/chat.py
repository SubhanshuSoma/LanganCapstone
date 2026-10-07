"""Builds the prompt and turns the model's output into server-sent events.

Event payloads (one JSON object per `data:` line):
  {"type": "token", "content": "..."}   a piece of the reply
  {"type": "done"}                      the reply finished
  {"type": "error", "message": "..."}   the reply failed
"""

import json
from collections.abc import AsyncIterator

from app.schemas.chat import ChatMessage
from app.services.llm import LLMError, OllamaClient

SYSTEM_PROMPT = (
    "You are a knowledge assistant for engineers at Langan. You help staff find "
    "knowledge from the work of retired colleagues. Answer clearly and concisely. "
    "If you do not know something, say so plainly; never invent names, numbers, "
    "dates or project details."
)


def to_sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def stream_reply(llm: OllamaClient, messages: list[ChatMessage]) -> AsyncIterator[str]:
    prompt = [{"role": "system", "content": SYSTEM_PROMPT}]
    prompt += [m.model_dump() for m in messages]
    try:
        async for token in llm.stream_chat(prompt):
            yield to_sse({"type": "token", "content": token})
    except LLMError as exc:
        yield to_sse({"type": "error", "message": str(exc)})
        return
    yield to_sse({"type": "done"})
