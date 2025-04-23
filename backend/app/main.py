from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from app.api.routes import api_router
from app.database.mongodb import get_database, close_mongo_connection
from fastapi.templating import Jinja2Templates
from pathlib import Path
import logging
import time
import traceback
from fastapi import HTTPException

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

# Montage des fichiers statiques et media
from fastapi.staticfiles import StaticFiles
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Configuration des templates pour le chat public
templates_dir = Path(__file__).parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

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
app.include_router(api_router, prefix="/api", tags=["api"])

# Événements de démarrage et d'arrêt pour la connexion à MongoDB
@app.on_event("startup")
async def startup_db_client():
    # Initialiser la connexion à MongoDB
    await get_database()
    logger.info("Connexion à MongoDB établie")

@app.on_event("shutdown")
async def shutdown_db_client():
    # Fermer la connexion à MongoDB
    await close_mongo_connection()
    logger.info("Connexion à MongoDB fermée")

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API leadflow"}

@app.get("/chat/{public_id}", response_class=HTMLResponse)
async def get_chat_page(public_id: str, request: Request):
    """
    Affiche la page de chat pour un assistant public.
    """
    try:
        db = await get_database()
        collection = db["assistants"]
        
        # Récupérer l'assistant par son public_id
        assistant = await collection.find_one({"public_id": public_id})
        
        if not assistant:
            raise HTTPException(
                status_code=404,
                detail="Assistant non trouvé"
            )
        
        # Vérifier si l'assistant est publié
        if not assistant.get("is_published", False):
            raise HTTPException(
                status_code=404,
                detail="Assistant non trouvé ou non publié"
            )
        
        # Convertir en format de réponse
        from app.api.assistant import assistant_to_response
        assistant_data = assistant_to_response(assistant)
        
        # Rendre le template HTML
        return templates.TemplateResponse(
            "chat.html",
            {
                "request": request,
                "assistant": assistant_data,
                "base_url": str(request.base_url).rstrip('/')
            }
        )
    
    except Exception as e:
        logger.error(f"Erreur lors de l'affichage de la page de chat: {str(e)}")
        logger.error(traceback.format_exc())
        return HTMLResponse(
            content=f"""
            <html>
                <head>
                    <title>Erreur</title>
                </head>
                <body>
                    <h1>Erreur</h1>
                    <p>Une erreur est survenue lors de l'affichage de la page de chat.</p>
                </body>
            </html>
            """,
            status_code=500
        )
