from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat import stream_reply
from app.services.llm import OllamaClient, get_llm

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest, llm: OllamaClient = Depends(get_llm)) -> StreamingResponse:
    return StreamingResponse(
        stream_reply(llm, request.messages),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
