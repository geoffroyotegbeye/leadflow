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
CONVERSATIONS_COLLECTION = "conversations"
STEPS_COLLECTION = "session_steps"
ASSISTANTS_COLLECTION = "assistants"
ANALYTICS_COLLECTION = "analytics"
USER_RESPONSES_COLLECTION = "user_responses"
QA_PAIRS_COLLECTION = "qa_pairs"
FORM_SUBMISSIONS_COLLECTION = "form_submissions"

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
        
        print(f" [Analytics] Début de session {session_id} pour l'assistant {assistant_id}")
        
        # Mettre à jour les compteurs d'analytics pour aujourd'hui
        # On incrémente abandoned_sessions et partial_leads par défaut
        # Ces compteurs seront décrémentés si la session se termine correctement
        await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            {
                "$inc": {
                    "sessions_count": 1,
                    "active_sessions": 1,
                    "abandoned_sessions": 1,  # Pré-incrémentation
                    "partial_leads": 1       # Pré-incrémentation
                },
                "$setOnInsert": {
                    "leads_count": 0,
                    "complete_leads": 0,
                    "completed_sessions": 0
                }
            },
            upsert=True
        )
        
        print(f" [Analytics] Session {session_id} marquée comme potentiellement abandonnée et lead partiel par défaut")
        
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
    async def track_message(session_id: str, message_type: str, content: str, is_question: bool, node_id: Optional[str] = None):
        print("[DEBUG] >>> track_message called", session_id, message_type, content, is_question, node_id)
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            print(f"[track_message] Session {session_id} introuvable !")
            return
        
        assistant_id = session["assistant_id"]
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Détection du type de message (formulaire ou non)
        is_form = message_type == "form"
        
        # On déduit sender côté backend : si is_question=True => sender="bot", sinon sender="user"
        sender = "bot" if is_question else "user"
        
        # Identification explicite des flags is_form et is_question
        is_form = message_type == "form"
        is_question_flag = bool(is_question)
        
        if not is_question_flag and sender == "user":
            # On retrouve la dernière question (du bot) sans réponse pour ce node/session
            last_qa_pair = await db[QA_PAIRS_COLLECTION].find_one({
                "session_id": session_id,
                "node_id": node_id,
                "is_question": True,
                "answer": None
            }, sort=[("timestamp", -1)])
            answer_text = content
            if last_qa_pair:
                # Met à jour le doc QA_PAIR avec la réponse et is_question à False
                await db[QA_PAIRS_COLLECTION].update_one(
                    {"_id": last_qa_pair["_id"]},
                    {"$set": {"answer": answer_text, "is_form": is_form, "is_question": False}}
                )
                print(f"[track_message] QA_PAIR (update): {last_qa_pair['_id']} <- {answer_text}")
            else:
                # Optionnel : insérer un doc orphelin si aucune question trouvée
                pass
        
        # On conserve l'insertion classique dans conversations pour l'historique complet
        conversation_doc = {
            "session_id": session_id,
            "content": content,
            "sender": sender,
            "timestamp": datetime.utcnow(),
            "content_type": message_type,
            "is_question": is_question_flag,
            "is_form": is_form,
            "node_id": node_id
        }
        print(f"[track_message] Insertion dans {CONVERSATIONS_COLLECTION}: {conversation_doc}")
        await db[CONVERSATIONS_COLLECTION].insert_one(conversation_doc)
        
        # Si c'est une question (bot ou formulaire), enregistrer aussi dans QA_PAIRS_COLLECTION
        if is_question_flag:
            doc = {
                "question": content,
                "answer": None,
                "is_form": is_form,
                "is_question": True,
                "node_id": node_id,
                "session_id": session_id,
                "timestamp": datetime.utcnow()
            }
            print(f"[track_message] QA_PAIR (question): {doc}")
            await db[QA_PAIRS_COLLECTION].insert_one(doc)
        
        # Mettre à jour les compteurs d'analytics
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
        
        print(f" [Analytics] Enregistrement du changement de statut de lead pour la session {session_id}: {new_status}")
        print(f" [Analytics] NOTE: Les compteurs de leads ne sont plus mis à jour ici, mais uniquement lors de la fin de session")
        
        # Nous ne mettons plus à jour les compteurs ici, car nous le faisons uniquement 
        # lors de la fin de session réussie (track_session_end)
        
        # Mettre à jour uniquement le statut de lead dans la session
        await db[SESSIONS_COLLECTION].update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"lead_status": new_status}}
        )
        
        print(f" [Analytics] Statut de lead mis à jour pour la session {session_id}: {new_status}")
    
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
        
        print(f" [Analytics] Enregistrement de la fin de session {session_id} avec statut: {status}")
        
        # Calculer la durée de la session
        started_at = session.get("started_at")
        ended_at = datetime.utcnow()
        duration_seconds = (ended_at - started_at).total_seconds() if started_at else 0
        
        print(f" [Analytics] Durée de la session: {duration_seconds} secondes")
        
        # Récupérer les analytics actuels pour calculer la nouvelle durée moyenne et le taux de complétion
        analytics = await db[ANALYTICS_COLLECTION].find_one({"date": today, "assistant_id": assistant_id})
        
        # Calculer la nouvelle durée moyenne
        avg_duration = 0
        sessions_count = 0
        completion_rate = 0
        
        if analytics:
            # Récupérer la durée moyenne actuelle et le nombre de sessions
            avg_duration = analytics.get("avg_session_duration", 0)
            completed_sessions = analytics.get("completed_sessions", 0)
            abandoned_sessions = analytics.get("abandoned_sessions", 0)
            total_sessions = analytics.get("sessions_count", 0)
            
            # Calculer le nombre de sessions terminées (complétées + abandonnées)
            sessions_count = completed_sessions + abandoned_sessions
            
            # Calculer la nouvelle durée moyenne
            if sessions_count > 0:
                # Calculer la nouvelle moyenne: ((moyenne actuelle * nb sessions) + nouvelle durée) / (nb sessions + 1)
                total_duration = avg_duration * sessions_count
                new_total_duration = total_duration + duration_seconds
                new_sessions_count = sessions_count + 1
                avg_duration = new_total_duration / new_sessions_count
                print(f" [Analytics] Nouvelle durée moyenne: {avg_duration:.2f} secondes (après {new_sessions_count} sessions)")
            else:
                # Première session terminée
                avg_duration = duration_seconds
                print(f" [Analytics] Première durée moyenne: {avg_duration:.2f} secondes")
            
            # Calculer le nouveau taux de complétion
            if status == SessionStatus.COMPLETED:
                # Si cette session est complétée, incrémenter le nombre de sessions complétées
                new_completed_sessions = completed_sessions + 1
            else:
                new_completed_sessions = completed_sessions
            
            # Le taux de complétion est le pourcentage de sessions complétées par rapport au total
            if total_sessions > 0:
                completion_rate = (new_completed_sessions / total_sessions) * 100
                print(f" [Analytics] Nouveau taux de complétion: {completion_rate:.2f}% ({new_completed_sessions}/{total_sessions} sessions)")
        else:
            # Première session terminée
            avg_duration = duration_seconds
            print(f" [Analytics] Première durée moyenne: {avg_duration:.2f} secondes")
            
            # Pour la première session, le taux de complétion est soit 100% (si complétée) soit 0% (si abandonnée)
            if status == SessionStatus.COMPLETED:
                completion_rate = 100
                print(f" [Analytics] Premier taux de complétion: 100% (1/1 session)")
            else:
                completion_rate = 0
                print(f" [Analytics] Premier taux de complétion: 0% (0/1 session)")
        
        # Mettre à jour les compteurs selon le statut
        update_data = {
            "$inc": {
                "active_sessions": -1
            },
            "$set": {
                "avg_session_duration": avg_duration,
                "completion_rate": completion_rate
            },
            "$push": {
                "session_durations": duration_seconds
            }
        }
        
        if status == SessionStatus.COMPLETED:
            # Si la session est complétée, on décrémente abandoned_sessions (qui a été incrémenté au début)
            # et on incrémente completed_sessions, complete_leads et leads_count
            update_data["$inc"]["completed_sessions"] = 1
            update_data["$inc"]["abandoned_sessions"] = -1  # Décrémentation car ce n'est plus une session abandonnée
            update_data["$inc"]["partial_leads"] = -1       # Décrémentation car ce n'est plus un lead partiel
            update_data["$inc"]["complete_leads"] = 1        # Incrémentation des leads complets
            update_data["$inc"]["leads_count"] = 1           # Incrémentation du nombre total de leads
            print(f" [Analytics] Session {session_id} marquée comme complétée pour l'assistant {assistant_id}")
            print(f" [Analytics] Décrémentation des compteurs abandoned_sessions et partial_leads")
            print(f" [Analytics] Incrémentation des compteurs complete_leads et leads_count")
        elif status == SessionStatus.ABANDONED:
            # Si la session est déjà marquée comme abandonnée au début, on ne fait rien de plus pour abandoned_sessions
            # car le compteur a déjà été incrémenté lors de la création de la session
            print(f" [Analytics] Session {session_id} confirmée comme abandonnée pour l'assistant {assistant_id}")
        
        result = await db[ANALYTICS_COLLECTION].update_one(
            {"date": today, "assistant_id": assistant_id},
            update_data,
            upsert=True
        )
        print(f" [Analytics] Résultat de la mise à jour: {result.modified_count} document(s) modifié(s)")
    
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
        
        # Créer le document de réponse utilisateur
        user_response_doc = {
            "session_id": session_id,
            "node_id": node_id,
            "field_name": field_name,
            "response_value": response_value,
            "timestamp": datetime.utcnow()
        }
        
        # Insérer la réponse dans la collection user_responses
        await db[USER_RESPONSES_COLLECTION].insert_one(user_response_doc)
        
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
        
        # Mettre à jour la session avec la référence à la réponse
        await db[SESSIONS_COLLECTION].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {
                    "user_responses_ids": str(user_response_doc["_id"])
                }
            }
        )
    
    @staticmethod
    async def track_question_answer(session_id: str, question: str, answer: str, node_id: Optional[str] = None):
        """
        Enregistre une paire question/réponse pour les analytics et l'affichage
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        # Créer le document de question/réponse
        qa_doc = {
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "timestamp": datetime.utcnow()
        }
        
        if node_id:
            qa_doc["node_id"] = node_id
        
        # Insérer la paire Q/R dans la collection qa_pairs
        result = await db[QA_PAIRS_COLLECTION].insert_one(qa_doc)
        
        # Mettre à jour la session avec la référence à la paire Q/R
        await db[SESSIONS_COLLECTION].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {
                    "qa_pairs_ids": str(result.inserted_id)
                }
            }
        )
        
        # Mettre à jour le statut du lead si nécessaire
        # Si nous avons au moins une paire question/réponse, le lead est au moins partiel
        await AnalyticsService.track_lead_status_change(session_id, LeadStatus.PARTIAL)
    
    @staticmethod
    async def track_form_submission(session_id: str, form_data: Dict[str, Any], node_id: str = None):
        """
        Enregistre une soumission de formulaire complète
        """
        db = await get_database()
        
        # Récupérer la session
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return
        
        # Créer le document de soumission de formulaire
        form_doc = {
            "session_id": session_id,
            "form_data": form_data,
            "timestamp": datetime.utcnow()
        }
        
        if node_id:
            form_doc["node_id"] = node_id
        
        # Insérer la soumission dans la collection form_submissions
        result = await db[FORM_SUBMISSIONS_COLLECTION].insert_one(form_doc)
        
        # Mettre à jour la session avec la référence à la soumission
        await db[SESSIONS_COLLECTION].update_one(
            {"_id": ObjectId(session_id)},
            {
                "$push": {
                    "form_submissions_ids": str(result.inserted_id)
                }
            }
        )
        
        # Mettre à jour le statut du lead
        # Si nous avons une soumission de formulaire, le lead est complet
        await AnalyticsService.track_lead_status_change(session_id, LeadStatus.COMPLETE)
    
    @staticmethod
    async def get_session_interactions(session_id: str):
        """
        Récupère toutes les interactions d'une session (conversations, Q/R, formulaires)
        """
        db = await get_database()
        
        # Récupérer la session avec toutes les interactions
        session = await db[SESSIONS_COLLECTION].find_one({"_id": ObjectId(session_id)})
        if not session:
            return None
        
        # Récupérer les conversations
        conversations = await db[CONVERSATIONS_COLLECTION].find(
            {"session_id": session_id}
        ).sort("timestamp", 1).to_list(length=1000)
        
        # Récupérer les questions/réponses
        qa_pairs = []
        if "qa_pairs_ids" in session:
            qa_ids = session.get("qa_pairs_ids", [])
            for qa_id in qa_ids:
                qa = await db[QA_PAIRS_COLLECTION].find_one({"_id": ObjectId(qa_id)})
                if qa:
                    qa_pairs.append(qa)
        
        # Récupérer les réponses utilisateur
        user_responses = []
        if "user_responses_ids" in session:
            response_ids = session.get("user_responses_ids", [])
            for response_id in response_ids:
                response = await db[USER_RESPONSES_COLLECTION].find_one({"_id": ObjectId(response_id)})
                if response:
                    user_responses.append(response)
        
        # Récupérer les soumissions de formulaire
        form_submissions = []
        if "form_submissions_ids" in session:
            form_ids = session.get("form_submissions_ids", [])
            for form_id in form_ids:
                form = await db[FORM_SUBMISSIONS_COLLECTION].find_one({"_id": ObjectId(form_id)})
                if form:
                    form_submissions.append(form)
        
        # Préparer les données à retourner
        return {
            "session_info": {
                "id": str(session["_id"]),
                "assistant_id": session["assistant_id"],
                "started_at": session.get("started_at"),
                "ended_at": session.get("ended_at"),
                "status": session.get("status"),
                "lead_status": session.get("lead_status")
            },
            "conversations": [
                {
                    "id": str(msg["_id"]),
                    "content": msg["content"],
                    "sender": msg["sender"],
                    "timestamp": msg["timestamp"],
                    "content_type": msg.get("content_type", "text"),
                    "is_question": msg.get("is_question", False)
                } for msg in conversations
            ],
            "user_responses": [
                {
                    "id": str(resp["_id"]),
                    "node_id": resp["node_id"],
                    "field_name": resp["field_name"],
                    "response_value": resp["response_value"],
                    "timestamp": resp["timestamp"]
                } for resp in user_responses
            ],
            "qa_pairs": [
                {
                    "id": str(qa["_id"]),
                    "question": qa["question"],
                    "answer": qa["answer"],
                    "node_id": qa.get("node_id"),
                    "timestamp": qa["timestamp"]
                } for qa in qa_pairs
            ],
            "form_submissions": [
                {
                    "id": str(form["_id"]),
                    "form_data": form["form_data"],
                    "node_id": form.get("node_id"),
                    "timestamp": form["timestamp"]
                } for form in form_submissions
            ],
            "user_info": session.get("user_info", {}),
            "lead_info": session.get("lead_info", {})
        }

# Créer une instance du service
analytics_service = AnalyticsService()
