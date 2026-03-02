/* ==============================
   Agent Harness — TypeScript Types
   ============================== */

// ---- Project ----
export type ProjectStatus =
  | "planning"
  | "awaiting_approval"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed";

export interface Project {
  id: string;
  name: string;
  goal: string;
  status: ProjectStatus;
  context_summary: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Agent ----
export type AgentRole = "team_lead" | "sub_agent";
export type AgentStatus =
  | "idle"
  | "running"
  | "waiting_approval"
  | "completed"
  | "failed"
  | "destroyed";

export interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  system_prompt: string | null;
  persona: string | null;
  task_id: string | null;
  parent_agent_id: string | null;
  token_used: number;
  progress: number;
  current_action: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Task ----
export type TaskStatus =
  | "pending"
  | "awaiting_approval"
  | "in_progress"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  order_index: number;
  result: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Message ----
export type MessageRole =
  | "user"
  | "team_lead"
  | "sub_agent"
  | "system"
  | "intervention";

export interface Message {
  id: string;
  project_id: string;
  agent_id: string | null;
  role: MessageRole;
  content: string;
  metadata_json: string | null;
  created_at: string;
}

// ---- WebSocket Events ----
export type WSEventType =
  | "agent_status_changed"
  | "task_status_changed"
  | "new_message"
  | "intervention_required"
  | "plan_ready"
  | "plan_approved"
  | "plan_rejected"
  | "tool_approved"
  | "tool_rejected"
  | "feedback_received"
  | "agent_spawned"
  | "task_completed"
  | "project_completed"
  | "pong"
  | "error";

export interface WSEvent {
  type: WSEventType;
  data: Record<string, unknown>;
}

// ---- Intervention ----
export interface InterventionRequest {
  agent_id: string;
  agent_name: string;
  tool_name: string;
  message: string;
}
