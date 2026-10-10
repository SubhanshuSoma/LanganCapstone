from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    # The client sends the full conversation; the last message is the new question.
    messages: list[ChatMessage] = Field(min_length=1)
    document_ids: list[int] = Field(default_factory=list, max_length=10)
