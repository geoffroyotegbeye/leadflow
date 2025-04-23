"""
API pour la gestion des analytics et des statistiques
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from app.models.session import AnalyticsOverview, AnalyticsResponse, LeadStatus, SessionStatus
from app.database.mongodb import get_database
from app.api.auth import get_current_user

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Collections MongoDB
ANALYTICS_COLLECTION = "analytics"
SESSIONS_COLLECTION = "sessions"
MESSAGES_COLLECTION = "messages"
ASSISTANTS_COLLECTION = "assistants"

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    days: int = Query(30, description="Nombre de jours à analyser"),
    assistant_id: Optional[str] = Query(None, description="ID de l'assistant à analyser"),
    user = Depends(get_current_user)
):
    """
    Récupère un aperçu des analytics pour tous les assistants ou un assistant spécifique.
    """
    try:
        db = await get_database()
        
        # Calculer la date de début
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Construire la requête
        match_query = {"date": {"$gte": start_date}}
        if assistant_id:
            match_query["assistant_id"] = assistant_id
        
        # Agréger les données
        pipeline = [
            {"$match": match_query},
            {"$group": {
                "_id": None,
                "sessions_count": {"$sum": "$sessions_count"},
                "leads_count": {"$sum": "$leads_count"},
                "partial_leads": {"$sum": "$partial_leads"},
                "complete_leads": {"$sum": "$complete_leads"},
                "abandoned_sessions": {"$sum": "$abandoned_sessions"},
                "completed_sessions": {"$sum": "$completed_sessions"},
                "messages_count": {"$sum": "$messages_count"}
            }}
        ]
        
        result = await db[ANALYTICS_COLLECTION].aggregate(pipeline).to_list(1)
        
        if not result:
            return AnalyticsOverview(
                total_sessions=0,
                active_sessions=0,
                completed_sessions=0,
                abandoned_sessions=0,
                total_leads=0,
                partial_leads=0,
                complete_leads=0,
                average_completion_percentage=0,
                average_session_duration=0
            )
        
        stats = result[0]
        
        # Calculer les métriques dérivées
        sessions_count = stats.get("sessions_count", 0)
        leads_count = stats.get("leads_count", 0)
        completed_sessions = stats.get("completed_sessions", 0)
        abandoned_sessions = stats.get("abandoned_sessions", 0)
        messages_count = stats.get("messages_count", 0)
        
        conversion_rate = (leads_count / sessions_count * 100) if sessions_count > 0 else 0
        completion_rate = (completed_sessions / sessions_count * 100) if sessions_count > 0 else 0
        abandonment_rate = (abandoned_sessions / sessions_count * 100) if sessions_count > 0 else 0
        messages_per_session = (messages_count / sessions_count) if sessions_count > 0 else 0
        
        # Récupérer la durée moyenne des sessions
        pipeline_duration = [
            {"$match": match_query},
            {"$unwind": "$session_durations"},
            {"$group": {
                "_id": None,
                "average_duration": {"$avg": "$session_durations"}
            }}
        ]
        
        duration_result = await db[ANALYTICS_COLLECTION].aggregate(pipeline_duration).to_list(1)
        average_session_duration = duration_result[0].get("average_duration", 0) if duration_result else 0
        
        return AnalyticsOverview(
            total_sessions=sessions_count,
            active_sessions=sessions_count - completed_sessions - abandoned_sessions,
            completed_sessions=completed_sessions,
            abandoned_sessions=abandoned_sessions,
            total_leads=leads_count,
            partial_leads=stats.get("partial_leads", 0),
            complete_leads=stats.get("complete_leads", 0),
            average_completion_percentage=round(completion_rate, 2),
            average_session_duration=round(average_session_duration, 2)
        )
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/time-series", response_model=Dict[str, List[Dict[str, Any]]])
async def get_analytics_time_series(
    days: int = Query(30, description="Nombre de jours à analyser"),
    assistant_id: Optional[str] = Query(None, description="ID de l'assistant à analyser"),
    user = Depends(get_current_user)
):
    """
    Récupère les données de séries temporelles pour les sessions et les leads.
    """
    try:
        db = await get_database()
        
        # Calculer la date de début
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Construire la requête de base
        match_query = {}
        if assistant_id:
            match_query["assistant_id"] = assistant_id
        
        # Récupérer les données de sessions par jour
        sessions_pipeline = [
            {"$match": {
                **match_query,
                "started_at": {"$gte": start_date}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": "$started_at"},
                    "month": {"$month": "$started_at"},
                    "day": {"$dayOfMonth": "$started_at"}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
        ]
        
        sessions_result = await db[SESSIONS_COLLECTION].aggregate(sessions_pipeline).to_list(100)
        
        # Récupérer les données de leads par jour
        leads_pipeline = [
            {"$match": {
                **match_query,
                "started_at": {"$gte": start_date},
                "lead_status": {"$in": [LeadStatus.PARTIAL, LeadStatus.COMPLETE]}
            }},
            {"$group": {
                "_id": {
                    "year": {"$year": "$started_at"},
                    "month": {"$month": "$started_at"},
                    "day": {"$dayOfMonth": "$started_at"},
                    "status": "$lead_status"
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}}
        ]
        
        leads_result = await db[SESSIONS_COLLECTION].aggregate(leads_pipeline).to_list(100)
        
        # Formater les résultats
        sessions_data = []
        for item in sessions_result:
            date_str = f"{item['_id']['year']}-{item['_id']['month']:02d}-{item['_id']['day']:02d}"
            sessions_data.append({
                "date": date_str,
                "count": item["count"]
            })
        
        leads_data = []
        for item in leads_result:
            date_str = f"{item['_id']['year']}-{item['_id']['month']:02d}-{item['_id']['day']:02d}"
            status = item["_id"]["status"]
            leads_data.append({
                "date": date_str,
                "status": status,
                "count": item["count"]
            })
        
        return {
            "sessions": sessions_data,
            "leads": leads_data
        }
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des séries temporelles: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/leads", response_model=List[Dict[str, Any]])
async def get_recent_leads(
    limit: int = Query(20, description="Nombre de leads à récupérer"),
    offset: int = Query(0, description="Offset pour la pagination"),
    assistant_id: Optional[str] = Query(None, description="ID de l'assistant à filtrer"),
    days: int = Query(30, description="Nombre de jours à analyser"),
    user = Depends(get_current_user)
):
    """
    Récupère les leads récents avec leurs informations.
    """
    try:
        db = await get_database()
        
        # Calculer la date de début
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Construire la requête
        match_query = {
            "started_at": {"$gte": start_date},
            "lead_status": {"$in": [LeadStatus.PARTIAL, LeadStatus.COMPLETE]}
        }
        
        if assistant_id:
            match_query["assistant_id"] = assistant_id
        
        # Récupérer les leads
        leads = await db[SESSIONS_COLLECTION].find(match_query).sort("started_at", -1).skip(offset).limit(limit).to_list(limit)
        
        # Enrichir les données avec les informations de l'assistant
        result = []
        for lead in leads:
            lead_id = str(lead["_id"])
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(lead["assistant_id"])})
            
            # Récupérer les messages pour extraire les données du formulaire
            messages = await db[MESSAGES_COLLECTION].find({
                "session_id": lead_id,
                "content_type": {"$in": ["form", "form_field"]}
            }).to_list(100)
            
            # Extraire les informations du lead
            lead_info = {}
            for message in messages:
                if message.get("metadata") and "field_name" in message["metadata"]:
                    field_name = message["metadata"]["field_name"]
                    field_value = message["content"]
                    lead_info[field_name] = field_value
            
            result.append({
                "id": lead_id,
                "assistant_name": assistant["name"] if assistant else "Assistant inconnu",
                "lead_status": lead["lead_status"],
                "created_at": lead["started_at"],
                "completion_percentage": lead.get("completion_percentage", 0),
                "lead_info": lead_info,
                "user_info": lead.get("user_info", {})
            })
        
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des leads: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/node-performance", response_model=List[Dict[str, Any]])
async def get_node_performance(
    assistant_id: str,
    days: int = Query(30, description="Nombre de jours à analyser"),
    user = Depends(get_current_user)
):
    """
    Récupère les performances par nœud pour un assistant spécifique.
    """
    try:
        db = await get_database()
        
        # Calculer la date de début
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Récupérer les données d'analytics
        analytics_data = await db[ANALYTICS_COLLECTION].find({
            "assistant_id": assistant_id,
            "date": {"$gte": start_date}
        }).to_list(100)
        
        # Agréger les données par nœud
        nodes_performance = {}
        
        for data in analytics_data:
            if "nodes" in data:
                for node_id, node_stats in data["nodes"].items():
                    if node_id not in nodes_performance:
                        nodes_performance[node_id] = {
                            "visits": 0,
                            "completions": 0,
                            "average_time": 0,
                            "times": []
                        }
                    
                    nodes_performance[node_id]["visits"] += node_stats.get("visits", 0)
                    nodes_performance[node_id]["completions"] += node_stats.get("completions", 0)
                    
                    if "times" in node_stats:
                        nodes_performance[node_id]["times"].extend(node_stats["times"])
        
        # Calculer les moyennes et formater les résultats
        result = []
        for node_id, stats in nodes_performance.items():
            # Récupérer les informations du nœud
            assistant = await db[ASSISTANTS_COLLECTION].find_one({"_id": ObjectId(assistant_id)})
            node_info = None
            
            if assistant and "nodes" in assistant:
                node_info = next((node for node in assistant["nodes"] if node.get("id") == node_id), None)
            
            # Calculer le temps moyen
            times = stats["times"]
            average_time = sum(times) / len(times) if times else 0
            
            # Calculer le taux de complétion
            completion_rate = (stats["completions"] / stats["visits"] * 100) if stats["visits"] > 0 else 0
            
            result.append({
                "node_id": node_id,
                "node_name": node_info.get("name", "Nœud inconnu") if node_info else "Nœud inconnu",
                "visits": stats["visits"],
                "completions": stats["completions"],
                "completion_rate": round(completion_rate, 2),
                "average_time": round(average_time, 2),
                "is_lead_node": node_info.get("is_partial_lead", False) or node_info.get("is_complete_lead", False) if node_info else False
            })
        
        # Trier par nombre de visites (décroissant)
        result.sort(key=lambda x: x["visits"], reverse=True)
        
        return result
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des performances par nœud: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/sources", response_model=List[Dict[str, Any]])
async def get_traffic_sources(
    days: int = Query(30, description="Nombre de jours à analyser"),
    assistant_id: Optional[str] = Query(None, description="ID de l'assistant à analyser"),
    user = Depends(get_current_user)
):
    """
    Récupère les sources de trafic pour tous les assistants ou un assistant spécifique.
    """
    try:
        db = await get_database()
        
        # Calculer la date de début
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Construire la requête
        match_query = {"date": {"$gte": start_date}}
        if assistant_id:
            match_query["assistant_id"] = assistant_id
        
        # Agréger les données
        pipeline = [
            {"$match": match_query},
            {"$project": {
                "sources": {"$objectToArray": {"$ifNull": ["$sources", {}]}}
            }},
            {"$unwind": "$sources"},
            {"$group": {
                "_id": "$sources.k",
                "count": {"$sum": "$sources.v"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        result = await db[ANALYTICS_COLLECTION].aggregate(pipeline).to_list(100)
        
        # Formater les résultats
        sources_data = []
        for item in result:
            sources_data.append({
                "source": item["_id"],
                "count": item["count"]
            })
        
        return sources_data
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des sources de trafic: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/responses", response_model=Dict[str, Dict[str, Dict[str, int]]])
async def get_user_responses(
    assistant_id: str,
    days: int = Query(30, description="Nombre de jours à analyser"),
    user = Depends(get_current_user)
):
    """
    Récupère les réponses des utilisateurs pour un assistant spécifique.
    """
    try:
        db = await get_database()
        
        # Calculer la date de début
        start_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        
        # Récupérer les données d'analytics
        analytics_data = await db[ANALYTICS_COLLECTION].find({
            "assistant_id": assistant_id,
            "date": {"$gte": start_date}
        }).to_list(100)
        
        # Agréger les réponses
        responses = {}
        
        for data in analytics_data:
            if "responses" in data:
                for node_id, fields in data["responses"].items():
                    if node_id not in responses:
                        responses[node_id] = {}
                    
                    for field_name, values in fields.items():
                        if field_name not in responses[node_id]:
                            responses[node_id][field_name] = {}
                        
                        for value, count in values.items():
                            if value not in responses[node_id][field_name]:
                                responses[node_id][field_name][value] = 0
                            
                            responses[node_id][field_name][value] += count
        
        return responses
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des réponses utilisateurs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")
