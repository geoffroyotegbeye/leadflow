
from pydantic import BaseModel, EmailStr
from typing import Optional


class Register(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None

class UserResponse(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None

class Response(BaseModel):
    success: str
    message: str
    data: Optional[UserResponse]