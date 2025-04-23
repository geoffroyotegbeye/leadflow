"""
Service pour la gestion des analytics et le suivi des conversations
"""
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.session import LeadStatus, SessionStatus

# Collections MongoDB
SESSIONS_COLLECTION = "sessions"
MESSAGES_COLLECTION = "messages"
STEPS_COLLECTION = "session_steps"
ASSISTANTS_COLLECTION = "assistants"
ANALYTICS_COLLECTION = "analytics"

class AnalyticsService:
    """
    Service pour gérer les analytics des conversations et des leads
    """
    
    @staticmethod
    async def track_session_start(session_id: str, assistant_id: str, user_info: Optional[Dict[str, Any]] = None):
        """
        Enregistre le début d'une session et met à jour les analytics
        """
        db = await get_database()
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Mettre à jour les compteurs d'analytics pour aujourd'hui
        await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            {
                "$inc": {
                    "sessions_count": 1,
                    "active_sessions": 1
                },
                "$setOnInsert": {
                    "leads_count": 0,
                    "partial_leads": 0,
                    "complete_leads": 0,
                    "abandoned_sessions": 0,
                    "completed_sessions": 0
                }
            },
            upsert=True
        )
        
        # Enregistrer la source du trafic si disponible
        if user_info and "source" in user_info:
            await db[ANALYTICS_COLLECTION].update_one(
                {"date": today, "assistant_id": assistant_id},
                {
                    "$inc": {
                        f"sources.{user_info['source']}": 1
                    }
                }
            )
    
    @staticmethod
    async def track_message(session_id: str, message_type: str, node_id: Optional[str] = None):
        """
        Enregistre un message et met à jour les analytics
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        assistant_id = session["assistant_id"]
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Mettre à jour les compteurs de messages
        await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            {
                "$inc": {
                    "messages_count": 1,
                    f"messages_by_type.{message_type}": 1
                }
            },
            upsert=True
        )
        
        # Si c'est un message avec un node_id, mettre à jour les statistiques du nœud
        if node_id:
            await db[ANALYTICS_COLLECTION].update_one(
                {"date": today, "assistant_id": assistant_id},
                {
                    "$inc": {
                        f"nodes.{node_id}.visits": 1
                    }
                }
            )
    
    @staticmethod
    async def track_lead_status_change(session_id: str, new_status: str):
        """
        Enregistre un changement de statut de lead
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        assistant_id = session["assistant_id"]
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Mettre à jour les compteurs selon le nouveau statut
        update_data = {}
        
        if new_status == LeadStatus.PARTIAL:
            update_data = {
                "$inc": {
                    "partial_leads": 1,
                    "leads_count": 1
                }
            }
        elif new_status == LeadStatus.COMPLETE:
            update_data = {
                "$inc": {
                    "complete_leads": 1
                }
            }
            
            # Si c'était déjà un lead partiel, ne pas incrémenter le compteur total
            if session.get("lead_status") != LeadStatus.PARTIAL:
                update_data["$inc"]["leads_count"] = 1
        
        if update_data:
            await db[ANALYTICS_COLLECTION].update_one(
                {"date": today, "assistant_id": assistant_id},
                update_data,
                upsert=True
            )
    
    @staticmethod
    async def track_session_end(session_id: str, status: str):
        """
        Enregistre la fin d'une session
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        assistant_id = session["assistant_id"]
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Calculer la durée de la session
        started_at = session.get("started_at")
        ended_at = datetime.utcnow()
        duration_seconds = (ended_at - started_at).total_seconds() if started_at else 0
        
        # Mettre à jour les compteurs selon le statut
        update_data = {
            "$inc": {
                "active_sessions": -1
            },
            "$push": {
                "session_durations": duration_seconds
            }
        }
        
        if status == SessionStatus.COMPLETED:
            update_data["$inc"]["completed_sessions"] = 1
        elif status == SessionStatus.ABANDONED:
            update_data["$inc"]["abandoned_sessions"] = 1
        
        await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            update_data,
            upsert=True
        )
    
    @staticmethod
    async def track_node_completion(session_id: str, node_id: str, time_spent: float):
        """
        Enregistre la complétion d'un nœud et le temps passé
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        assistant_id = session["assistant_id"]
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Mettre à jour les statistiques du nœud
        await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            {
                "$inc": {
                    f"nodes.{node_id}.completions": 1,
                },
                "$push": {
                    f"nodes.{node_id}.times": time_spent
                }
            },
            upsert=True
        )
    
    @staticmethod
    async def track_user_response(session_id: str, node_id: str, field_name: str, response_value: str):
        """
        Enregistre une réponse utilisateur pour les analytics
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        assistant_id = session["assistant_id"]
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Mettre à jour les compteurs de réponses
        await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            {
                "$inc": {
                    f"responses.{node_id}.{field_name}.{response_value}": 1
                }
            },
            upsert=True
        )

# Créer une instance du service
analytics_service = AnalyticsService()
