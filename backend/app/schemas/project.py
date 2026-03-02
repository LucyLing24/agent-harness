"""Project schemas."""
from datetime import datetime
from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., max_length=200)
    goal: str


class ProjectUpdate(BaseModel):
    name: str | None = None
    goal: str | None = None
    status: str | None = None
    context_summary: str | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    goal: str
    status: str
    context_summary: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
