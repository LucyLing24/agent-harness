/**
 * WebSocket service for real-time communication.
 */
import type { WSEvent } from "../types";

type EventHandler = (event: WSEvent) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: EventHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private projectId: string | null = null;

  connect(projectId: string) {
    this.projectId = projectId;
    this.disconnect();

    const url = `ws://localhost:8000/ws/${projectId}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WS] Connected to project ${projectId}`);
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        this.handlers.forEach((h) => h(data));
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    this.ws.onclose = () => {
      console.log("[WS] Disconnected, reconnecting in 3s...");
      this.reconnectTimer = setTimeout(() => {
        if (this.projectId) this.connect(this.projectId);
      }, 3000);
    };

    this.ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: string, data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  onEvent(handler: EventHandler) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }
}

export const wsService = new WebSocketService();
