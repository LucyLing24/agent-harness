/**
 * API service — wraps all backend REST calls.
 */
import axios from "axios";
import type { Project, Agent, Task, Message } from "../types";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ---- Projects ----
export const projectsApi = {
  list: () => api.get<Project[]>("/api/projects").then((r) => r.data),
  get: (id: string) => api.get<Project>(`/api/projects/${id}`).then((r) => r.data),
  create: (name: string, goal: string) =>
    api.post<Project>("/api/projects/", { name, goal }).then((r) => r.data),
  update: (id: string, data: Partial<Project>) =>
    api.patch<Project>(`/api/projects/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
  decompose: (id: string, goal: string) =>
    api.post(`/api/projects/${id}/decompose`, { goal }).then((r) => r.data),
  dispatch: (id: string) =>
    api.post(`/api/projects/${id}/dispatch`).then((r) => r.data),
};

// ---- Agents ----
export const agentsApi = {
  list: (projectId: string) =>
    api.get<Agent[]>(`/api/projects/${projectId}/agents`).then((r) => r.data),
  get: (projectId: string, agentId: string) =>
    api
      .get<Agent>(`/api/projects/${projectId}/agents/${agentId}`)
      .then((r) => r.data),
  update: (projectId: string, agentId: string, data: Partial<Agent>) =>
    api
      .patch<Agent>(`/api/projects/${projectId}/agents/${agentId}`, data)
      .then((r) => r.data),
  destroy: (projectId: string, agentId: string) =>
    api.delete(`/api/projects/${projectId}/agents/${agentId}`),
};

// ---- Tasks ----
export const tasksApi = {
  list: (projectId: string) =>
    api.get<Task[]>(`/api/projects/${projectId}/tasks`).then((r) => r.data),
  get: (projectId: string, taskId: string) =>
    api
      .get<Task>(`/api/projects/${projectId}/tasks/${taskId}`)
      .then((r) => r.data),
  create: (projectId: string, data: { title: string; description?: string }) =>
    api.post<Task>(`/api/projects/${projectId}/tasks/`, data).then((r) => r.data),
  update: (projectId: string, taskId: string, data: Partial<Task>) =>
    api
      .patch<Task>(`/api/projects/${projectId}/tasks/${taskId}`, data)
      .then((r) => r.data),
  delete: (projectId: string, taskId: string) =>
    api.delete(`/api/projects/${projectId}/tasks/${taskId}`),
};

// ---- Messages ----
export const messagesApi = {
  list: (projectId: string, agentId?: string) =>
    api
      .get<Message[]>(`/api/projects/${projectId}/messages`, {
        params: agentId ? { agent_id: agentId } : undefined,
      })
      .then((r) => r.data),
  create: (
    projectId: string,
    data: { role: string; content: string; agent_id?: string }
  ) =>
    api
      .post<Message>(`/api/projects/${projectId}/messages/`, data)
      .then((r) => r.data),
};

// ---- Interventions ----
export const interventionsApi = {
  approvePlan: (projectId: string, approved: boolean, feedback?: string) =>
    api
      .post(`/api/projects/${projectId}/interventions/approve-plan`, {
        approved,
        feedback,
      })
      .then((r) => r.data),
  approveTool: (
    projectId: string,
    agentId: string,
    toolName: string,
    approved: boolean,
    reason?: string
  ) =>
    api
      .post(`/api/projects/${projectId}/interventions/approve-tool`, {
        agent_id: agentId,
        tool_name: toolName,
        approved,
        reason,
      })
      .then((r) => r.data),
  submitFeedback: (
    projectId: string,
    agentId: string,
    score: number,
    comment?: string
  ) =>
    api
      .post(`/api/projects/${projectId}/interventions/feedback`, {
        agent_id: agentId,
        score,
        comment,
      })
      .then((r) => r.data),
};

export default api;
