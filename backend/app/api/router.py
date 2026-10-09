from fastapi import APIRouter

from app.api.routes import health

# register every route module here, no /api prefix on the routers themselves
api_router = APIRouter()
api_router.include_router(health.router)
