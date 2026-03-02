"""Message schemas."""
from datetime import datetime
from pydantic import BaseModel


class MessageCreate(BaseModel):
    role: str
    content: str
    agent_id: str | None = None
    metadata_json: str | None = None


class MessageResponse(BaseModel):
    id: str
    project_id: str
    agent_id: str | None
    role: str
    content: str
    metadata_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
