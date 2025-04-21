from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.models.auth import UserRegister, UserLogin, UserResponse, ForgotPassword, ResetPassword, TokenResponse, Token
from app.services.user_service import create_user, authenticate_user, get_user_by_email, update_user_password
from app.utils.auth_utils import create_access_token, decode_token, create_password_reset_token, verify_password_reset_token
from datetime import datetime, timedelta
from typing import Optional
import logging
import os
from passlib.context import CryptContext
from app.database.mongodb import get_database

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "secret")

# Configuration OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Fonction pour envoyer un email (simulée)
async def send_password_reset_email(email: str, token: str, request: Request):
    # Dans un environnement de production, vous utiliseriez un service d'email
    # comme SendGrid, Mailgun, etc.
    reset_url = f"{request.base_url}reset-password?token={token}"
    logger.info(f"Email de réinitialisation envoyé à {email} avec URL: {reset_url}")
    # Implémentation réelle: appel à un service d'email

# Middleware pour obtenir l'utilisateur actuel
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    token_data = decode_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user_by_email(token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilisateur non trouvé",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    """Enregistre un nouvel utilisateur."""
    try:
        created_user = await create_user(user)
        return created_user
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Erreur lors de l'enregistrement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Une erreur est survenue lors de l'enregistrement"
        )

@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authentifie un utilisateur et renvoie un token JWT."""
    user = await authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Créer le token d'accès
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login/email", response_model=TokenResponse)
async def login_with_email(user_data: UserLogin):
    """Authentifie un utilisateur avec email/mot de passe et renvoie un token JWT."""
    user = await authenticate_user(user_data.email, user_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Créer le token d'accès
    access_token = create_access_token(data={"sub": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request_data: ForgotPassword, request: Request, background_tasks: BackgroundTasks):
    """Envoie un email de réinitialisation de mot de passe."""
    # Vérifier si l'utilisateur existe
    user = await get_user_by_email(request_data.email)
    
    # Même si l'utilisateur n'existe pas, nous renvoyons le même message
    # pour éviter les attaques par énumération
    if user:
        # Générer un token de réinitialisation
        token = create_password_reset_token(request_data.email)
        
        # Envoyer l'email en tâche de fond
        background_tasks.add_task(
            send_password_reset_email,
            request_data.email,
            token,
            request
        )
    
    return {"message": "Si votre email est enregistré, vous recevrez un lien de réinitialisation"}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request_data: ResetPassword):
    """Réinitialise le mot de passe d'un utilisateur avec un token valide."""
    # Vérifier le token
    email = verify_password_reset_token(request_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalide ou expiré"
        )
    
    # Mettre à jour le mot de passe
    success = await update_user_password(email, request_data.password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    return {"message": "Mot de passe réinitialisé avec succès"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Renvoie les informations de l'utilisateur actuellement connecté."""
    return UserResponse(
        id=current_user.get("id"),
        email=current_user.get("email"),
        full_name=current_user.get("full_name"),
        company_name=current_user.get("company_name")
    )
