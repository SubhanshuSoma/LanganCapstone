from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import chat, health
from app.core.config import get_settings


def create_app() -> FastAPI:
    app = FastAPI(title="Langan Knowledge Bot")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=get_settings().cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(chat.router)
    return app


app = create_app()
