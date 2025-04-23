from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.models.Auth.auth import Token
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.getenv("JWT_SECRET", "YOUR_SECRET_KEY_HERE")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 heures

# Fonctions de gestion des mots de passe
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie si le mot de passe en clair correspond au hash stocké."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Génère un hash sécurisé pour le mot de passe."""
    return pwd_context.hash(password)

# Fonctions de gestion des tokens JWT
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Crée un token JWT avec les données fournies et une date d'expiration."""
    to_encode = data.copy()
    
    # Définir l'expiration
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Encoder le token
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[Token]:
    """Décode un token JWT et retourne les données s'il est valide."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        token_data = Token(**payload)
        
        # Vérifier si le token a expiré
        if datetime.fromtimestamp(token_data.exp) < datetime.utcnow():
            return None
            
        return token_data
    except JWTError:
        return None

def create_password_reset_token(email: str) -> str:
    """Crée un token pour la réinitialisation de mot de passe (expire après 1 heure)."""
    expires = timedelta(hours=1)
    return create_access_token(
        data={"sub": email, "type": "password_reset"},
        expires_delta=expires
    )

def verify_password_reset_token(token: str) -> Optional[str]:
    """Vérifie un token de réinitialisation de mot de passe et retourne l'email s'il est valide."""
    token_data = decode_token(token)
    
    if token_data and hasattr(token_data, "sub") and getattr(token_data, "type", None) == "password_reset":
        return token_data.sub
    
    return None
