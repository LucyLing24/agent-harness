"""Intervention API - Human-in-the-loop controls."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.task import Task
from app.models.agent import Agent
from app.models.project import Project
from app.api.websocket import manager

router = APIRouter(prefix="/api/projects/{project_id}/interventions", tags=["interventions"])


class PlanApproval(BaseModel):
    approved: bool
    feedback: str | None = None


class ToolApproval(BaseModel):
    agent_id: str
    tool_name: str
    approved: bool
    reason: str | None = None


class IntermediateFeedback(BaseModel):
    agent_id: str
    score: int  # 1-5
    comment: str | None = None


@router.post("/approve-plan")
async def approve_plan(
    project_id: str, data: PlanApproval, db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject the task decomposition plan.
    When approved, project moves from AWAITING_APPROVAL to IN_PROGRESS.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if data.approved:
        project.status = "in_progress"
        # Update all pending tasks to ready
        tasks_result = await db.execute(
            select(Task).where(Task.project_id == project_id, Task.status == "awaiting_approval")
        )
        for task in tasks_result.scalars().all():
            task.status = "pending"

        await manager.broadcast(project_id, {
            "type": "plan_approved",
            "data": {"project_id": project_id},
        })
    else:
        project.status = "planning"
        await manager.broadcast(project_id, {
            "type": "plan_rejected",
            "data": {"project_id": project_id, "feedback": data.feedback},
        })

    await db.flush()
    return {"detail": "Plan approved" if data.approved else "Plan rejected", "feedback": data.feedback}


@router.post("/approve-tool")
async def approve_tool(
    project_id: str, data: ToolApproval, db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject a sensitive tool execution.
    This is the Environment Intervention gate.
    """
    result = await db.execute(
        select(Agent).where(Agent.id == data.agent_id, Agent.project_id == project_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if data.approved:
        agent.status = "running"
        await manager.broadcast(project_id, {
            "type": "tool_approved",
            "data": {
                "agent_id": data.agent_id,
                "tool_name": data.tool_name,
            },
        })
    else:
        agent.current_action = f"Tool '{data.tool_name}' was rejected: {data.reason}"
        await manager.broadcast(project_id, {
            "type": "tool_rejected",
            "data": {
                "agent_id": data.agent_id,
                "tool_name": data.tool_name,
                "reason": data.reason,
            },
        })

    await db.flush()
    return {"detail": "Tool approved" if data.approved else "Tool rejected"}


@router.post("/feedback")
async def submit_feedback(
    project_id: str, data: IntermediateFeedback, db: AsyncSession = Depends(get_db)
):
    """
    Submit intermediate feedback / scoring for a running sub-agent.
    Helps the agent adjust its strategy mid-execution.
    """
    result = await db.execute(
        select(Agent).where(Agent.id == data.agent_id, Agent.project_id == project_id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    await manager.broadcast(project_id, {
        "type": "feedback_received",
        "data": {
            "agent_id": data.agent_id,
            "score": data.score,
            "comment": data.comment,
        },
    })

    return {"detail": "Feedback submitted", "score": data.score}
