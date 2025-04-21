from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import assistant_router
from app.db.mongodb import connect_to_mongo, close_mongo_connection
import logging
import time
import traceback

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("leadflow-api")

app = FastAPI(
    title="leadflow API",
    description="API pour la gestion des assistants conversationnels leadflow",
    version="1.0.0"
)

# Middleware pour compresser les réponses (utile pour les gros objets JSON)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configuration CORS pour permettre les requêtes depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Encoding"],
    max_age=600  # 10 minutes de cache pour les requêtes preflight
)

# Middleware pour logger les requêtes et les temps de réponse
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log de la requête entrante
    logger.info(f"Requête entrante: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log du temps de traitement
        logger.info(f"Requête traitée: {request.method} {request.url.path} - Statut: {response.status_code} - Temps: {process_time:.4f}s")
        
        return response
    except Exception as e:
        # Log de l'erreur
        logger.error(f"Erreur lors du traitement de la requête {request.method} {request.url.path}: {str(e)}")
        logger.error(traceback.format_exc())
        
        # Retourner une réponse d'erreur
        return JSONResponse(
            status_code=500,
            content={"detail": "Une erreur interne s'est produite lors du traitement de la requête"}
        )

# Inclure les routes de l'API
app.include_router(assistant_router, prefix="/api", tags=["assistants"])

# Événements de démarrage et d'arrêt pour la connexion à MongoDB
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API leadflow"}
