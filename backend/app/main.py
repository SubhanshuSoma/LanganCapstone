from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import add_scalar_reference

from app.api.routes import chat, documents, health
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="LANGAN LEGACY", version=settings.app_version, debug=settings.debug)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(chat.router)
    app.include_router(documents.router)
    add_scalar_reference(app)

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"message": f"{settings.app_name} is running, docs at /scalar"}

    return app


app = create_app()
