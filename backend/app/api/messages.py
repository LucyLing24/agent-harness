"""Message API endpoints."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/projects/{project_id}/messages", tags=["messages"])


@router.post("/", response_model=MessageResponse)
async def create_message(
    project_id: str, data: MessageCreate, db: AsyncSession = Depends(get_db)
):
    """Send a new message (user input, agent response, system notification)."""
    message = Message(
        id=str(uuid.uuid4()),
        project_id=project_id,
        role=data.role,
        content=data.content,
        agent_id=data.agent_id,
        metadata_json=data.metadata_json,
    )
    db.add(message)
    await db.flush()
    await db.refresh(message)
    return message


@router.get("/", response_model=list[MessageResponse])
async def list_messages(
    project_id: str,
    agent_id: str | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """List messages in a project, optionally filtered by agent."""
    query = select(Message).where(Message.project_id == project_id)
    if agent_id:
        query = query.where(Message.agent_id == agent_id)
    query = query.order_by(Message.created_at).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    project_id: str, message_id: str, db: AsyncSession = Depends(get_db)
):
    """Get a single message."""
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.project_id == project_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg
