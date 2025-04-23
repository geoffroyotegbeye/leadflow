from fastapi import APIRouter, HTTPException, Depends, status, Request, Body
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from bson import ObjectId
from datetime import datetime, timedelta
import logging
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

@router.post("/sessions", response_model=SessionResponse)
async def create_session(session: SessionCreate, request: Request):
    """
    Crée une nouvelle session pour un assistant.
    """
    try:
        db = get_database()
        
        # Vérifier si l'assistant existe
        assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(session.assistant_id)})
        if not assistant:
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Créer la session
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
        await analytics_service.track_session_start(session_id, session.assistant_id, session.user_info)
        
        return session_to_response(new_session)
    except Exception as e:
        logger.error(f"Erreur lors de la création de la session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def add_message(session_id: str, message: MessageCreate, request: Request):
    """
    Ajoute un message à une session existante et met à jour le statut de la session.
    """
    try:
        db = get_database()
        
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
            session_id, 
            str(message.content_type), 
            message.node_id
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
                    
                    if current_node.get("is_partial_lead", False) and session["lead_status"] == LeadStatus.NONE:
                        update_data["lead_status"] = LeadStatus.PARTIAL
                        new_lead_status = LeadStatus.PARTIAL
                    
                    if current_node.get("is_complete_lead", False):
                        update_data["lead_status"] = LeadStatus.COMPLETE
                        new_lead_status = LeadStatus.COMPLETE
                        
                    # Enregistrer le changement de statut de lead pour les analytics
                    if new_lead_status:
                        await analytics_service.track_lead_status_change(session_id, new_lead_status)
                    
                    # Si c'est un node final, marquer la session comme complétée
                    session_status = None
                    if current_node.get("is_final_node", False):
                        update_data["status"] = SessionStatus.COMPLETED
                        update_data["ended_at"] = datetime.utcnow()
                        session_status = SessionStatus.COMPLETED
                
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
                
                # Mettre à jour la session
                await db[SESSIONS_COLLECTION].update_one(
                    {"_id": ObjectId(session_id)},
                    {"$set": update_data}
                )
                
                # Si la session est terminée, enregistrer la fin pour les analytics
                if session_status:
                    await analytics_service.track_session_end(session_id, session_status)
        
        return message_to_response(new_message)
    except Exception as e:
        logger.error(f"Erreur lors de l'ajout du message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.put("/sessions/{session_id}/end", response_model=SessionResponse)
async def end_session(session_id: str, request: Request):
    """
    Termine une session active.
    """
    try:
        db = get_database()
        
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

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, request: Request):
    """
    Récupère les détails d'une session.
    """
    try:
        db = get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session non trouvée")
        
        return session_to_response(session)
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de la session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(session_id: str, request: Request):
    """
    Récupère tous les messages d'une session.
    """
    try:
        db = get_database()
        
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

@router.get("/assistants/{assistant_id}/sessions", response_model=List[SessionResponse])
async def get_assistant_sessions(assistant_id: str, request: Request):
    """
    Récupère toutes les sessions d'un assistant.
    """
    try:
        db = get_database()
        
        # Vérifier si l'assistant existe
        assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(assistant_id)})
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

@router.get("/assistants/{assistant_id}/analytics", response_model=AnalyticsResponse)
async def get_assistant_analytics(assistant_id: str, request: Request, days: int = 30):
    """
    Récupère les analytiques pour un assistant spécifique.
    """
    try:
        db = get_database()
        
        # Vérifier si l'assistant existe
        assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(assistant_id)})
        if not assistant:
            raise HTTPException(status_code=404, detail="Assistant non trouvé")
        
        # Période d'analyse
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Récupérer les statistiques de base
        total_sessions = await db[SESSIONS_COLLECTION].count_documents({
            "assistant_id": assistant_id
        })
        
        active_sessions = await db[SESSIONS_COLLECTION].count_documents({
            "assistant_id": assistant_id,
            "status": SessionStatus.ACTIVE
        })
        
        completed_sessions = await db[SESSIONS_COLLECTION].count_documents({
            "assistant_id": assistant_id,
            "status": SessionStatus.COMPLETED
        })
        
        abandoned_sessions = await db[SESSIONS_COLLECTION].count_documents({
            "assistant_id": assistant_id,
            "status": SessionStatus.ABANDONED
        })
        
        partial_leads = await db[SESSIONS_COLLECTION].count_documents({
            "assistant_id": assistant_id,
            "lead_status": LeadStatus.PARTIAL
        })
        
        complete_leads = await db[SESSIONS_COLLECTION].count_documents({
            "assistant_id": assistant_id,
            "lead_status": LeadStatus.COMPLETE
        })
        
        total_leads = partial_leads + complete_leads
        
        # Calculer le pourcentage moyen de complétion
        completion_pipeline = [
            {"$match": {"assistant_id": assistant_id}},
            {"$group": {"_id": None, "avg_completion": {"$avg": "$completion_percentage"}}}
        ]
        completion_result = await db[SESSIONS_COLLECTION].aggregate(completion_pipeline).to_list(length=1)
        average_completion = completion_result[0]["avg_completion"] if completion_result else 0
        
        # Calculer la durée moyenne des sessions
        duration_pipeline = [
            {
                "$match": {
                    "assistant_id": assistant_id,
                    "status": SessionStatus.COMPLETED,
                    "started_at": {"$ne": None},
                    "ended_at": {"$ne": None}
                }
            },
            {
                "$project": {
                    "duration_seconds": {
                        "$divide": [
                            {"$subtract": ["$ended_at", "$started_at"]},
                            1000
                        ]
                    }
                }
            },
            {"$group": {"_id": None, "avg_duration": {"$avg": "$duration_seconds"}}}
        ]
        duration_result = await db[SESSIONS_COLLECTION].aggregate(duration_pipeline).to_list(length=1)
        average_duration = duration_result[0]["avg_duration"] if duration_result else 0
        
        # Sessions par jour
        sessions_by_day = {}
        for i in range(days):
            day = (end_date - timedelta(days=i)).strftime("%Y-%m-%d")
            sessions_by_day[day] = 0
        
        day_pipeline = [
            {
                "$match": {
                    "assistant_id": assistant_id,
                    "started_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$started_at"}
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        day_results = await db[SESSIONS_COLLECTION].aggregate(day_pipeline).to_list(length=days)
        
        for result in day_results:
            sessions_by_day[result["_id"]] = result["count"]
        
        # Leads par jour
        leads_by_day = {}
        for i in range(days):
            day = (end_date - timedelta(days=i)).strftime("%Y-%m-%d")
            leads_by_day[day] = 0
        
        leads_pipeline = [
            {
                "$match": {
                    "assistant_id": assistant_id,
                    "lead_status": {"$in": [LeadStatus.PARTIAL, LeadStatus.COMPLETE]},
                    "started_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {"format": "%Y-%m-%d", "date": "$started_at"}
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        leads_results = await db[SESSIONS_COLLECTION].aggregate(leads_pipeline).to_list(length=days)
        
        for result in leads_results:
            leads_by_day[result["_id"]] = result["count"]
        
        # Complétion par node
        completion_by_node = []
        if "nodes" in assistant:
            for node in assistant["nodes"]:
                node_id = node.get("id")
                if node_id:
                    node_visits = await db[STEPS_COLLECTION].count_documents({
                        "node_id": node_id,
                        "session_id": {"$in": [str(s["_id"]) for s in await db[SESSIONS_COLLECTION].find({"assistant_id": assistant_id}).to_list(length=1000)]}
                    })
                    
                    completion_by_node.append({
                        "node_id": node_id,
                        "node_label": node.get("data", {}).get("label", "Node sans nom"),
                        "visits": node_visits,
                        "completion_rate": (node_visits / total_sessions) * 100 if total_sessions > 0 else 0
                    })
        
        # Réponses populaires (pour les formulaires et sélections)
        popular_responses = []
        form_messages = await db[MESSAGES_COLLECTION].find({
            "sender": MessageSender.USER,
            "content_type": {"$in": [MessageContentType.FORM, MessageContentType.QUICK_REPLY]},
            "session_id": {"$in": [str(s["_id"]) for s in await db[SESSIONS_COLLECTION].find({"assistant_id": assistant_id}).to_list(length=1000)]}
        }).to_list(length=1000)
        
        response_counts = {}
        for msg in form_messages:
            if msg.get("metadata"):
                for key, value in msg["metadata"].items():
                    response_key = f"{msg.get('node_id', 'unknown')}:{key}"
                    if response_key not in response_counts:
                        response_counts[response_key] = {}
                    
                    if value not in response_counts[response_key]:
                        response_counts[response_key][value] = 0
                    
                    response_counts[response_key][value] += 1
        
        for response_key, counts in response_counts.items():
            node_id, field = response_key.split(":", 1)
            
            # Trouver le label du node
            node_label = "Node inconnu"
            if "nodes" in assistant:
                node = next((n for n in assistant["nodes"] if n.get("id") == node_id), None)
                if node:
                    node_label = node.get("data", {}).get("label", "Node sans nom")
            
            popular_responses.append({
                "node_id": node_id,
                "node_label": node_label,
                "field": field,
                "responses": [{"value": k, "count": v} for k, v in sorted(counts.items(), key=lambda x: x[1], reverse=True)]
            })
        
        # Temps moyen par node
        time_by_node = []
        if "nodes" in assistant:
            for node in assistant["nodes"]:
                node_id = node.get("id")
                if node_id:
                    # Récupérer toutes les étapes pour ce node
                    steps = await db[STEPS_COLLECTION].find({
                        "node_id": node_id,
                        "session_id": {"$in": [str(s["_id"]) for s in await db[SESSIONS_COLLECTION].find({"assistant_id": assistant_id}).to_list(length=1000)]}
                    }).sort("timestamp", 1).to_list(length=1000)
                    
                    # Calculer le temps passé sur chaque node
                    total_time = 0
                    count = 0
                    
                    for i, step in enumerate(steps):
                        if i < len(steps) - 1 and steps[i]["session_id"] == steps[i+1]["session_id"]:
                            time_diff = (steps[i+1]["timestamp"] - step["timestamp"]).total_seconds()
                            if time_diff < 3600:  # Ignorer les différences de plus d'une heure (probablement une déconnexion)
                                total_time += time_diff
                                count += 1
                    
                    avg_time = total_time / count if count > 0 else 0
                    
                    time_by_node.append({
                        "node_id": node_id,
                        "node_label": node.get("data", {}).get("label", "Node sans nom"),
                        "average_time_seconds": avg_time
                    })
        
        # Construire la réponse
        overview = {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "completed_sessions": completed_sessions,
            "abandoned_sessions": abandoned_sessions,
            "total_leads": total_leads,
            "partial_leads": partial_leads,
            "complete_leads": complete_leads,
            "average_completion_percentage": average_completion,
            "average_session_duration": average_duration
        }
        
        return {
            "overview": overview,
            "sessions_by_day": sessions_by_day,
            "leads_by_day": leads_by_day,
            "completion_by_node": completion_by_node,
            "popular_responses": popular_responses,
            "average_time_by_node": time_by_node
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des analytiques: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
