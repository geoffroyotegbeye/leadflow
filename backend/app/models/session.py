from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class LeadStatus(str, Enum):
    NONE = "none"
    PARTIAL = "partial"
    COMPLETE = "complete"

class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"

class MessageSender(str, Enum):
    BOT = "bot"
    USER = "user"

class MessageContentType(str, Enum):
    TEXT = "text"
    FORM = "form"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"
    QUICK_REPLY = "quick_reply"
    OPTION = "option"

class SessionCreate(BaseModel):
    assistant_id: str
    user_id: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None

class MessageCreate(BaseModel):
    sender: MessageSender
    content: str
    content_type: MessageContentType = MessageContentType.TEXT
    node_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SessionStepCreate(BaseModel):
    session_id: str
    node_id: str
    is_completed: bool = True

class SessionResponse(BaseModel):
    id: str
    assistant_id: str
    user_id: Optional[str] = None
    user_info: Optional[Dict[str, Any]] = None
    status: SessionStatus = SessionStatus.ACTIVE
    lead_status: LeadStatus = LeadStatus.NONE
    current_node_id: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    completion_percentage: float = 0.0
    
class MessageResponse(BaseModel):
    id: str
    session_id: str
    sender: MessageSender
    content: str
    content_type: MessageContentType
    node_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime

class SessionStepResponse(BaseModel):
    id: str
    session_id: str
    node_id: str
    timestamp: datetime
    is_completed: bool

class AnalyticsOverview(BaseModel):
    total_sessions: int
    active_sessions: int
    completed_sessions: int
    abandoned_sessions: int
    total_leads: int
    partial_leads: int
    complete_leads: int
    average_completion_percentage: float
    average_session_duration: float  # en secondes

class AnalyticsResponse(BaseModel):
    overview: AnalyticsOverview
    sessions_by_day: Dict[str, int]
    leads_by_day: Dict[str, int]
    completion_by_node: List[Dict[str, Any]]
    popular_responses: List[Dict[str, Any]]
    average_time_by_node: List[Dict[str, Any]]
