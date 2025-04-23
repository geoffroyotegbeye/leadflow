from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.database.mongodb import get_database
from app.models.Auth.auth import UserRegister
from app.schemas.Auth.auth_schema import Register, UserResponse, Response
from app.utils.auth_utils import get_password_hash, verify_password
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status
import random
import string
from datetime import timedelta, datetime

# Fonction pour obtenir la collection users
async def get_user_collection():
    db = await get_database()
    return db.users

async def get_temp_user_collection():
    db = await get_database()
    return db.temp_users

# Fonction pour créer un nouvel utilisateur
async def create_user(user_data: Register) -> UserResponse:
    ## Récupérer la collection users
    users = await get_user_collection()

    ## Récupérer la collection temp_users
    temp_users = await get_temp_user_collection()


    # Vérifier si l'email existe déjà dans la table users
    existing_user = await users.find_one({"email": user_data.email})
    if existing_user:
        return Response(
            success="false",
            message="Un utilisateur avec cet email existe déjà",
            data=None
        )

        # Vérifier si l'email existe déjà dans la table temp_users
    existing_temp_user = await temp_users.find_one({"email": user_data.email})
    if  existing_temp_user:
        return Response(
            success="false",
            message="Un utilisateur avec cet email existe déjà hnjj,j" ,
            data=None
        )

    # Créer le document utilisateur
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    
    try:
        # Générer 6 caractères aléatoires (chiffres + lettres)
        code = ''.join(random.choices(string.digits + string.ascii_letters, k=6))
        expires_at = datetime.utcnow() + timedelta(hours=24)
        user_dict["verification_code"] = code
        user_dict["verification_code_expires_at"] = expires_at
        result = await temp_users.insert_one(user_dict)
        
        # Créer l'index unique sur email si c'est le premier utilisateur
        await temp_users.create_index("email", unique=True)

        return Response(
            success="true",
            message="Création de compte en cours",
            data=None
        )
    
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà"
        )

async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Récupère un utilisateur par son email."""
    users = await get_user_collection()
    user = await users.find_one({"email": email})
    
    if user:
        # Convertir ObjectId en string
        user["id"] = str(user["_id"])
        del user["_id"]
    
    return user

async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authentifie un utilisateur avec son email et son mot de passe."""
    user = await get_user_by_email(email)
    
    if not user:
        return None
    
    if not verify_password(password, user["password"]):
        return None
    
    # Ne pas renvoyer le mot de passe
    user_copy = user.copy()
    del user_copy["password"]
    
    return user_copy

async def update_user_password(email: str, new_password: str) -> bool:
    """Met à jour le mot de passe d'un utilisateur."""
    users = await get_user_collection()
    
    # Vérifier si l'utilisateur existe
    user = await users.find_one({"email": email})
    if not user:
        return False
    
    # Mettre à jour le mot de passe
    hashed_password = get_password_hash(new_password)
    result = await users.update_one(
        {"email": email},
        {"$set": {"password": hashed_password}}
    )
    
    return result.modified_count > 0

async def get_all_users() -> List[UserResponse]:
    """Récupère tous les utilisateurs (pour l'administration)."""
    users = await get_user_collection()
    user_list = await users.find().to_list(length=100)
    
    # Formater les utilisateurs pour la réponse
    formatted_users = []
    for user in user_list:
        user["id"] = str(user["_id"])
        del user["_id"]
        del user["password"]  # Ne pas renvoyer les mots de passe
        formatted_users.append(UserResponse(**user))
    
    return formatted_users
