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
from app.db.mongodb import get_database

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

assistant_router = APIRouter()

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
        logger.error(f"Erreur lors de la conversion du document MongoDB: {e}")
        logger.error(traceback.format_exc())
        raise

@assistant_router.post("/assistants", response_model=AssistantResponse, status_code=status.HTTP_201_CREATED)
async def create_assistant(assistant: AssistantCreate, request: Request):
    """Créer un nouvel assistant"""
    try:
        logger.info(f"Création d'un nouvel assistant: {assistant.name}")
        db = get_database()

        assistant_dict = assistant.dict()
        assistant_dict["created_at"] = datetime.utcnow()
        assistant_dict["updated_at"] = datetime.utcnow()

        # --- AJOUT AUTO D'UN NŒUD DE DÉBUT SI ABSENT ---
        if not assistant_dict.get("nodes") or len(assistant_dict["nodes"]) == 0:
            assistant_dict["nodes"] = [
                {
                    "id": "start",
                    "label": "Node start",
                    "type": "custom",
                    "elements": [],
                    "position": {"x": -343.5, "y": 67.5},
                    "color": None,
                    "data": {
                        "label": "Démarrage",
                        "type": "start",
                        "elements": [
                            {
                                "id": "msg-bonjour",
                                "type": "text",
                                "content": "Bonjour 👋, je suis votre assistant virtuel. Prêt à démarrer ?",
                                "displayMode": "after"
                            }
                        ]
                    },
                    "width": 300,
                    "height": 356
                }
            ]
            logger.info("Nœud de début (start) complet injecté automatiquement à l'assistant.")
        # ------------------------------------------------

        # Vérifier la taille des données
        assistant_json = jsonable_encoder(assistant_dict)
        data_size = len(json.dumps(assistant_json))
        logger.info(f"Taille des données à insérer: {data_size} octets")

        # Vérifier la structure des nodes et edges pour éviter les erreurs de validation
        for i, node in enumerate(assistant_dict.get("nodes", [])):
            if not node.get("id"):
                logger.error(f"Node {i} manque l'attribut 'id'")
                raise HTTPException(status_code=422, detail=f"Node {i} manque l'attribut 'id'")
            if not node.get("label"):
                logger.error(f"Node {i} (id: {node.get('id')}) manque l'attribut 'label'")
                raise HTTPException(status_code=422, detail=f"Node {i} (id: {node.get('id')}) manque l'attribut 'label'")
            # Vérifier les éléments
            elements = node.get("elements", [])
            for j, element in enumerate(elements):
                if not element.get("id"):
                    logger.error(f"Element {j} du node {node.get('id')} manque l'attribut 'id'")
                    raise HTTPException(status_code=422, detail=f"Element {j} du node {node.get('id')} manque l'attribut 'id'")
                if not element.get("type"):
                    logger.error(f"Element {j} (id: {element.get('id')}) du node {node.get('id')} manque l'attribut 'type'")
                    raise HTTPException(status_code=422, detail=f"Element {j} (id: {element.get('id')}) du node {node.get('id')} manque l'attribut 'type'")
                if not element.get("content") and element.get("type") != "form":
                    logger.error(f"Element {j} (id: {element.get('id')}) du node {node.get('id')} manque l'attribut 'content'")
                    raise HTTPException(status_code=422, detail=f"Element {j} (id: {element.get('id')}) du node {node.get('id')} manque l'attribut 'content'")

        # Insérer dans MongoDB
        result = await db[COLLECTION].insert_one(assistant_dict)
        logger.info(f"Assistant créé avec l'ID: {result.inserted_id}")
        
        # Récupérer l'assistant créé
        created_assistant = await db[COLLECTION].find_one({"_id": result.inserted_id})
        if not created_assistant:
            logger.error(f"Assistant créé mais impossible de le récupérer avec l'ID: {result.inserted_id}")
            raise HTTPException(status_code=500, detail="Erreur lors de la récupération de l'assistant créé")
        
        return assistant_to_response(created_assistant)
    except ConnectionError as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        raise HTTPException(status_code=503, detail="Service indisponible: impossible de se connecter à la base de données")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'assistant: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de l'assistant: {str(e)}")

@assistant_router.get("/assistants", response_model=List[AssistantResponse])
async def get_assistants(request: Request):
    """Récupérer tous les assistants"""
    try:
        logger.info("Récupération de tous les assistants")
        db = get_database()
        assistants = []
        
        # Utiliser un timeout pour la requête MongoDB
        cursor = db[COLLECTION].find().max_time_ms(30000)
        
        count = 0
        async for assistant in cursor:
            try:
                assistants.append(assistant_to_response(assistant))
                count += 1
            except Exception as e:
                logger.error(f"Erreur lors du traitement de l'assistant {assistant.get('_id', 'inconnu')}: {e}")
                # Continuer avec les autres assistants même si l'un d'eux pose problème
        logger.info(f"{count} assistants récupérés avec succès")
        return assistants
    except ConnectionError as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        raise HTTPException(status_code=503, detail="Service indisponible: impossible de se connecter à la base de données")
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des assistants: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des assistants: {str(e)}")

@assistant_router.get("/assistants/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(assistant_id: str, request: Request):
    """Récupérer un assistant par son ID"""
    try:
        logger.info(f"Récupération de l'assistant avec ID: {assistant_id}")
        db = get_database()
        
        # Validation de l'ID
        try:
            obj_id = ObjectId(assistant_id)
        except bson_errors.InvalidId as e:
            logger.error(f"ID d'assistant invalide: {assistant_id} - {e}")
            raise HTTPException(status_code=400, detail="ID d'assistant invalide")
        
        # Récupération de l'assistant avec timeout
        try:
            assistant = await db[COLLECTION].find_one({"_id": obj_id}, max_time_ms=10000)
        except Exception as e:
            logger.error(f"Erreur lors de la requête MongoDB: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de l'accès à la base de données")
        
        if assistant is None:
            logger.warning(f"Assistant non trouvé: {assistant_id}")
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        logger.info(f"Assistant {assistant_id} récupéré avec succès")
        # Utilise jsonable_encoder pour sérialiser correctement les champs datetime/ObjectId
        return jsonable_encoder(assistant_to_response(assistant))
    except HTTPException:
        # Ré-émettre les exceptions HTTP déjà générées
        raise
    except ConnectionError as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        raise HTTPException(status_code=503, detail="Service indisponible: impossible de se connecter à la base de données")
    except Exception as e:
        logger.error(f"Erreur inattendue lors de la récupération de l'assistant {assistant_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l'assistant: {str(e)}")

@assistant_router.put("/assistants/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(assistant_id: str, assistant_update: AssistantUpdate, request: Request):
    """Mettre à jour un assistant"""
    db = get_database()
    
    try:
        # Validation de l'ID
        try:
            obj_id = ObjectId(assistant_id)
            logger.info(f"Tentative de mise à jour de l'assistant: {assistant_id}")
        except bson_errors.InvalidId:
            logger.error(f"ID d'assistant invalide: {assistant_id}")
            raise HTTPException(status_code=400, detail="ID d'assistant invalide")
        
        # Vérifier si l'assistant existe
        existing = await db[COLLECTION].find_one({"_id": obj_id})
        if existing is None:
            logger.error(f"Assistant non trouvé: {assistant_id}")
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Préparer les données de mise à jour
        update_data = {k: v for k, v in assistant_update.dict(exclude_unset=True).items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Vérifier la taille des données - utiliser jsonable_encoder pour gérer les datetime
        update_data_json = jsonable_encoder(update_data)
        data_size = len(json.dumps(update_data_json))
        logger.info(f"Taille des données à mettre à jour: {data_size} octets")
        
        # Vérifier si les données sont trop volumineuses (limite MongoDB de 16MB)
        if data_size > 15 * 1024 * 1024:  # 15MB pour laisser une marge
            logger.error(f"Données trop volumineuses: {data_size} octets")
            raise HTTPException(
                status_code=413, 
                detail="Les données sont trop volumineuses. Essayez de réduire la complexité du leadflowchart."
            )
        
        # Mise à jour dans MongoDB
        update_result = await db[COLLECTION].update_one(
            {"_id": obj_id},
            {"$set": update_data}
        )
        
        if update_result.modified_count == 0 and update_result.matched_count > 0:
            logger.warning(f"Aucune modification effectuée pour l'assistant: {assistant_id}")
        elif update_result.modified_count > 0:
            logger.info(f"Assistant mis à jour avec succès: {assistant_id}")
        
        # Récupérer l'assistant mis à jour
        updated_assistant = await db[COLLECTION].find_one({"_id": obj_id})
        if not updated_assistant:
            logger.error(f"Impossible de récupérer l'assistant après mise à jour: {assistant_id}")
            raise HTTPException(status_code=500, detail="Erreur lors de la récupération de l'assistant mis à jour")
        
        return jsonable_encoder(assistant_to_response(updated_assistant))
    except HTTPException:
        raise
    except ConnectionError as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        raise HTTPException(status_code=503, detail="Service indisponible: impossible de se connecter à la base de données")
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de l'assistant {assistant_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")

@assistant_router.delete("/assistants/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assistant(assistant_id: str, request: Request):
    """Supprimer un assistant"""
    try:
        logger.info(f"Tentative de suppression de l'assistant: {assistant_id}")
        db = get_database()
        
        # Validation de l'ID
        try:
            obj_id = ObjectId(assistant_id)
        except bson_errors.InvalidId as e:
            logger.error(f"ID d'assistant invalide: {assistant_id} - {e}")
            raise HTTPException(status_code=400, detail="ID d'assistant invalide")
        
        # Vérifier si l'assistant existe
        existing = await db[COLLECTION].find_one({"_id": obj_id})
        if existing is None:
            logger.warning(f"Tentative de suppression d'un assistant inexistant: {assistant_id}")
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Supprimer l'assistant
        delete_result = await db[COLLECTION].delete_one({"_id": obj_id})
        
        if delete_result.deleted_count == 0:
            logger.error(f"Échec de la suppression de l'assistant {assistant_id} malgré son existence")
            raise HTTPException(status_code=500, detail="Échec de la suppression pour une raison inconnue")
        
        logger.info(f"Assistant {assistant_id} supprimé avec succès")
        return JSONResponse(status_code=204, content=None)
    except HTTPException:
        raise
    except ConnectionError as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        raise HTTPException(status_code=503, detail="Service indisponible: impossible de se connecter à la base de données")
    except Exception as e:
        logger.error(f"Erreur lors de la suppression de l'assistant {assistant_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")

@assistant_router.post("/assistants/import", response_model=AssistantResponse, status_code=status.HTTP_201_CREATED)
async def import_assistant(request: Request, assistant_data: Dict[str, Any] = Body(...)):
    """Importer un assistant depuis un fichier JSON"""
    try:
        logger.info(f"Tentative d'importation d'un assistant depuis JSON")
        
        # Vérifier les champs obligatoires
        if "name" not in assistant_data:
            raise HTTPException(status_code=422, detail="Le champ 'name' est obligatoire")
        
        # Préparer les données pour la création
        assistant_dict = {
            "name": assistant_data.get("name"),
            "description": assistant_data.get("description", ""),
            "nodes": [],
            "edges": []
        }
        
        # Traiter les nodes
        if "nodes" in assistant_data:
            for node_data in assistant_data["nodes"]:
                # Vérifier les champs obligatoires
                if "id" not in node_data:
                    raise HTTPException(status_code=422, detail=f"Un node manque l'attribut 'id'")
                if "label" not in node_data:
                    node_data["label"] = "Node " + node_data["id"] # Ajouter un label par défaut
                
                # Assurer que elements est une liste
                if "elements" not in node_data:
                    node_data["elements"] = []
                
                # Vérifier les éléments
                for element in node_data.get("elements", []):
                    if "id" not in element:
                        element["id"] = f"element-{datetime.utcnow().timestamp()}" # Générer un ID
                    if "type" not in element:
                        element["type"] = "text" # Type par défaut
                    if "content" not in element and element.get("type") != "form":
                        element["content"] = "" # Contenu vide par défaut
                
                assistant_dict["nodes"].append(node_data)
        
        # Traiter les edges
        if "edges" in assistant_data:
            for edge_data in assistant_data["edges"]:
                # Vérifier les champs obligatoires
                if "id" not in edge_data:
                    raise HTTPException(status_code=422, detail=f"Un edge manque l'attribut 'id'")
                if "source" not in edge_data:
                    raise HTTPException(status_code=422, detail=f"Edge {edge_data.get('id')} manque l'attribut 'source'")
                if "target" not in edge_data:
                    raise HTTPException(status_code=422, detail=f"Edge {edge_data.get('id')} manque l'attribut 'target'")
                
                assistant_dict["edges"].append(edge_data)
        
        # Créer l'assistant
        db = get_database()
        
        # Ajouter les timestamps
        assistant_dict["created_at"] = datetime.utcnow()
        assistant_dict["updated_at"] = datetime.utcnow()
        
        # Insérer dans MongoDB
        result = await db[COLLECTION].insert_one(assistant_dict)
        logger.info(f"Assistant importé avec l'ID: {result.inserted_id}")
        
        # Récupérer l'assistant créé
        created_assistant = await db[COLLECTION].find_one({"_id": result.inserted_id})
        if not created_assistant:
            logger.error(f"Assistant créé mais impossible de le récupérer avec l'ID: {result.inserted_id}")
            raise HTTPException(status_code=500, detail="Erreur lors de la récupération de l'assistant importé")
        
        return assistant_to_response(created_assistant)
    except HTTPException:
        raise
    except ConnectionError as e:
        logger.error(f"Erreur de connexion à MongoDB: {e}")
        raise HTTPException(status_code=503, detail="Service indisponible: impossible de se connecter à la base de données")
    except Exception as e:
        logger.error(f"Erreur lors de l'importation de l'assistant: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'importation de l'assistant: {str(e)}")
