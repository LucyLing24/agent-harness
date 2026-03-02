"""Agent schemas."""
from datetime import datetime
from pydantic import BaseModel, Field


class AgentCreate(BaseModel):
    name: str = Field(..., max_length=100)
    role: str
    system_prompt: str | None = None
    persona: str | None = None
    task_id: str | None = None
    parent_agent_id: str | None = None


class AgentUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    system_prompt: str | None = None
    persona: str | None = None
    token_used: int | None = None
    progress: int | None = None
    current_action: str | None = None
    is_active: bool | None = None


class AgentResponse(BaseModel):
    id: str
    project_id: str
    name: str
    role: str
    status: str
    system_prompt: str | None
    persona: str | None
    task_id: str | None
    parent_agent_id: str | None
    token_used: int
    progress: int
    current_action: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
