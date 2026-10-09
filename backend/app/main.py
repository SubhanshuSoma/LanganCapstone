from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import add_scalar_reference

from app.api.router import api_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
    )

    # lets the vite frontend call us from the browser
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # everything lives under /api
    app.include_router(api_router, prefix=settings.api_prefix)

    # api docs at /scalar
    add_scalar_reference(app)

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"message": f"{settings.app_name} is running, docs at /scalar"}

    return app


app = create_app()
