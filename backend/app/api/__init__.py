from app.api.projects import router as projects_router
from app.api.agents import router as agents_router
from app.api.tasks import router as tasks_router
from app.api.messages import router as messages_router
from app.api.websocket import router as ws_router

__all__ = ["projects_router", "agents_router", "tasks_router", "messages_router", "ws_router"]
