from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat import stream_reply
from app.services.llm import OllamaClient, get_llm
from app.core.config import get_settings
import psycopg

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
async def chat(request: ChatRequest, llm: OllamaClient = Depends(get_llm)) -> StreamingResponse:
    context = ""
    if request.document_ids:
        with psycopg.connect(get_settings().database_url) as conn:
            rows = conn.execute(
                """SELECT d.filename, s.heading, s.content FROM sections s
                   JOIN documents d ON d.id = s.document_id
                   WHERE d.id = ANY(%s) ORDER BY d.id, s.ordinal""",
                (request.document_ids,),
            ).fetchall()
        context = "\n\n".join(f"Source: {name} / {heading}\n{content}" for name, heading, content in rows)[:24000]
    return StreamingResponse(
        stream_reply(llm, request.messages, context=context),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
