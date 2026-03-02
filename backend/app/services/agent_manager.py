"""
Agent Manager - Handles sub-agent lifecycle and monitoring.

Responsibilities:
- Spawn and destroy sub-agents
- Track token usage, progress, current actions
- Enforce information isolation between sub-agents
- Handle tool approval checks for sensitive operations
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.agent import Agent, AgentRole, AgentStatus
from app.models.task import Task
from app.api.websocket import manager
from app.config import settings


class AgentManager:
    """Manages the lifecycle of sub-agents."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def spawn_sub_agent(
        self,
        project_id: str,
        task_id: str,
        parent_agent_id: str,
        name: str,
        system_prompt: str,
        persona: str | None = None,
    ) -> Agent:
        """Spawn a new sub-agent for a specific task."""
        agent = Agent(
            id=str(uuid.uuid4()),
            project_id=project_id,
            name=name,
            role=AgentRole.SUB_AGENT,
            status=AgentStatus.RUNNING,
            system_prompt=system_prompt,
            persona=persona,
            task_id=task_id,
            parent_agent_id=parent_agent_id,
        )
        self.db.add(agent)
        await self.db.flush()
        await self.db.refresh(agent)

        await manager.broadcast(project_id, {
            "type": "agent_status_changed",
            "data": {
                "agent_id": agent.id,
                "status": agent.status,
                "name": agent.name,
            },
        })
        return agent

    async def destroy_sub_agent(self, agent_id: str):
        """Destroy a sub-agent after task completion or failure."""
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            return

        agent.status = AgentStatus.DESTROYED
        agent.is_active = False

        await manager.broadcast(agent.project_id, {
            "type": "agent_status_changed",
            "data": {
                "agent_id": agent.id,
                "status": "destroyed",
                "name": agent.name,
            },
        })
        await self.db.flush()

    async def update_progress(
        self, agent_id: str, progress: int, current_action: str | None = None, token_used: int | None = None
    ):
        """Update an agent's progress and current action for real-time display."""
        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            return

        agent.progress = min(progress, 100)
        if current_action:
            agent.current_action = current_action
        if token_used is not None:
            agent.token_used = token_used

        await manager.broadcast(agent.project_id, {
            "type": "agent_status_changed",
            "data": {
                "agent_id": agent.id,
                "progress": agent.progress,
                "current_action": agent.current_action,
                "token_used": agent.token_used,
            },
        })
        await self.db.flush()

    async def check_tool_approval(self, agent_id: str, tool_name: str) -> bool:
        """
        Check if a tool requires user approval before execution.
        If it's a sensitive tool, pause the agent and request approval.
        """
        if tool_name not in settings.SENSITIVE_TOOLS:
            return True  # Non-sensitive tools auto-approved

        result = await self.db.execute(select(Agent).where(Agent.id == agent_id))
        agent = result.scalar_one_or_none()
        if not agent:
            return False

        # Pause agent and request approval
        agent.status = AgentStatus.WAITING_APPROVAL
        agent.current_action = f"⚠️ Requesting approval for tool: {tool_name}"

        await manager.broadcast(agent.project_id, {
            "type": "intervention_required",
            "data": {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "tool_name": tool_name,
                "message": f"Agent '{agent.name}' wants to use sensitive tool: {tool_name}. Approve?",
            },
        })
        await self.db.flush()
        return False  # Wait for explicit approval

    async def get_active_agents(self, project_id: str) -> list[Agent]:
        """Get all active agents in a project."""
        result = await self.db.execute(
            select(Agent).where(
                Agent.project_id == project_id,
                Agent.is_active == True,
            )
        )
        return result.scalars().all()
