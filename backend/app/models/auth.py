from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
import re

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    company_name: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre majuscule')
        if not re.search(r'[a-z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre minuscule')
        if not re.search(r'[0-9]', v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d6e5c8b587d12345678901",
                "email": "user@example.com",
                "full_name": "John Doe",
                "company_name": "ACME Inc."
            }
        }

class ForgotPassword(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str
    password: str = Field(..., min_length=8)
    
    @validator('password')
    def password_strength(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre majuscule')
        if not re.search(r'[a-z]', v):
            raise ValueError('Le mot de passe doit contenir au moins une lettre minuscule')
        if not re.search(r'[0-9]', v):
            raise ValueError('Le mot de passe doit contenir au moins un chiffre')
        return v

class Token(BaseModel):
    sub: str  # email ou user_id
    exp: int  # timestamp d'expiration
    token: str
