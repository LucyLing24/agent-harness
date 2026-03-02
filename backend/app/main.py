"""
FastAPI application entry point.
Hub-and-Spoke Agent Harness — Backend API
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.api.projects import router as projects_router
from app.api.agents import router as agents_router
from app.api.tasks import router as tasks_router
from app.api.messages import router as messages_router
from app.api.websocket import router as ws_router
from app.api.interventions import router as interventions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    await init_db()
    yield
    # Shutdown: cleanup


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Hub-and-Spoke Multi-Agent Management System — 中心辐射型多智能体管理系统",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(projects_router)
app.include_router(agents_router)
app.include_router(tasks_router)
app.include_router(messages_router)
app.include_router(ws_router)
app.include_router(interventions_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


# Orchestration endpoint
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.orchestrator import Orchestrator
from pydantic import BaseModel


class GoalRequest(BaseModel):
    goal: str


@app.post("/api/projects/{project_id}/decompose")
async def decompose_goal(
    project_id: str, data: GoalRequest, db: AsyncSession = Depends(get_db)
):
    """Trigger Team Lead to decompose a goal into subtasks."""
    orchestrator = Orchestrator(db)
    tasks = await orchestrator.decompose_goal(project_id, data.goal)
    return {"tasks": tasks}


@app.post("/api/projects/{project_id}/dispatch")
async def dispatch_tasks(project_id: str, db: AsyncSession = Depends(get_db)):
    """Dispatch all pending tasks to sub-agents after plan approval."""
    orchestrator = Orchestrator(db)
    await orchestrator.dispatch_tasks(project_id)
    return {"detail": "Tasks dispatched"}
