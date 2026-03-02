/**
 * Global store using Zustand — manages projects, agents, tasks, messages.
 */
import { create } from "zustand";
import type {
  Project,
  Agent,
  Task,
  Message,
  InterventionRequest,
} from "../types";
import {
  projectsApi,
  agentsApi,
  tasksApi,
  messagesApi,
} from "../services/api";

interface AppState {
  // Data
  projects: Project[];
  currentProject: Project | null;
  agents: Agent[];
  tasks: Task[];
  messages: Message[];
  selectedAgent: Agent | null;
  interventions: InterventionRequest[];

  // UI state
  activeTab: "leader" | "field" | "mate1" | "mate2";
  contextTab: "context" | "tasks" | "msg";
  loading: boolean;

  // Actions
  setActiveTab: (tab: AppState["activeTab"]) => void;
  setContextTab: (tab: AppState["contextTab"]) => void;
  setSelectedAgent: (agent: Agent | null) => void;

  // Project actions
  loadProjects: () => Promise<void>;
  createProject: (name: string, goal: string) => Promise<Project>;
  selectProject: (project: Project) => Promise<void>;

  // Agent actions
  loadAgents: (projectId: string) => Promise<void>;
  updateAgentInStore: (agent: Partial<Agent> & { id: string }) => void;

  // Task actions
  loadTasks: (projectId: string) => Promise<void>;
  updateTaskInStore: (task: Partial<Task> & { id: string }) => void;

  // Message actions
  loadMessages: (projectId: string, agentId?: string) => Promise<void>;
  addMessage: (message: Message) => void;

  // Intervention
  addIntervention: (req: InterventionRequest) => void;
  removeIntervention: (agentId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  agents: [],
  tasks: [],
  messages: [],
  selectedAgent: null,
  interventions: [],
  activeTab: "leader",
  contextTab: "context",
  loading: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setContextTab: (tab) => set({ contextTab: tab }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await projectsApi.list();
      set({ projects });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (name, goal) => {
    const project = await projectsApi.create(name, goal);
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },

  selectProject: async (project) => {
    set({ currentProject: project, loading: true });
    try {
      const [agents, tasks, messages] = await Promise.all([
        agentsApi.list(project.id),
        tasksApi.list(project.id),
        messagesApi.list(project.id),
      ]);
      set({ agents, tasks, messages });
    } finally {
      set({ loading: false });
    }
  },

  loadAgents: async (projectId) => {
    const agents = await agentsApi.list(projectId);
    set({ agents });
  },

  updateAgentInStore: (updated) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === updated.id ? { ...a, ...updated } : a
      ),
    })),

  loadTasks: async (projectId) => {
    const tasks = await tasksApi.list(projectId);
    set({ tasks });
  },

  updateTaskInStore: (updated) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === updated.id ? { ...t, ...updated } : t
      ),
    })),

  loadMessages: async (projectId, agentId) => {
    const messages = await messagesApi.list(projectId, agentId);
    set({ messages });
  },

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  addIntervention: (req) =>
    set((s) => ({ interventions: [...s.interventions, req] })),

  removeIntervention: (agentId) =>
    set((s) => ({
      interventions: s.interventions.filter((i) => i.agent_id !== agentId),
    })),
}));
