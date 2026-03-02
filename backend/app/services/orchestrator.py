"""
Orchestrator service - Core scheduling logic for Team Lead.

The Orchestrator is responsible for:
1. Receiving user goals and delegating to Team Lead for plan decomposition
2. Managing the plan approval workflow 
3. Dispatching sub-agents for each approved task
4. Collecting results and compressing context back to Team Lead
"""
import uuid
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.project import Project, ProjectStatus
from app.models.task import Task, TaskStatus
from app.models.agent import Agent, AgentRole, AgentStatus
from app.models.message import Message, MessageRole
from app.api.websocket import manager
from app.config import settings


class Orchestrator:
    """Core orchestration engine — the brain of the harness."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def decompose_goal(self, project_id: str, goal: str) -> list[dict]:
        """
        Ask Team Lead to decompose a goal into flat subtasks.
        Returns the proposed task list for user approval.
        """
        # Get Team Lead
        result = await self.db.execute(
            select(Agent).where(
                Agent.project_id == project_id,
                Agent.role == AgentRole.TEAM_LEAD,
            )
        )
        team_lead = result.scalar_one_or_none()
        if not team_lead:
            raise ValueError("No Team Lead found for project")

        team_lead.status = AgentStatus.RUNNING
        team_lead.current_action = "Decomposing goal into subtasks..."

        # Record user message
        user_msg = Message(
            id=str(uuid.uuid4()),
            project_id=project_id,
            role=MessageRole.USER,
            content=goal,
        )
        self.db.add(user_msg)

        # TODO: Call actual LLM API to decompose goal
        # For now, generate a placeholder plan
        proposed_tasks = [
            {"title": f"子任务 {i+1}: {goal} - 阶段 {i+1}", "description": f"自动拆解的子任务 {i+1}", "priority": "medium", "order_index": i}
            for i in range(5)
        ]

        # Create tasks in awaiting_approval state
        created_tasks = []
        for t in proposed_tasks:
            task = Task(
                id=str(uuid.uuid4()),
                project_id=project_id,
                title=t["title"],
                description=t["description"],
                priority=t["priority"],
                order_index=t["order_index"],
                status=TaskStatus.AWAITING_APPROVAL,
            )
            self.db.add(task)
            created_tasks.append(task)

        # Update project status
        project_result = await self.db.execute(select(Project).where(Project.id == project_id))
        project = project_result.scalar_one()
        project.status = ProjectStatus.AWAITING_APPROVAL

        team_lead.current_action = "Waiting for plan approval"
        team_lead.status = AgentStatus.WAITING_APPROVAL

        # Record Team Lead response
        lead_msg = Message(
            id=str(uuid.uuid4()),
            project_id=project_id,
            agent_id=team_lead.id,
            role=MessageRole.TEAM_LEAD,
            content=f"我已将目标分解为 {len(proposed_tasks)} 个子任务，请审批计划。",
            metadata_json=json.dumps(proposed_tasks, ensure_ascii=False),
        )
        self.db.add(lead_msg)

        await self.db.flush()

        # Broadcast plan ready event
        await manager.broadcast(project_id, {
            "type": "plan_ready",
            "data": {
                "project_id": project_id,
                "tasks": [{"id": t.id, "title": t.title, "description": t.description} for t in created_tasks],
            },
        })

        return proposed_tasks

    async def dispatch_tasks(self, project_id: str):
        """
        After plan approval, spawn a sub-agent for each pending task.
        Enforces the three iron rules: single-task lifecycle, info isolation, single report line.
        """
        # Get Team Lead
        result = await self.db.execute(
            select(Agent).where(
                Agent.project_id == project_id,
                Agent.role == AgentRole.TEAM_LEAD,
            )
        )
        team_lead = result.scalar_one_or_none()
        if not team_lead:
            raise ValueError("No Team Lead found")

        # Get all pending tasks
        tasks_result = await self.db.execute(
            select(Task).where(
                Task.project_id == project_id,
                Task.status == TaskStatus.PENDING,
            ).order_by(Task.order_index)
        )
        tasks = tasks_result.scalars().all()

        for task in tasks:
            # Spawn a sub-agent for each task
            sub_agent = Agent(
                id=str(uuid.uuid4()),
                project_id=project_id,
                name=f"Agent-{task.title[:20]}",
                role=AgentRole.SUB_AGENT,
                status=AgentStatus.RUNNING,
                task_id=task.id,
                parent_agent_id=team_lead.id,
                system_prompt=f"You are a sub-agent. Your single task: {task.title}. {task.description or ''}. Report results only to Team Lead.",
                current_action="Initializing...",
            )
            self.db.add(sub_agent)
            task.status = TaskStatus.IN_PROGRESS

            await manager.broadcast(project_id, {
                "type": "agent_spawned",
                "data": {
                    "agent_id": sub_agent.id,
                    "task_id": task.id,
                    "task_title": task.title,
                },
            })

        team_lead.status = AgentStatus.RUNNING
        team_lead.current_action = f"Monitoring {len(tasks)} sub-agents"
        await self.db.flush()

    async def handle_task_completion(self, project_id: str, agent_id: str, result: str):
        """
        Handle sub-agent completing a task:
        1. Record result
        2. Destroy sub-agent
        3. Compress context and feed back to Team Lead
        4. Check if all tasks are done
        """
        agent_result = await self.db.execute(
            select(Agent).where(Agent.id == agent_id)
        )
        agent = agent_result.scalar_one_or_none()
        if not agent or not agent.task_id:
            return

        # Update task
        task_result = await self.db.execute(select(Task).where(Task.id == agent.task_id))
        task = task_result.scalar_one()
        task.status = TaskStatus.COMPLETED
        task.result = result

        # Destroy sub-agent (single-task lifecycle)
        agent.status = AgentStatus.DESTROYED
        agent.is_active = False
        agent.progress = 100

        # Record completion message
        msg = Message(
            id=str(uuid.uuid4()),
            project_id=project_id,
            agent_id=agent_id,
            role=MessageRole.SUB_AGENT,
            content=f"任务 '{task.title}' 已完成。结果: {result[:500]}",
        )
        self.db.add(msg)

        await manager.broadcast(project_id, {
            "type": "task_completed",
            "data": {
                "agent_id": agent_id,
                "task_id": task.id,
                "task_title": task.title,
            },
        })

        # Check if all tasks completed
        all_tasks = await self.db.execute(
            select(Task).where(Task.project_id == project_id)
        )
        tasks = all_tasks.scalars().all()
        if all(t.status in (TaskStatus.COMPLETED, TaskStatus.CANCELLED) for t in tasks):
            project_result = await self.db.execute(select(Project).where(Project.id == project_id))
            project = project_result.scalar_one()
            project.status = ProjectStatus.COMPLETED

            await manager.broadcast(project_id, {
                "type": "project_completed",
                "data": {"project_id": project_id},
            })

        await self.db.flush()
