from fastapi import APIRouter, HTTPException, Depends, status, Request, Body
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import List, Dict, Any, Union
from bson import ObjectId, errors as bson_errors
from datetime import datetime
import logging
import json
import traceback

from app.models.assistant import AssistantCreate, AssistantUpdate, AssistantResponse, Node, Edge, Element
from app.database.mongodb import get_database
from app.api.auth import get_current_user

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("assistant_api")

router = APIRouter()

# Collection MongoDB pour les assistants
COLLECTION = "assistants"

# Convertir un document MongoDB en modèle de réponse
def assistant_to_response(assistant: Dict[str, Any]) -> Dict[str, Any]:
    try:
        # Gérer l'ID MongoDB qui peut être un ObjectId ou un dict avec $oid
        if isinstance(assistant.get("_id"), dict) and "$oid" in assistant["_id"]:
            assistant_id = assistant["_id"]["$oid"]
        else:
            assistant_id = str(assistant["_id"])
        
        # Gérer les dates qui peuvent être des datetime ou des dict avec $date
        created_at = assistant.get("created_at", datetime.utcnow())
        if isinstance(created_at, dict) and "$date" in created_at:
            created_at = datetime.fromisoformat(created_at["$date"].replace('Z', '+00:00'))
            
        updated_at = assistant.get("updated_at", datetime.utcnow())
        if isinstance(updated_at, dict) and "$date" in updated_at:
            updated_at = datetime.fromisoformat(updated_at["$date"].replace('Z', '+00:00'))
        
        # Traiter les nodes pour s'assurer que le label est présent
        nodes = assistant.get("nodes", [])
        for node in nodes:
            # Si le label n'est pas défini mais qu'il est dans data.label, l'utiliser
            if not node.get("label") and isinstance(node.get("data"), dict) and "label" in node["data"]:
                node["label"] = node["data"]["label"]
        
        return {
            "id": assistant_id,
            "name": assistant["name"],
            "description": assistant.get("description", ""),
            "nodes": nodes,
            "edges": assistant.get("edges", []),
            "created_at": created_at,
            "updated_at": updated_at
        }
    except Exception as e:
        logger.error(f"Erreur lors de la conversion de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        return assistant

@router.post("/", response_model=AssistantResponse, status_code=status.HTTP_201_CREATED)
async def create_assistant(assistant: AssistantCreate, request: Request):
    """
    Crée un nouvel assistant avec les nodes et edges fournis.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Préparer le document à insérer
        now = datetime.utcnow()
        assistant_dict = assistant.dict()
        assistant_dict["created_at"] = now
        assistant_dict["updated_at"] = now
        
        # Vérifier et préparer les nodes
        for node in assistant_dict.get("nodes", []):
            # S'assurer que chaque node a un ID unique
            if "id" not in node:
                node["id"] = str(ObjectId())
            
            # S'assurer que chaque node a un type
            if "type" not in node:
                node["type"] = "default"
        
        # Vérifier et préparer les edges
        for edge in assistant_dict.get("edges", []):
            # S'assurer que chaque edge a un ID unique
            if "id" not in edge:
                edge["id"] = str(ObjectId())
        
        # Insérer l'assistant dans la base de données
        result = await collection.insert_one(assistant_dict)
        
        # Récupérer l'assistant créé
        created_assistant = await collection.find_one({"_id": result.inserted_id})
        
        # Convertir en format de réponse
        response_data = assistant_to_response(created_assistant)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=jsonable_encoder(response_data)
        )
    
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la création de l'assistant"
        )

@router.get("/", response_model=List[AssistantResponse])
async def get_assistants(request: Request):
    """
    Récupère tous les assistants.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Récupérer tous les assistants
        assistants = await collection.find().to_list(length=100)
        
        # Convertir en format de réponse
        response_data = [assistant_to_response(assistant) for assistant in assistants]
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(response_data)
        )
    
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des assistants: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération des assistants"
        )

@router.get("/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(assistant_id: str, request: Request):
    """
    Récupère un assistant par son ID.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Convertir l'ID en ObjectId
        try:
            object_id = ObjectId(assistant_id)
        except bson_errors.InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID d'assistant invalide"
            )
        
        # Récupérer l'assistant
        assistant = await collection.find_one({"_id": object_id})
        
        if not assistant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé"
            )
        
        # Convertir en format de réponse
        response_data = assistant_to_response(assistant)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(response_data)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération de l'assistant"
        )

@router.put("/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(assistant_id: str, assistant_update: AssistantUpdate, request: Request):
    """
    Met à jour un assistant existant.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Convertir l'ID en ObjectId
        try:
            object_id = ObjectId(assistant_id)
        except bson_errors.InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID d'assistant invalide"
            )
        
        # Vérifier si l'assistant existe
        existing_assistant = await collection.find_one({"_id": object_id})
        if not existing_assistant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé"
            )
        
        # Préparer les données de mise à jour
        update_data = assistant_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Mettre à jour l'assistant
        await collection.update_one(
            {"_id": object_id},
            {"$set": update_data}
        )
        
        # Récupérer l'assistant mis à jour
        updated_assistant = await collection.find_one({"_id": object_id})
        
        # Convertir en format de réponse
        response_data = assistant_to_response(updated_assistant)
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(response_data)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la mise à jour de l'assistant"
        )

@router.delete("/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assistant(assistant_id: str, request: Request):
    """
    Supprime un assistant existant.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Convertir l'ID en ObjectId
        try:
            object_id = ObjectId(assistant_id)
        except bson_errors.InvalidId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID d'assistant invalide"
            )
        
        # Vérifier si l'assistant existe
        existing_assistant = await collection.find_one({"_id": object_id})
        if not existing_assistant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé"
            )
        
        # Supprimer l'assistant
        await collection.delete_one({"_id": object_id})
        
        return JSONResponse(
            status_code=status.HTTP_204_NO_CONTENT,
            content=None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la suppression de l'assistant"
        )

@router.post("/import", response_model=AssistantResponse, status_code=status.HTTP_201_CREATED)
async def import_assistant(request: Request, assistant_data: Dict[str, Any] = Body(...)):
    """
    Importe un assistant depuis un fichier JSON.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Vérifier les données minimales requises
        if "name" not in assistant_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le nom de l'assistant est requis"
            )
        
        # Préparer le document à insérer
        now = datetime.utcnow()
        assistant_dict = {
            "name": assistant_data["name"],
            "description": assistant_data.get("description", ""),
            "nodes": assistant_data.get("nodes", []),
            "edges": assistant_data.get("edges", []),
            "created_at": now,
            "updated_at": now
        }
        
        # Vérifier et préparer les nodes
        for node in assistant_dict.get("nodes", []):
            # S'assurer que chaque node a un ID unique
            if "id" not in node:
                node["id"] = str(ObjectId())
            
            # S'assurer que chaque node a un type
            if "type" not in node:
                node["type"] = "default"
        
        # Vérifier et préparer les edges
        for edge in assistant_dict.get("edges", []):
            # S'assurer que chaque edge a un ID unique
            if "id" not in edge:
                edge["id"] = str(ObjectId())
        
        # Insérer l'assistant dans la base de données
        result = await collection.insert_one(assistant_dict)
        
        # Récupérer l'assistant créé
        created_assistant = await collection.find_one({"_id": result.inserted_id})
        
        # Convertir en format de réponse
        response_data = assistant_to_response(created_assistant)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=jsonable_encoder(response_data)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'importation de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de l'importation de l'assistant"
        )
