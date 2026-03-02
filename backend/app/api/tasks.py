"""Task API endpoints."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/api/projects/{project_id}/tasks", tags=["tasks"])


@router.post("/", response_model=TaskResponse)
async def create_task(
    project_id: str, data: TaskCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new task in the project's plan."""
    task = Task(
        id=str(uuid.uuid4()),
        project_id=project_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        order_index=data.order_index,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(project_id: str, db: AsyncSession = Depends(get_db)):
    """List all tasks for a project, ordered by index."""
    result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id)
        .order_by(Task.order_index)
    )
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    project_id: str, task_id: str, db: AsyncSession = Depends(get_db)
):
    """Get task details."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.project_id == project_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: str,
    task_id: str,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update task status, result, etc."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.project_id == project_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{task_id}")
async def delete_task(
    project_id: str, task_id: str, db: AsyncSession = Depends(get_db)
):
    """Delete a task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.project_id == project_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    return {"detail": "Task deleted"}
