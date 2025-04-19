from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

# Classe pour gérer les ObjectId de MongoDB avec Pydantic
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Modèle pour les options dans les éléments
class Option(BaseModel):
    id: str
    text: str
    targetNodeId: Optional[str] = None

# Modèle pour les éléments dans les nœuds
class Element(BaseModel):
    id: str
    type: str
    content: str
    displayMode: str = "after"
    options: Optional[List[Option]] = None
    apiConfig: Optional[Dict[str, Any]] = None
    formFields: Optional[List[Dict[str, Any]]] = None
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = None
    carouselItems: Optional[List[Dict[str, Any]]] = None

# Modèle pour les nœuds
class Node(BaseModel):
    id: str
    label: Optional[str] = None
    type: Optional[str] = None
    elements: List[Element] = []
    position: Optional[Dict[str, float]] = None
    color: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

# Modèle pour les connexions (edges)
class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    animated: Optional[bool] = None
    style: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None

# Modèle pour l'assistant complet
class AssistantModel(BaseModel):
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    description: Optional[str] = None
    nodes: List[Node] = []
    edges: List[Edge] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# Modèle pour la création d'un assistant
class AssistantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[Node] = []
    edges: List[Edge] = []

# Modèle pour la mise à jour d'un assistant
class AssistantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Node]] = None
    edges: Optional[List[Edge]] = None

# Modèle pour la réponse de l'API
class AssistantResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    nodes: List[Node]
    edges: List[Edge]
    created_at: datetime
    updated_at: datetime
