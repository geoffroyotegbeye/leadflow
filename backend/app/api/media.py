from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
import shutil
import logging
from datetime import datetime
from typing import Optional

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("media_api")

# Création du router
media_router = APIRouter()

# Dossier pour stocker les médias
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "media")
os.makedirs(MEDIA_DIR, exist_ok=True)

# URL de base pour accéder aux médias
MEDIA_URL_BASE = "/static/media"

@media_router.post("/upload/media")
async def upload_media(
    file: UploadFile = File(...),
    type: str = Form(...)
):
    """
    Upload un fichier média (image, vidéo, audio, fichier)
    et retourne le chemin d'accès relatif.
    """
    try:
        # Vérifier le type de fichier
        if type not in ["image", "video", "audio", "file"]:
            raise HTTPException(status_code=400, detail="Type de média non supporté")
        
        # Générer un nom de fichier unique
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Créer un sous-dossier par type de média
        media_subdir = os.path.join(MEDIA_DIR, type)
        os.makedirs(media_subdir, exist_ok=True)
        
        # Chemin complet du fichier
        file_path = os.path.join(media_subdir, unique_filename)
        
        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Chemin relatif pour l'accès depuis le frontend
        relative_path = f"{MEDIA_URL_BASE}/{type}/{unique_filename}"
        
        logger.info(f"Fichier média uploadé avec succès: {relative_path}")
        
        return {"path": relative_path}
    
    except Exception as e:
        logger.error(f"Erreur lors de l'upload du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload du fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")
