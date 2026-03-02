"""Task schemas."""
from datetime import datetime
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=300)
    description: str | None = None
    priority: str = "medium"
    order_index: int = 0


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    order_index: int | None = None
    result: str | None = None
    error_message: str | None = None


class TaskResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str | None
    status: str
    priority: str
    order_index: int
    result: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
