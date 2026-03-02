"""Agent API endpoints."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.agent import Agent
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse

router = APIRouter(prefix="/api/projects/{project_id}/agents", tags=["agents"])


@router.post("/", response_model=AgentResponse)
async def create_agent(
    project_id: str, data: AgentCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new agent within a project."""
    agent = Agent(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=data.name,
        role=data.role,
        system_prompt=data.system_prompt,
        persona=data.persona,
        task_id=data.task_id,
        parent_agent_id=data.parent_agent_id,
    )
    db.add(agent)
    await db.flush()
    await db.refresh(agent)
    return agent


@router.get("/", response_model=list[AgentResponse])
async def list_agents(project_id: str, db: AsyncSession = Depends(get_db)):
    """List all agents in a project."""
    result = await db.execute(
        select(Agent).where(Agent.project_id == project_id).order_by(Agent.created_at)
    )
    return result.scalars().all()


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    project_id: str, agent_id: str, db: AsyncSession = Depends(get_db)
):
    """Get agent details."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.project_id == project_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    project_id: str,
    agent_id: str,
    data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an agent's status, progress, etc."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.project_id == project_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(agent, key, value)
    await db.flush()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}")
async def destroy_agent(
    project_id: str, agent_id: str, db: AsyncSession = Depends(get_db)
):
    """Destroy (deactivate) a sub-agent after task completion."""
    result = await db.execute(
        select(Agent).where(Agent.id == agent_id, Agent.project_id == project_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.is_active = False
    agent.status = "destroyed"
    await db.flush()
    return {"detail": "Agent destroyed"}
