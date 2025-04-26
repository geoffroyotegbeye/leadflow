from fastapi import APIRouter, HTTPException, Depends, status, Request, Body
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timedelta
import logging
import traceback
from app.models.session import (
    SessionCreate, MessageCreate, SessionStepCreate,
    SessionResponse, MessageResponse, SessionStepResponse,
    SessionStatus, LeadStatus, MessageSender, MessageContentType,
    AnalyticsOverview, AnalyticsResponse
)
from app.database.mongodb import get_database
from app.api.auth import get_current_user
from app.services.analytics_service import analytics_service

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("session_api")
logger.setLevel(logging.DEBUG)

router = APIRouter()

# Collections MongoDB
SESSIONS_COLLECTION = "sessions"
MESSAGES_COLLECTION = "messages"
STEPS_COLLECTION = "session_steps"
ASSISTANTS_COLLECTION = "assistants"
ANALYTICS_COLLECTION = "analytics"

# Convertir un document MongoDB en modèle de réponse
def session_to_response(session: Dict[str, Any]) -> Dict[str, Any]:
    session_id = str(session["_id"])
    return {
        "id": session_id,
        "assistant_id": session.get("assistant_id"),
        "user_id": session.get("user_id"),
        "user_info": session.get("user_info"),
        "status": session.get("status", SessionStatus.ACTIVE),
        "lead_status": session.get("lead_status", LeadStatus.NONE),
        "current_node_id": session.get("current_node_id"),
        "started_at": session.get("started_at", datetime.utcnow()),
        "ended_at": session.get("ended_at"),
        "completion_percentage": session.get("completion_percentage", 0.0)
    }

def message_to_response(message: Dict[str, Any]) -> Dict[str, Any]:
    message_id = str(message["_id"])
    return {
        "id": message_id,
        "session_id": message.get("session_id"),
        "sender": message.get("sender"),
        "content": message.get("content"),
        "content_type": message.get("content_type", MessageContentType.TEXT),
        "node_id": message.get("node_id"),
        "metadata": message.get("metadata"),
        "timestamp": message.get("timestamp", datetime.utcnow())
    }

def step_to_response(step: Dict[str, Any]) -> Dict[str, Any]:
    step_id = str(step["_id"])
    return {
        "id": step_id,
        "session_id": step.get("session_id"),
        "node_id": step.get("node_id"),
        "timestamp": step.get("timestamp", datetime.utcnow()),
        "is_completed": step.get("is_completed", True)
    }

@router.post("/", response_model=SessionResponse)
async def create_session(session: SessionCreate, request: Request):
    """
    Crée une nouvelle session pour un assistant.
    """
    logger.info(f"🔍 Route POST / appelée - Création d'une session pour l'assistant: {session.assistant_id}")
    logger.info(f"📋 Données reçues: {session.dict()}")
    
    try:
        db = await get_database()
        
        # Vérifier si l'assistant existe
        logger.info(f"🔎 Vérification de l'existence de l'assistant: {session.assistant_id}")
        try:
            # Essayer de trouver l'assistant par son ID MongoDB
            object_id = ObjectId(session.assistant_id)
            logger.info(f"🔄 ObjectId créé avec succès: {object_id}")
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": object_id})
            logger.info(f"🔍 Résultat de la recherche par _id: {assistant is not None}")
            
            # Si l'assistant n'est pas trouvé par son ID MongoDB, essayer de le trouver par son public_id
            if not assistant and session.user_info and "public_id" in session.user_info:
                public_id = session.user_info["public_id"]
                logger.info(f"🔄 Tentative de recherche par public_id: {public_id}")
                assistant = await db[ASSISTANTS_COLLECTION].find_one({"public_id": public_id})
                logger.info(f"🔍 Résultat de la recherche par public_id: {assistant is not None}")
                
                # Si l'assistant est trouvé par son public_id, mettre à jour l'assistant_id dans la session
                if assistant:
                    logger.info(f"✅ Assistant trouvé par public_id, mise à jour de l'assistant_id")
                    session.assistant_id = str(assistant["_id"])
        except Exception as e:
            logger.error(f"❌ Erreur lors de la recherche de l'assistant: {str(e)}")
            if session.user_info and "public_id" in session.user_info:
                public_id = session.user_info["public_id"]
                logger.info(f"🔄 Tentative de recherche par public_id après erreur: {public_id}")
                assistant = await db[ASSISTANTS_COLLECTION].find_one({"public_id": public_id})
                logger.info(f"🔍 Résultat de la recherche par public_id: {assistant is not None}")
                
                # Si l'assistant est trouvé par son public_id, mettre à jour l'assistant_id dans la session
                if assistant:
                    logger.info(f"✅ Assistant trouvé par public_id, mise à jour de l'assistant_id")
                    session.assistant_id = str(assistant["_id"])
                else:
                    logger.error(f"❌ Assistant non trouvé par public_id")
                    raise HTTPException(status_code=404, detail="Assistant non trouvé")
            else:
                logger.error(f"❌ Erreur lors de la conversion de l'ID en ObjectId et pas de public_id disponible: {str(e)}")
                raise HTTPException(status_code=400, detail=f"ID d'assistant invalide: {str(e)}")
        
        if not assistant:
            logger.warning(f"❌ Assistant avec ID {session.assistant_id} non trouvé")
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Créer la session
        logger.info(f"📝 Création d'une nouvelle session pour l'assistant: {session.assistant_id}")
        new_session = {
            "assistant_id": session.assistant_id,
            "user_id": session.user_id,
            "user_info": session.user_info,
            "status": SessionStatus.ACTIVE,
            "lead_status": LeadStatus.NONE,
            "started_at": datetime.utcnow(),
            "completion_percentage": 0.0
        }
        
        result = await db[SESSIONS_COLLECTION].insert_one(new_session)
        new_session["_id"] = result.inserted_id
        
        # Enregistrer le début de session pour les analytics
        session_id = str(result.inserted_id)
        logger.info(f"📊 Enregistrement du début de session {session_id} pour les analytics")
        await analytics_service.track_session_start(session_id, session.assistant_id, session.user_info)
        
        logger.info(f"✅ Session créée avec succès: {session_id}")
        return session_to_response(new_session)
    except Exception as e:
        logger.error(f"Erreur lors de la création de la session: {str(e)}")
        logger.error(f"Type d'erreur: {type(e).__name__}")
        logger.error(f"Détails de la requête: {request.url}")
        # logger.error(f"Corps de la requête: {await request.json()}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.post("/{session_id}/messages", response_model=MessageResponse)
async def add_message(session_id: str, message: MessageCreate, request: Request):
    """
    Ajoute un message à une session existante et met à jour le statut de la session.
    """
    try:
        db = await get_database()
        
        # Vérifier si la session existe
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        # Créer le message
        new_message = {
            "session_id": session_id,
            "sender": message.sender,
            "content": message.content,
            "content_type": message.content_type,
            "node_id": message.node_id,
            "metadata": message.metadata,
            "timestamp": datetime.utcnow()
        }
        
        result = await db[MESSAGES_COLLECTION].insert_one(new_message)
        new_message["_id"] = result.inserted_id
        
        # Enregistrer le message pour les analytics
        await analytics_service.track_message(
            session_id=session_id,
            message_type=str(message.content_type),
            content=message.content,
            sender=message.sender,
            node_id=message.node_id,
            is_question=getattr(message, 'is_question', False)
        )
        
        # Si c'est un message utilisateur avec un node_id, mettre à jour l'étape
        if message.sender == MessageSender.USER and message.node_id:
            # Vérifier si le node est critique pour le statut de lead
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(session["assistant_id"])})
            if assistant and "nodes" in assistant:
                nodes = assistant["nodes"]
                current_node = next((node for node in nodes if node.get("id") == message.node_id), None)
                
                # Mettre à jour le statut de lead si nécessaire
                update_data = {"current_node_id": message.node_id}
                
                if current_node:
                    # Vérifier les propriétés du node pour le statut de lead
                    new_lead_status = None
                    
                    # Ajouter des logs pour déboguer
                    logger.info(f"🔍 Vérification du nœud {message.node_id} pour le statut de lead")
                    logger.info(f"📊 Propriétés du nœud: is_partial_lead={current_node.get('is_partial_lead', False)}, is_complete_lead={current_node.get('is_complete_lead', False)}, is_final_node={current_node.get('is_final_node', False)}")
                    logger.info(f"📊 Propriétés du nœud (data): is_partial_lead={current_node.get('data', {}).get('is_partial_lead', False)}, is_complete_lead={current_node.get('data', {}).get('is_complete_lead', False)}, is_final_node={current_node.get('data', {}).get('is_final_node', False)}")
                    
                    # Vérifier d'abord dans les propriétés directes du nœud
                    if current_node.get("is_partial_lead", False) and session["lead_status"] == LeadStatus.NONE:
                        update_data["lead_status"] = LeadStatus.PARTIAL
                        new_lead_status = LeadStatus.PARTIAL
                        logger.info(f"✅ Nœud marqué comme lead partiel (propriété directe)")
                    
                    if current_node.get("is_complete_lead", False):
                        update_data["lead_status"] = LeadStatus.COMPLETE
                        new_lead_status = LeadStatus.COMPLETE
                        logger.info(f"✅ Nœud marqué comme lead complet (propriété directe)")
                    
                    # Vérifier également dans l'objet data du nœud
                    if not new_lead_status and current_node.get("data", {}).get("is_partial_lead", False) and session["lead_status"] == LeadStatus.NONE:
                        update_data["lead_status"] = LeadStatus.PARTIAL
                        new_lead_status = LeadStatus.PARTIAL
                        logger.info(f"✅ Nœud marqué comme lead partiel (propriété data)")
                    
                    if not new_lead_status or new_lead_status == LeadStatus.PARTIAL:
                        if current_node.get("data", {}).get("is_complete_lead", False):
                            update_data["lead_status"] = LeadStatus.COMPLETE
                            new_lead_status = LeadStatus.COMPLETE
                            logger.info(f"✅ Nœud marqué comme lead complet (propriété data)")
                    
                    # Enregistrer le changement de statut de lead pour les analytics
                    if new_lead_status:
                        logger.info(f"📈 Enregistrement du changement de statut de lead: {new_lead_status}")
                        await analytics_service.track_lead_status_change(session_id, new_lead_status)
                    
                    # Si c'est un node final, marquer la session comme complétée
                    session_status = None
                    
                    # Vérifier d'abord dans les propriétés directes du nœud
                    if current_node.get("is_final_node", False):
                        update_data["status"] = SessionStatus.COMPLETED
                        update_data["ended_at"] = datetime.utcnow()
                        session_status = SessionStatus.COMPLETED
                        logger.info(f"✅ Nœud marqué comme final (propriété directe)")
                    
                    # Vérifier également dans l'objet data du nœud
                    if not session_status and current_node.get("data", {}).get("is_final_node", False):
                        update_data["status"] = SessionStatus.COMPLETED
                        update_data["ended_at"] = datetime.utcnow()
                        session_status = SessionStatus.COMPLETED
                        logger.info(f"✅ Nœud marqué comme final (propriété data)")
                
                # Calculer le temps passé sur ce nœud
                time_spent = 0
                last_step = await db[STEPS_COLLECTION].find_one(
                    {"session_id": session_id},
                    sort=[("timestamp", -1)]
                )
                
                current_time = datetime.utcnow()
                if last_step:
                    time_spent = (current_time - last_step["timestamp"]).total_seconds()
                
                # Enregistrer l'étape
                new_step = {
                    "session_id": session_id,
                    "node_id": message.node_id,
                    "is_completed": True,
                    "timestamp": current_time
                }
                await db[STEPS_COLLECTION].insert_one(new_step)
                
                # Enregistrer la complétion du nœud pour les analytics
                await analytics_service.track_node_completion(session_id, message.node_id, time_spent)
                
                # Calculer le pourcentage de complétion
                if assistant and "nodes" in assistant:
                    total_nodes = len(assistant["nodes"])
                    completed_steps = await db[STEPS_COLLECTION].count_documents({
                        "session_id": session_id,
                        "is_completed": True
                    })
                    
                    if total_nodes > 0:
                        update_data["completion_percentage"] = min(100.0, (completed_steps / total_nodes) * 100)
                
                # Mettre à jour la session avec les nouvelles informations
                if update_data:
                    logger.info(f"📝 Mise à jour de la session {session_id} avec: {update_data}")
                    await db[SESSIONS_COLLECTION].update_one(
                        {"_id": ObjectId(session_id)},
                        {"$set": update_data}
                    )
                    
                    # Si le statut de la session a changé, enregistrer pour les analytics
                    if session_status:
                        logger.info(f"📈 Enregistrement du changement de statut de session: {session_status}")
                        await analytics_service.track_session_end(session_id, session_status)
        
        return message_to_response(new_message)
    except Exception as e:
        logger.error(f"Erreur lors de l'ajout du message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.post("/{session_id}/nodes/{node_id}/viewed")
async def mark_node_viewed(session_id: str, node_id: str, request: Request):
    """
    Marque un nœud comme vu par l'utilisateur et enregistre cette information pour les analytics.
    """
    try:
        db = await get_database()
        
        # Vérifier si la session existe
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        # Enregistrer l'étape dans la collection des étapes
        step_data = {
            "session_id": session_id,
            "node_id": node_id,
            "timestamp": datetime.utcnow(),
            "is_completed": False
        }
        
        await db[STEPS_COLLECTION].insert_one(step_data)
        
        # Mettre à jour les analytics
        await analytics_service.track_node_completion(session_id, node_id, 0)
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Erreur lors du marquage du nœud comme vu: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.put("/{session_id}/end", response_model=SessionResponse)
async def end_session(session_id: str, request: Request):
    """
    Termine une session active.
    """
    try:
        db = await get_database()
        
        # Vérifier si la session existe
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        # Mettre à jour la session
        update_data = {
            "status": SessionStatus.COMPLETED,
            "ended_at": datetime.utcnow()
        }
        
        await db[SESSIONS_COLLECTION].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": update_data}
        )
        
        # Enregistrer la fin de session pour les analytics
        await analytics_service.track_session_end(session_id, SessionStatus.COMPLETED)
        
        # Récupérer la session mise à jour
        updated_session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        
        return session_to_response(updated_session)
    except Exception as e:
        logger.error(f"Erreur lors de la fin de la session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, request: Request):
    """
    Récupère les détails d'une session.
    """
    try:
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        return session_to_response(session)
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de la session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(session_id: str, request: Request):
    """
    Récupère tous les messages d'une session.
    """
    try:
        db = await get_database()
        
        # Vérifier si la session existe
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        # Récupérer les messages
        messages = []
        async for message in db[MESSAGES_COLLECTION].find({"session_id": session_id}).sort("timestamp", 1):
            messages.append(message_to_response(message))
        
        return messages
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/by-assistant/{assistant_id}/leads", response_model=List[Dict[str, Any]])
async def get_assistant_leads(assistant_id: str, request: Request, lead_type: str = "complete"):
    """
    Récupère tous les leads (complets ou partiels) d'un assistant avec leurs conversations.
    """
    try:
        db = await get_database()
        
        # Vérifier si l'assistant existe
        assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(assistant_id)})
        if not assistant:
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"public_id": assistant_id})
        
        if not assistant:
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Déterminer le statut de lead à filtrer
        lead_status = LeadStatus.COMPLETE if lead_type == "complete" else LeadStatus.PARTIAL
        
        # Récupérer les sessions avec le statut de lead spécifié
        sessions = []
        async for session in db[SESSIONS_COLLECTION].find({
            "assistant_id": str(assistant["_id"]),
            "lead_status": lead_status
        }).sort("started_at", -1):
            session_data = session_to_response(session)
            
            # Récupérer les messages de cette session
            messages = []
            async for message in db[MESSAGES_COLLECTION].find({"session_id": session_data["id"]}).sort("timestamp", 1):
                messages.append(message_to_response(message))
            
            # Ajouter les messages à la session
            session_data["messages"] = messages
            sessions.append(session_data)
        
        return sessions
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des leads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/by-assistant/{assistant_id}", response_model=List[SessionResponse])
async def get_assistant_sessions(assistant_id: str, request: Request):
    """
    Récupère toutes les sessions d'un assistant.
    """
    try:
        db = await get_database()
        
        # Vérifier si l'assistant existe
        assistant = None
        try:
            # Essayer d'abord avec l'ObjectId
            object_id = ObjectId(assistant_id)
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": object_id})
            if assistant:
                # Si trouvé par ObjectId, utiliser cet ID pour la recherche des sessions
                assistant_id = str(assistant["_id"])
        except Exception as e:
            logger.info(f"L'ID {assistant_id} n'est pas un ObjectId valide, tentative avec public_id")
            
        # Si non trouvé par ObjectId, essayer avec public_id
        if not assistant:
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"public_id": assistant_id})
            if not assistant:
                # Essayer avec un ID court (sans le préfixe)
                assistant = await db[ASSISTANTS_COLLECTION].find_one({"public_id": {"$regex": f".*{assistant_id}$"}})
            
            if assistant:
                # Si trouvé par public_id, utiliser l'ObjectId pour la recherche des sessions
                assistant_id = str(assistant["_id"])
        
        if not assistant:
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Récupérer les sessions
        sessions = []
        async for session in db[SESSIONS_COLLECTION].find({"assistant_id": assistant_id}).sort("started_at", -1):
            sessions.append(session_to_response(session))
        
        return sessions
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/by-assistant/{assistant_id}/analytics", response_model=AnalyticsResponse)
async def get_assistant_analytics(assistant_id: str, request: Request, days: int = 30):
    """
    Récupère les analytics pour un assistant spécifique
    """
    try:
        db = request.app.state.db
        
        # Convertir en ObjectId si c'est un ID MongoDB valide
        try:
            if ObjectId.is_valid(assistant_id):
                query_id = ObjectId(assistant_id)
                assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": query_id})
                if assistant and "public_id" in assistant:
                    public_id = assistant["public_id"]
                else:
                    public_id = str(query_id)
            else:
                # Rechercher l'assistant par public_id pour obtenir son _id
                assistant = await db[ASSISTANTS_COLLECTION].find_one({"public_id": assistant_id})
                if not assistant:
                    raise HTTPException(status_code=404, detail="Assistant not found")
                query_id = assistant["_id"]
                public_id = assistant_id
        except Exception as e:
            logger.error(f"Erreur lors de la conversion de l'ID d'assistant: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid assistant ID format: {str(e)}")
        
        logger.info(f"🔍 Récupération des analytics pour l'assistant: ID={assistant_id}, query_id={query_id}, public_id={public_id}")
        
        # Calculer la date de début pour la période spécifiée
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Récupérer les données d'analytiques pour la période
        analytics_data = await db[ANALYTICS_COLLECTION].find({
            "assistant_id": {"$in": [str(query_id), public_id]},
            "date": {"$gte": start_date.strftime("%Y-%m-%d"), "$lte": end_date.strftime("%Y-%m-%d")}
        }).to_list(1000)
        
        logger.info(f"📊 Données d'analytiques trouvées: {len(analytics_data)} documents")
        
        # Initialiser les compteurs
        total_sessions = 0
        active_sessions = 0
        completed_sessions = 0
        abandoned_sessions = 0
        total_leads = 0
        partial_leads = 0
        complete_leads = 0
        session_durations = []
        
        # Agréger les données d'analytiques
        for item in analytics_data:
            total_sessions += item.get("sessions_count", 0)
            active_sessions += item.get("active_sessions", 0)
            completed_sessions += item.get("completed_sessions", 0)
            abandoned_sessions += item.get("abandoned_sessions", 0)
            total_leads += item.get("leads_count", 0)
            partial_leads += item.get("partial_leads", 0)
            complete_leads += item.get("complete_leads", 0)
            session_durations.extend(item.get("session_durations", []))
        
        # Calculer les métriques dérivées
        avg_completion_percentage = 0
        if total_sessions > 0:
            avg_completion_percentage = (completed_sessions / total_sessions) * 100
        
        avg_session_duration = 0
        if session_durations:
            avg_session_duration = sum(session_durations) / len(session_durations)
        
        conversion_rate = 0
        if total_sessions > 0:
            conversion_rate = (total_leads / total_sessions) * 100
        
        completion_rate = 0
        if total_leads > 0:
            completion_rate = (complete_leads / total_leads) * 100
        
        # Préparer l'objet overview
        overview = {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "completed_sessions": completed_sessions,
            "abandoned_sessions": abandoned_sessions,
            "total_leads": total_leads,
            "partial_leads": partial_leads,
            "complete_leads": complete_leads,
            "avg_completion_percentage": avg_completion_percentage,
            "avg_session_duration": avg_session_duration,
            "conversion_rate": conversion_rate,
            "completion_rate": completion_rate
        }
        
        logger.info(f"📊 Overview calculé: {overview}")
        
        # Récupérer les données par jour
        sessions_by_day = {}
        leads_by_day = {}
        
        for i in range(days):
            date = (end_date - timedelta(days=i)).strftime("%Y-%m-%d")
            sessions_by_day[date] = 0
            leads_by_day[date] = 0
        
        for item in analytics_data:
            date = item.get("date")
            if date in sessions_by_day:
                sessions_by_day[date] += item.get("sessions_count", 0)
                leads_by_day[date] += item.get("leads_count", 0)
        
        # Récupérer les données de performance par nœud
        completion_by_node = {}
        time_by_node = {}
        
        for item in analytics_data:
            node_completions = item.get("node_completions", {})
            for node_id, data in node_completions.items():
                if node_id not in completion_by_node:
                    completion_by_node[node_id] = {"completions": 0, "times": []}
                
                completion_by_node[node_id]["completions"] += data.get("completions", 0)
                completion_by_node[node_id]["times"].extend(data.get("times", []))
        
        # Calculer le temps moyen par nœud
        for node_id, data in completion_by_node.items():
            times = data.get("times", [])
            if times:
                time_by_node[node_id] = sum(times) / len(times)
            else:
                time_by_node[node_id] = 0
        
        # Récupérer les réponses populaires
        popular_responses = {}
        
        for item in analytics_data:
            user_responses = item.get("user_responses", {})
            for node_id, responses in user_responses.items():
                if node_id not in popular_responses:
                    popular_responses[node_id] = {}
                
                for response, count in responses.items():
                    if response not in popular_responses[node_id]:
                        popular_responses[node_id][response] = 0
                    
                    popular_responses[node_id][response] += count
        
        # Récupérer les sessions récentes avec statut de lead
        recent_leads = await db[SESSIONS_COLLECTION].find({
            "assistant_id": {"$in": [str(query_id), public_id]},
            "lead_status": {"$in": [LeadStatus.PARTIAL, LeadStatus.COMPLETE]},
            "started_at": {"$gte": start_date, "$lte": end_date}
        }).sort("started_at", -1).limit(10).to_list(10)
        
        # Convertir les ObjectId en string pour la sérialisation JSON
        for lead in recent_leads:
            lead["_id"] = str(lead["_id"])
            if "user_id" in lead and isinstance(lead["user_id"], ObjectId):
                lead["user_id"] = str(lead["user_id"])
        
        logger.info(f"📊 Leads récents trouvés: {len(recent_leads)}")
        
        return {
            "overview": overview,
            "sessions_by_day": sessions_by_day,
            "leads_by_day": leads_by_day,
            "completion_by_node": completion_by_node,
            "popular_responses": popular_responses,
            "average_time_by_node": time_by_node,
            "recent_leads": recent_leads
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
