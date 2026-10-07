from fastapi import APIRouter, Depends

from app.services.llm import OllamaClient, get_llm

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health(llm: OllamaClient = Depends(get_llm)) -> dict:
    return {"status": "ok", "llm_available": await llm.is_available(), "chat_model": llm.model}
