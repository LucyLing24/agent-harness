"""WebSocket endpoint for real-time communication."""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections grouped by project."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: str):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        self.active_connections[project_id].add(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str):
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast(self, project_id: str, message: dict):
        """Broadcast a message to all clients connected to a project."""
        if project_id in self.active_connections:
            payload = json.dumps(message, default=str)
            dead_connections = []
            for ws in self.active_connections[project_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_connections.append(ws)
            for ws in dead_connections:
                self.active_connections[project_id].discard(ws)

    async def send_personal(self, websocket: WebSocket, message: dict):
        """Send message to a specific client."""
        await websocket.send_text(json.dumps(message, default=str))


manager = ConnectionManager()


@router.websocket("/ws/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """
    WebSocket connection for real-time updates.

    Event types pushed to clients:
    - agent_status_changed: Agent status/progress update
    - task_status_changed: Task status update
    - new_message: New chat message
    - intervention_required: Human approval needed
    - plan_ready: Task plan ready for review
    """
    await manager.connect(websocket, project_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                event_type = payload.get("type", "unknown")

                if event_type == "user_message":
                    # Client sent a chat message — broadcast it
                    await manager.broadcast(project_id, {
                        "type": "new_message",
                        "data": payload.get("data", {}),
                    })
                elif event_type == "intervention_response":
                    # User approved/rejected an intervention
                    await manager.broadcast(project_id, {
                        "type": "intervention_resolved",
                        "data": payload.get("data", {}),
                    })
                elif event_type == "ping":
                    await manager.send_personal(websocket, {"type": "pong"})

            except json.JSONDecodeError:
                await manager.send_personal(websocket, {
                    "type": "error",
                    "data": {"message": "Invalid JSON"},
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
