from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.services.llm import OllamaClient, get_llm

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health(
    settings: Annotated[Settings, Depends(get_settings)],
    llm: Annotated[OllamaClient, Depends(get_llm)],
) -> dict:
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "llm_available": await llm.is_available(),
        "chat_model": llm.model,
    }
