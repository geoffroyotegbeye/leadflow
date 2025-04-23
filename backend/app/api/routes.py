from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.assistant import router as assistant_router
from app.api.media import media_router
from app.api.session import router as session_router
from app.api.analytics import router as analytics_router
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# Router principal
api_router = APIRouter()

# Inclusion des modules
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(assistant_router, prefix="/assistants", tags=["assistants"])
api_router.include_router(session_router, prefix="/sessions", tags=["sessions"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])
api_router.include_router(media_router)
