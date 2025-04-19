import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Variables pour la connexion MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "leadcx")

# Client MongoDB global
mongo_client = None
mongo_db = None

async def connect_to_mongo():
    """Établir la connexion à MongoDB"""
    global mongo_client, mongo_db
    try:
        print(f"🔄 Tentative de connexion à MongoDB: {MONGO_URL}")
        mongo_client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Vérifier la connexion
        await mongo_client.admin.command('ping')
        print(f"✅ Connexion à MongoDB établie - Base de données: {MONGO_DB_NAME}")
        
        mongo_db = mongo_client[MONGO_DB_NAME]
        return mongo_db
    except ServerSelectionTimeoutError as e:
        print(f"❌ Timeout lors de la connexion à MongoDB: {e}")
        print("⚠️ Vérifiez que le serveur MongoDB est en cours d'exécution sur l'hôte et le port spécifiés.")
        raise
    except ConnectionFailure as e:
        print(f"❌ Impossible de se connecter à MongoDB: {e}")
        raise
    except Exception as e:
        print(f"❌ Erreur inattendue lors de la connexion à MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Fermer la connexion à MongoDB"""
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("✅ Connexion à MongoDB fermée")

def get_database():
    """Récupérer l'instance de la base de données"""
    global mongo_db
    if mongo_db is None:
        print("⚠️ Tentative d'accès à la base de données avant l'initialisation de la connexion")
        raise ConnectionError("La connexion à MongoDB n'a pas été établie")
    return mongo_db
