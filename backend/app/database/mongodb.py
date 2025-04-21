from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration de la base de données
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "leadflow")

# Client MongoDB global
client: Optional[AsyncIOMotorClient] = None

async def get_database():
    """
    Retourne une instance de la base de données MongoDB.
    Crée une connexion si elle n'existe pas déjà.
    """
    global client
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URL)
    return client[DB_NAME]

async def close_mongo_connection():
    """
    Ferme la connexion à MongoDB.
    À appeler lors de l'arrêt de l'application.
    """
    global client
    if client is not None:
        client.close()
        client = None
