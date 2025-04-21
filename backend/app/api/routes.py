from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.assistant import router as assistant_router
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# Router principal
api_router = APIRouter()

# Inclusion des modules
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(assistant_router, prefix="/assistants", tags=["assistants"])
