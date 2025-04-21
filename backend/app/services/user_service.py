from typing import Optional, Dict, Any, List
from bson import ObjectId
from app.database.mongodb import get_database
from app.models.auth import UserRegister, UserResponse
from app.utils.auth_utils import get_password_hash, verify_password
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status

async def get_user_collection():
    """Récupère la collection users de la base de données."""
    db = await get_database()
    return db.users

async def create_user(user_data: UserRegister) -> UserResponse:
    """Crée un nouvel utilisateur dans la base de données."""
    users = await get_user_collection()
    
    # Vérifier si l'email existe déjà
    existing_user = await users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà"
        )
    
    # Créer le document utilisateur
    user_dict = user_data.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    
    try:
        result = await users.insert_one(user_dict)
        
        # Créer l'index unique sur email si c'est le premier utilisateur
        await users.create_index("email", unique=True)
        
        # Récupérer l'utilisateur créé
        created_user = await users.find_one({"_id": result.inserted_id})
        
        # Convertir ObjectId en string pour la réponse
        created_user["id"] = str(created_user["_id"])
        del created_user["_id"]
        del created_user["password"]  # Ne pas renvoyer le mot de passe
        
        return UserResponse(**created_user)
    
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
