from fastapi import APIRouter, HTTPException, Depends, status, Request, Body
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import List, Dict, Any, Union
from bson import ObjectId, errors as bson_errors
from datetime import datetime
import logging
import json
import traceback
import uuid
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path

from app.models.assistant import AssistantCreate, AssistantUpdate, AssistantResponse, Node, Edge, Element, AssistantPublish, EmbedScriptResponse
from app.database.mongodb import get_database
from app.api.auth import get_current_user

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("assistant_api")

router = APIRouter()

# Configuration des templates pour le chat public
templates_dir = Path(__file__).parent.parent / "templates"
os.makedirs(templates_dir, exist_ok=True)
templates = Jinja2Templates(directory=str(templates_dir))

# Collection MongoDB pour les assistants
COLLECTION = "assistants"

# Niveau de log
logger.setLevel(logging.DEBUG)

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
        
        # Gérer la date de publication si elle existe
        publish_date = assistant.get("publish_date")
        if isinstance(publish_date, dict) and "$date" in publish_date:
            publish_date = datetime.fromisoformat(publish_date["$date"].replace('Z', '+00:00'))
        
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
            "is_published": assistant.get("is_published", False),
            "publish_date": publish_date,
            "public_id": assistant.get("public_id"),
            "public_url": assistant.get("public_url"),
            "embed_script": assistant.get("embed_script"),
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
        assistant_dict["is_published"] = False
        
        # Insérer le document
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
        
        # Récupérer l'assistant
        assistant = await collection.find_one({"_id": object_id})
        
        if not assistant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé"
            )
        
        # Préparer les données de mise à jour
        update_data = assistant_update.dict(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Mettre à jour l'assistant
        await collection.update_one({"_id": object_id}, {"$set": update_data})
        
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

@router.delete("/{assistant_id}", response_model=dict)
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
        
        # Récupérer l'assistant
        assistant = await collection.find_one({"_id": object_id})
        
        if not assistant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé"
            )
        
        # Supprimer l'assistant
        await collection.delete_one({"_id": object_id})
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Assistant supprimé avec succès"}
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

@router.post("/import", response_model=AssistantResponse)
async def import_assistant(request: Request, assistant_data: Dict[str, Any] = Body(...)):
    """
    Importe un assistant depuis un fichier JSON.
    """
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Préparer le document à insérer
        now = datetime.utcnow()
        assistant_data["created_at"] = now
        assistant_data["updated_at"] = now
        assistant_data["is_published"] = False
        
        # Supprimer l'ID s'il existe
        if "_id" in assistant_data:
            del assistant_data["_id"]
        
        # Insérer le document
        result = await collection.insert_one(assistant_data)
        
        # Récupérer l'assistant créé
        created_assistant = await collection.find_one({"_id": result.inserted_id})
        
        # Convertir en format de réponse
        response_data = assistant_to_response(created_assistant)
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=jsonable_encoder(response_data)
        )
    
    except Exception as e:
        logger.error(f"Erreur lors de l'importation de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de l'importation de l'assistant"
        )

@router.put("/{assistant_id}/publish", response_model=AssistantResponse)
async def publish_assistant(assistant_id: str, publish_data: AssistantPublish, request: Request):
    """
    Publie ou dépublie un assistant existant.
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
        
        # Préparer les données de mise à jour
        update_data = {"updated_at": datetime.utcnow()}
        
        # Si on publie l'assistant
        if publish_data.is_published:
            logger.info(f"Publication de l'assistant {assistant_id}")
            
            # Générer ou récupérer un public_id
            public_id = assistant.get("public_id")
            if not public_id:
                # Format: bot-{uuid4}
                public_id = f"bot-{str(uuid.uuid4())}"
            
            update_data["public_id"] = public_id
            update_data["publish_date"] = datetime.utcnow()
            update_data["is_published"] = True
            logger.info(f"Identifiant public généré: {public_id}")
            
            # Générer et stocker l'URL public et le script d'intégration
            base_url = str(request.base_url).rstrip('/')
            public_url = f"{base_url}/chat/{public_id}"
            logger.info(f"URL publique générée: {public_url}")
            
            # Générer le script d'intégration
            script = f"""
            <div id="leadflow-assistant-{public_id}"></div>
            <script>
                (function() {{
                    var script = document.createElement('script');
                    script.src = '{base_url}/static/js/embed.js';
                    script.setAttribute('data-assistant-id', '{public_id}');
                    script.setAttribute('data-base-url', '{base_url}');
                    document.head.appendChild(script);
                }})();
            </script>
            """.strip()
            
            update_data["public_url"] = public_url
            update_data["embed_script"] = script
            
            logger.info(f"Données de mise à jour préparées: {update_data}")
        else:
            # Si on dépublie, on garde les données mais on met is_published à False
            update_data["is_published"] = False
            logger.info(f"Dépublication de l'assistant {assistant_id}")
            # Ne pas effacer les autres champs pour permettre une republication facile
        
        # Mettre à jour l'assistant
        logger.info(f"Mise à jour de l'assistant {assistant_id} avec les données: {update_data}")
        result = await collection.update_one({"_id": object_id}, {"$set": update_data})
        logger.info(f"Résultat de la mise à jour: matched={result.matched_count}, modified={result.modified_count}")
        
        # Récupérer l'assistant mis à jour
        updated_assistant = await collection.find_one({"_id": object_id})
        logger.info(f"Assistant mis à jour récupéré: {updated_assistant.get('is_published')}, {updated_assistant.get('public_id')}, {updated_assistant.get('public_url') is not None}")
        
        # Convertir en format de réponse
        response_data = assistant_to_response(updated_assistant)
        logger.info(f"Données de réponse préparées: {response_data['is_published']}, {response_data['public_id']}, {response_data['public_url'] is not None}")
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(response_data)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la publication de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la publication de l'assistant"
        )

@router.get("/{assistant_id}/embed", response_model=EmbedScriptResponse)
async def get_embed_script(assistant_id: str, request: Request):
    """
    Récupère le script d'intégration pour un assistant publié.
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
        
        # Vérifier si l'assistant est publié
        if not assistant.get("is_published", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'assistant doit être publié pour accéder au script d'intégration"
            )
        
        # Récupérer le public_id
        public_id = assistant.get("public_id")
        if not public_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Erreur: l'assistant est publié mais n'a pas d'identifiant public"
            )
            
        # Récupérer les données stockées ou les générer si elles n'existent pas
        embed_script = assistant.get("embed_script")
        public_url = assistant.get("public_url")
        
        # Si les données ne sont pas stockées, les générer et les stocker
        if not embed_script or not public_url:
            # Construire l'URL public
            base_url = str(request.base_url).rstrip('/')
            public_url = f"{base_url}/chat/{public_id}"
            
            # Générer le script d'intégration
            embed_script = f"""<div id="leadflow-assistant-{public_id}"></div>
                <script 
                    src="{base_url}/static/js/embed.js"
                    data-assistant-id="{public_id}"
                    data-base-url="{base_url}">
                </script>""".strip()
            
            # Mettre à jour l'assistant avec les nouvelles données
            await collection.update_one(
                {"_id": object_id},
                {"$set": {
                    "public_url": public_url,
                    "embed_script": embed_script,
                    "updated_at": datetime.utcnow()
                }}
            )
        
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder({
                "script": embed_script,
                "public_url": public_url
            })
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la génération du script d'intégration: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la génération du script d'intégration"
        )

@router.get("/{assistant_id}/debug", response_model=dict)
async def debug_assistant(assistant_id: str, request: Request):
    """
    Endpoint de diagnostic pour vérifier les champs d'un assistant.
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
        
        # Convertir ObjectId en string pour la sérialisation JSON
        if isinstance(assistant.get("_id"), ObjectId):
            assistant["_id"] = str(assistant["_id"])
        
        # Afficher tous les champs disponibles
        debug_info = {
            "id": assistant.get("_id"),
            "name": assistant.get("name"),
            "is_published": assistant.get("is_published", False),
            "public_id": assistant.get("public_id"),
            "public_url": assistant.get("public_url"),
            "has_embed_script": assistant.get("embed_script") is not None,
            "available_fields": list(assistant.keys()),
        }
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(debug_info)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du diagnostic de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors du diagnostic de l'assistant"
        )

@router.get("/debug-nodes/{assistant_id}", response_model=dict)
async def debug_assistant_nodes(assistant_id: str, request: Request):
    """
    Endpoint de débogage pour afficher la structure des nœuds d'un assistant
    """
    try:
        db = request.app.state.db
        
        # Convertir en ObjectId si c'est un ID MongoDB valide
        try:
            if ObjectId.is_valid(assistant_id):
                query = {"_id": ObjectId(assistant_id)}
            else:
                query = {"public_id": assistant_id}
        except:
            query = {"public_id": assistant_id}
        
        assistant = await db[COLLECTION].find_one(query)
        
        if not assistant:
            raise HTTPException(status_code=404, detail="Assistant not found")
        
        # Extraire les informations de débogage des nœuds
        nodes_debug = []
        for node in assistant.get("nodes", []):
            node_debug = {
                "id": node.get("id"),
                "type": node.get("type"),
                "direct_properties": {
                    "is_partial_lead": node.get("is_partial_lead", False),
                    "is_complete_lead": node.get("is_complete_lead", False),
                    "is_final_node": node.get("is_final_node", False)
                },
                "data_properties": {
                    "is_partial_lead": node.get("data", {}).get("is_partial_lead", False),
                    "is_complete_lead": node.get("data", {}).get("is_complete_lead", False),
                    "is_final_node": node.get("data", {}).get("is_final_node", False)
                }
            }
            nodes_debug.append(node_debug)
        
        return {
            "assistant_id": assistant_id,
            "nodes_count": len(nodes_debug),
            "nodes": nodes_debug
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/public/{public_id}", response_class=HTMLResponse, include_in_schema=False)
async def get_public_assistant_legacy(public_id: str, request: Request):
    """
    Route de compatibilité pour les anciens liens - redirige vers la nouvelle URL
    """
    return HTMLResponse(
        f"""
        <html>
            <head>
                <meta http-equiv="refresh" content="0;url=/chat/{public_id}">
                <title>Redirection</title>
            </head>
            <body>
                <p>Redirection vers la nouvelle URL...</p>
                <script>window.location.href = "/chat/{public_id}";</script>
            </body>
        </html>
        """
    )

@router.get("/{public_id}/flow", response_model=dict)
async def get_assistant_flow(public_id: str, request: Request):
    """
    Récupère les données du flow pour un assistant public.
    """
    logger.info(f"🔍 Route GET /{public_id}/flow appelée - Récupération du flow pour l'assistant avec public_id: {public_id}")
    try:
        db = await get_database()
        collection = db[COLLECTION]
        
        # Récupérer l'assistant par son public_id
        logger.info(f"🔎 Recherche de l'assistant avec public_id: {public_id}")
        assistant = await collection.find_one({"public_id": public_id})
        
        if not assistant:
            logger.warning(f"❌ Assistant avec public_id {public_id} non trouvé")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé"
            )
        
        # Vérifier si l'assistant est publié
        logger.info(f"✅ Assistant trouvé, vérification du statut de publication")
        if not assistant.get("is_published", False):
            logger.warning(f"❌ Assistant avec public_id {public_id} n'est pas publié")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assistant non trouvé ou non publié"
            )
        
        # Convertir en format de réponse
        logger.info(f"🔄 Conversion des données de l'assistant en format de réponse")
        assistant_data = assistant_to_response(assistant)
        
        # Retourner uniquement les données nécessaires pour le flow
        flow_data = {
            "id": assistant_data["id"],
            "name": assistant_data["name"],
            "nodes": assistant_data["nodes"],
            "edges": assistant_data["edges"]
        }
        
        logger.info(f"✅ Données du flow récupérées avec succès pour l'assistant {public_id}")
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=jsonable_encoder(flow_data)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du flow de l'assistant: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de la récupération du flow de l'assistant"
        )

# Route pour le chat - à ajouter dans le fichier principal des routes
# @app.get("/chat/{public_id}", response_class=HTMLResponse)
# async def get_chat_page(public_id: str, request: Request):
#     """
#     Affiche la page de chat pour un assistant public.
#     """
#     try:
#         db = await get_database()
#         collection = db[COLLECTION]
#         
#         # Récupérer l'assistant par son public_id
#         assistant = await collection.find_one({"public_id": public_id})
#         
#         if not assistant:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Assistant non trouvé"
#             )
#         
#         # Vérifier si l'assistant est publié
#         if not assistant.get("is_published", False):
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Assistant non trouvé ou non publié"
#             )
#         
#         # Convertir en format de réponse
#         assistant_data = assistant_to_response(assistant)
#         
#         # Rendre le template HTML
#         return templates.TemplateResponse(
#             "chat.html",
#             {
#                 "request": request,
#                 "assistant": assistant_data,
#                 "base_url": str(request.base_url).rstrip('/')
#             }
#         )
#     
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Erreur lors de l'affichage de la page de chat: {str(e)}")
#         logger.error(traceback.format_exc())
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Une erreur est survenue lors de l'affichage de la page de chat"
#         )
