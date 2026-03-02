# 前端开发文档 — Agent Harness Frontend

## 目录

- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [快速启动](#快速启动)
- [整体架构](#整体架构)
- [类型系统 (Types)](#类型系统-types)
- [状态管理 (Store)](#状态管理-store)
- [服务层 (Services)](#服务层-services)
- [组件详解](#组件详解)
- [样式系统](#样式系统)
- [WebSocket 集成](#websocket-集成)
- [开发指南](#开发指南)

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18 | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Vite** | 5.x | 构建工具，极速 HMR |
| **Ant Design (antd)** | 5.x | UI 组件库（按钮、标签、面板等） |
| **React Flow** | 11.x | 流程图/拓扑可视化（已安装，预留扩展） |
| **Zustand** | 4.x | 轻量全局状态管理 |
| **Axios** | 1.x | HTTP 客户端 |

---

## 目录结构

```
frontend/
├── public/                  # 静态资源
├── src/
│   ├── main.tsx            # 应用入口，挂载 React 根组件
│   ├── App.tsx             # 主应用布局 (Header + 三面板)
│   ├── App.css             # 全局布局样式
│   ├── index.css           # 全局基础样式 (reset / antd 覆盖)
│   ├── types/
│   │   └── index.ts        # 所有 TypeScript 类型定义
│   ├── store/
│   │   └── index.ts        # Zustand 全局状态管理
│   ├── services/
│   │   ├── api.ts          # Axios API 封装 (REST 调用)
│   │   └── websocket.ts    # WebSocket 服务 (实时通信)
│   └── components/
│       ├── PlannerPanel/   # 左侧面板 — 拓扑树
│       │   ├── index.ts
│       │   ├── PlannerPanel.tsx
│       │   └── PlannerPanel.css
│       ├── ChatPanel/      # 中间面板 — 对话区
│       │   ├── index.ts
│       │   ├── ChatPanel.tsx
│       │   └── ChatPanel.css
│       └── ContextPanel/   # 右侧面板 — 上下文信息
│           ├── index.ts
│           ├── ContextPanel.tsx
│           └── ContextPanel.css
├── index.html              # HTML 入口
├── package.json            # 依赖声明
├── tsconfig.json           # TypeScript 配置
├── tsconfig.app.json       # 应用 TS 配置
├── tsconfig.node.json      # Node TS 配置
├── vite.config.ts          # Vite 构建配置
└── node_modules/           # 依赖包
```

---

## 快速启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器 (默认 http://localhost:5173)
npm run dev

# TypeScript 类型检查
npx tsc --noEmit

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

> 前端开发服务器地址 `http://localhost:5173`，后端 API 地址 `http://localhost:8000`。

---

## 整体架构

应用采用 **三面板布局**，对应 UI mockup 中的 Planner | Chat | Context 三栏设计：

```
┌──────────────────────────────────────────────────────────┐
│                     Header (App Bar)                      │
│  🕹️ Agent Harness        📌 项目名     [新建] [打开]     │
├──────────┬─────────────────────────────┬─────────────────┤
│          │                             │                 │
│ Planner  │         Chat Panel          │    Context      │
│ Panel    │                             │    Panel        │
│ (300px)  │       (flex: auto)          │   (320px)       │
│          │                             │                 │
│ 拓扑树    │    Tab: Leader|Field|Mate   │  Tab: Context   │
│ 目标标签  │    消息气泡列表              │  |Tasks|Msg     │
│ Team Lead│    输入框 + 发送按钮         │  卡片信息列表   │
│ Tasks    │                             │  审批按钮       │
│ Sub-agents│                            │  干预提醒       │
│ Output   │                             │                 │
│          │                             │                 │
└──────────┴─────────────────────────────┴─────────────────┘
```

### 数据流

```
用户操作 → API 调用 (services/api.ts) → 后端 REST API
                                              ↓
zustand store ← WebSocket 事件 ← 后端 WebSocket 推送
     ↓
React 组件重新渲染
```

---

## 类型系统 (Types)

文件：`src/types/index.ts`

### 核心接口

#### Project

```typescript
interface Project {
  id: string;
  name: string;
  goal: string;
  status: "planning" | "awaiting_approval" | "in_progress" 
        | "paused" | "completed" | "failed";
  context_summary: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Agent

```typescript
interface Agent {
  id: string;
  project_id: string;
  name: string;
  role: "team_lead" | "sub_agent";
  status: "idle" | "running" | "waiting_approval" 
        | "completed" | "failed" | "destroyed";
  system_prompt: string | null;
  persona: string | null;
  task_id: string | null;
  parent_agent_id: string | null;
  token_used: number;
  progress: number;           // 0-100
  current_action: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Task

```typescript
interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "pending" | "awaiting_approval" | "in_progress" 
        | "paused" | "completed" | "failed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  order_index: number;
  result: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
```

#### Message

```typescript
interface Message {
  id: string;
  project_id: string;
  agent_id: string | null;
  role: "user" | "team_lead" | "sub_agent" | "system" | "intervention";
  content: string;
  metadata_json: string | null;
  created_at: string;
}
```

#### WSEvent

```typescript
interface WSEvent {
  type: string;
  data: unknown;
}
```

#### InterventionRequest

```typescript
interface InterventionRequest {
  agent_id: string;
  agent_name: string;
  tool_name: string;
  message: string;
}
```

### 如何修改

- 后端模型增加字段时，需同步在 `types/index.ts` 中更新对应接口
- 新增实体类型时，参照现有模式添加 `interface` + 状态/枚举类型

---

## 状态管理 (Store)

文件：`src/store/index.ts`

使用 **Zustand** 进行全局状态管理。整个应用共享一个 store：

### State 结构

```typescript
interface AppState {
  // ---- 数据 ----
  projects: Project[];          // 所有项目列表
  currentProject: Project | null; // 当前选中项目
  agents: Agent[];              // 当前项目的智能体列表
  tasks: Task[];                // 当前项目的任务列表
  messages: Message[];          // 当前项目的消息列表
  selectedAgent: Agent | null;  // 当前选中的智能体（右侧栏展示）
  interventions: InterventionRequest[]; // 待处理的干预请求

  // ---- UI 状态 ----
  activeTab: "leader" | "field" | "mate1" | "mate2"; // Chat 面板 Tab
  contextTab: "context" | "tasks" | "msg";           // Context 面板 Tab
  loading: boolean;             // 全局加载状态
}
```

### 核心 Actions

| Action | 说明 |
|--------|------|
| `loadProjects()` | 从后端加载全部项目 |
| `createProject(name, goal)` | 创建新项目 |
| `selectProject(project)` | 选择项目 → 加载 agents、tasks、messages |
| `loadAgents(projectId)` | 加载指定项目的智能体 |
| `loadTasks(projectId)` | 加载指定项目的任务 |
| `loadMessages(projectId)` | 加载指定项目的消息 |
| `updateAgentInStore(partial)` | 局部更新某智能体（WebSocket 推送时用） |
| `updateTaskInStore(partial)` | 局部更新某任务 |
| `addMessage(msg)` | 追加新消息 |
| `setSelectedAgent(agent)` | 选中智能体，右侧栏展示其信息 |
| `setActiveTab(tab)` | 切换 Chat 面板 Tab |
| `setContextTab(tab)` | 切换 Context 面板 Tab |
| `addIntervention(req)` | 添加待处理的干预请求 |
| `removeIntervention(agentId)` | 移除已处理的干预请求 |

### 数据流向

```
API Response ──→ store.set() ──→ React 组件自动更新
                     ↑
WebSocket Event ─────┘
```

### 如何修改

- **添加新状态**：在 `AppState` 接口中添加字段，在 `create()` 的初始值中赋默认值
- **添加新 Action**：在 `create()` 回调中实现，使用 `set()` 更新状态
- **异步 Action**：直接 `async` 函数，内部调用 API，然后 `set()` 更新

```typescript
// 示例：添加新功能
myNewAction: async (param: string) => {
  const result = await myApi.doSomething(param);
  set({ myNewData: result });
},
```

---

## 服务层 (Services)

### 1. API 服务 (`services/api.ts`)

基于 Axios 封装，baseURL 设为 `http://localhost:8000`。

包含 5 个 API 模块：

| 模块 | 方法 | 对应后端路由 |
|------|------|-------------|
| `projectsApi` | `list()`, `get(id)`, `create(name, goal)`, `update(id, data)`, `delete(id)`, `decompose(id, goal)`, `dispatch(id)` | `/api/projects/*` |
| `agentsApi` | `list(projectId)`, `get(projectId, agentId)`, `update(projectId, agentId, data)`, `destroy(projectId, agentId)` | `/api/projects/{pid}/agents/*` |
| `tasksApi` | `list(projectId)`, `get(projectId, taskId)`, `create(projectId, data)`, `update(projectId, taskId, data)`, `delete(projectId, taskId)` | `/api/projects/{pid}/tasks/*` |
| `messagesApi` | `list(projectId, agentId?)`, `create(projectId, data)` | `/api/projects/{pid}/messages/*` |
| `interventionsApi` | `approvePlan(projectId, approved, feedback?)`, `approveTool(projectId, agentId, toolName, approved, reason?)`, `submitFeedback(projectId, agentId, score, comment?)` | `/api/projects/{pid}/interventions/*` |

#### 如何修改

- **修改 API 地址**：修改 `axios.create({ baseURL: ... })`
- **添加新接口**：在对应模块对象中添加新方法
- **添加拦截器**：在 `api` 实例上添加 `interceptors.request/response`

```typescript
// 示例：添加请求拦截器
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});
```

### 2. WebSocket 服务 (`services/websocket.ts`)

单例类 `WebSocketService`，通过 `wsService` 导出。

| 方法 | 说明 |
|------|------|
| `connect(projectId)` | 连接到 `ws://localhost:8000/ws/{projectId}` |
| `disconnect()` | 断开连接，清除重连计时器 |
| `send(type, data)` | 发送消息到服务端 |
| `onEvent(handler)` | 注册事件处理函数，返回取消注册函数 |

#### 特性

- **自动重连**：断开后 3 秒自动重连
- **事件分发**：收到消息后依次调用所有注册的 handler
- **JSON 协议**：所有消息均为 `{ type, data }` 格式

#### 如何修改

- **修改 WebSocket 地址**：修改 `connect()` 中的 URL 构造
- **修改重连策略**：修改 `onclose` 中的 `setTimeout` 时间，或实现指数退避
- **添加认证**：在 URL 中附加 token 参数，如 `ws://host/ws/{id}?token=xxx`

---

## 组件详解

### App.tsx — 主应用组件

文件：`src/App.tsx`

**职责：**
- 应用全局布局 (Ant Design `Layout`)
- Header 头部（标题 + 新建/打开按钮）
- 三面板布局（`Sider` + `Content` + `Sider`）
- 新建项目 / 选择项目 Modal
- WebSocket 连接管理和事件分发

**WebSocket 事件处理：**

```
handleWSEvent(event) 根据 event.type 分发处理：
├── agent_status_changed → updateAgentInStore()
├── task_status_changed / task_completed → loadTasks()
├── new_message → addMessage()
├── intervention_required → addIntervention() + 弹出警告提示
├── plan_ready → loadTasks() + loadAgents() + 提示审批
├── agent_spawned → loadAgents()
└── project_completed → 弹出成功提示
```

**如何修改：**
- 添加新面板：在 `Layout` 中添加新的 `Sider` 或嵌套 `Layout`
- 修改 Header：编辑 `Header` 组件内容
- 添加新的 WebSocket 事件：在 `handleWSEvent` 的 `switch` 中添加新 case

---

### PlannerPanel — 左侧拓扑面板

文件：`src/components/PlannerPanel/PlannerPanel.tsx`

**宽度**：300px（由 `App.tsx` 中的 `Sider width={300}` 控制）

**UI 结构：**

```
┌─────────────────────────┐
│ 🏷️ 目标：项目名称        │  ← Tag 标签
├─────────────────────────┤
│ Planner                 │  ← 区域标题
│                         │
│      ● Team Lead        │  ← 深色大圆点 (28x28)
│         ↓               │  ← 箭头连接器
│    ┌─ tasks (N) ─┐      │  ← 任务计数盒
│    └─────────────┘      │
│      ╱  │  ╲            │  ← SVG 虚线连接
│     ● ● ● ●            │  ← 子智能体彩色圆点
│     (颜色标识状态)        │
│                         │
│     ○ ○ (灰色小点)       │  ← 已销毁智能体
├─────────────────────────┤
│ 📄 </> Output           │  ← 输出区域
│ [+] [×] [⤵]            │  ← 操作按钮
└─────────────────────────┘
```

**交互功能：**
- 点击 Team Lead 圆点 → `setSelectedAgent(teamLead)`，右侧栏显示其详情
- 点击子智能体圆点 → `setSelectedAgent(agent)`
- 悬停子智能体圆点 → Tooltip 显示名称、状态、进度
- 子智能体颜色编码：
  - 🟢 绿色 = idle
  - 🟡 黄色 = running
  - 🟠 橙色 = waiting_approval
  - 🔵 蓝色 = completed
  - 🔴 红色 = failed
  - ⚪ 灰色 = destroyed

**数据来源：**
```
useAppStore() → currentProject, agents, tasks, setSelectedAgent
```

**如何修改：**
- 更改拓扑布局：修改 SVG 连接线的坐标计算逻辑
- 添加新节点类型：在 `planner-tree` 中添加新的 `tree-node`
- 接入 React Flow：将手动 SVG 替换为 `<ReactFlow>` 组件实现更丰富的交互

---

### ChatPanel — 中间对话面板

文件：`src/components/ChatPanel/ChatPanel.tsx`

**宽度**：自适应填充（`flex: auto`）

**UI 结构：**

```
┌────────────────────────────────────┐
│  [Leader] [Field] [Mate 1] [Mate 2] │  ← Tabs
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────┐              │  ← 用户消息 (靠右, 蓝色背景)
│  │ [用户] 12:30      │              │
│  │ 帮我完成项目       │              │
│  └──────────────────┘              │
│                                    │
│  ┌──────────────────┐              │  ← Agent 消息 (靠左, 绿色背景)
│  │ [Team Lead] 12:31 │              │
│  │ 我已拆解为5个任务   │              │
│  └──────────────────┘              │
│                                    │
│  ...                               │
├────────────────────────────────────┤
│ [+] [输入消息...              ] [🎤] [➤] │  ← 输入区域
└────────────────────────────────────┘
```

**Tab 系统：**
| Tab | 用途 |
|-----|------|
| `leader` | Team Lead 频道（默认） |
| `field` | 外场频道 |
| `mate1` | Mate 1 频道 |
| `mate2` | Mate 2 频道 |

> 当前所有 Tab 显示相同消息列表。未来可按 Tab 过滤 `agent_id`。

**消息气泡颜色：**
| 角色 | 背景色 |
|------|--------|
| `user` | `#e6f4ff` 浅蓝 |
| `team_lead` | `#f6ffed` 浅绿 |
| `sub_agent` | `#fff7e6` 浅橙 |
| `system` | `#f9f0ff` 浅紫 |
| `intervention` | `#fff1f0` 浅红 |

**发送逻辑：**
1. 用户输入文字，按 Enter 或点击发送按钮
2. 调用 `messagesApi.create()` 创建用户消息
3. 消息追加到 store
4. **如果是第一条消息**（`messages.length === 0`），自动触发 `projectsApi.decompose()` 让 Team Lead 拆解目标
5. 支持 Shift+Enter 换行

**数据来源：**
```
useAppStore() → currentProject, messages, addMessage, activeTab, setActiveTab
```

**如何修改：**
- 按 Tab 过滤消息：修改 `filteredMessages`，根据 `activeTab` 过滤 `agent_id`
- 修改发送逻辑：编辑 `handleSend()` 函数
- 添加消息类型（图片、文件等）：扩展 `Message` 接口和气泡渲染逻辑
- 接入语音输入：实现 🎤 按钮的 `onClick` 回调

---

### ContextPanel — 右侧上下文面板

文件：`src/components/ContextPanel/ContextPanel.tsx`

**宽度**：320px

**UI 结构 — 三个 Tab：**

#### Tab 1: Context（上下文信息）

展示 5 张信息卡片：

| 卡片 | 图标 | 内容 |
|------|------|------|
| **Basic Info** | 📋 | 智能体名称、角色 Tag、状态 Badge、Token 消耗、进度条 |
| **System Prompt** | 📄 | 系统提示词（可展开/折叠） |
| **Active Persona** | 🤖 | 当前角色人设描述 |
| **Conversation History** | 📜 | 消息总数统计 |
| **User Profile** | 👤 | 用户画像（预留） |

> 卡片内容根据 `selectedAgent` 动态显示。点击左侧面板的智能体即可切换。

#### Tab 2: Tasks（任务管理）

- **审批卡片**：当项目状态为 `awaiting_approval` 时显示，包含 ✅ 批准 / ❌ 驳回 按钮
- **任务列表**：显示所有任务，包含状态图标、标题、优先级 Tag、描述

#### Tab 3: Msg（消息 & 干预）

- **干预提醒卡片**：显示待审批的工具调用，每张卡片有 允许 / 拒绝 按钮
- **消息列表**：最近 20 条消息缩略

**审批操作流程：**
```
用户点击 "批准"
    ↓
interventionsApi.approvePlan(projectId, true)
    ↓
projectsApi.dispatch(projectId)  ← 自动派发任务
    ↓
后端创建子智能体 → WebSocket 推送 agent_spawned
    ↓
前端 loadAgents() → 拓扑树更新
```

**数据来源：**
```
useAppStore() → currentProject, selectedAgent, agents, tasks, messages,
                contextTab, setContextTab, interventions, removeIntervention
```

**如何修改：**
- 添加新卡片：在 `renderContextTab()` 中添加新的 `<Card>`
- 修改审批逻辑：编辑 `handleApprovePlan()` 函数
- 添加新 Tab：在 `Tabs` 的 `items` 数组中添加新项

---

## 样式系统

### 全局样式

| 文件 | 用途 |
|------|------|
| `index.css` | 全局 reset，去除 Ant Design 默认 body margin/padding |
| `App.css` | 主布局样式：100vh 全屏、Header、三面板 flex 布局、滚动条美化 |

### 组件样式

每个组件对应独立 CSS 文件，使用 BEM-like 命名：

| 文件 | 主要类名 |
|------|----------|
| `PlannerPanel.css` | `.planner-panel`, `.planner-goal`, `.planner-tree`, `.tree-node`, `.node-dot`, `.agent-dot`, `.planner-output` |
| `ChatPanel.css` | `.chat-panel`, `.chat-tabs`, `.chat-messages`, `.chat-message`, `.message-bubble`, `.chat-input-area` |
| `ContextPanel.css` | `.context-panel`, `.context-content`, `.context-card`, `.approval-card`, `.intervention-card` |

### 关键布局规则

```css
/* 全屏布局 */
.app-layout { height: 100vh; }
.app-body   { flex: 1; overflow: hidden; }

/* 三面板 */
.panel-left   { width: 300px; }   /* Sider */
.panel-center { flex: auto; }     /* Content */
.panel-right  { width: 320px; }   /* Sider */

/* 面板内部垂直布局 */
.chat-panel / .context-panel / .planner-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 消息区可滚动 */
.chat-messages { flex: 1; overflow-y: auto; }
```

### 如何修改样式

- **修改面板宽度**：在 `App.tsx` 中修改 `Sider` 的 `width` 属性
- **修改颜色主题**：在各组件中修改内联 style 或 CSS 变量
- **引入 CSS Modules**：将 `.css` 改为 `.module.css`，导入方式改为 `import styles from './xxx.module.css'`
- **引入 Tailwind CSS**：`npm install -D tailwindcss postcss autoprefixer` 后配置

---

## WebSocket 集成

### 连接生命周期

```
App.tsx useEffect 监听 currentProject.id 变化
    ↓
wsService.connect(projectId)   ← 建立 WebSocket 连接
    ↓
wsService.onEvent(handler)     ← 注册事件处理
    ↓
组件卸载或切换项目时
    ↓
unsub() + wsService.disconnect()  ← 清理连接
```

### 事件处理映射 (App.tsx)

| WebSocket 事件 | 前端处理 |
|----------------|----------|
| `agent_status_changed` | `updateAgentInStore()` — 局部更新智能体状态 |
| `task_status_changed` | `loadTasks()` — 重新加载全部任务 |
| `task_completed` | `loadTasks()` — 重新加载全部任务 |
| `new_message` | `addMessage()` — 追加消息 |
| `intervention_required` | `addIntervention()` + `message.warning()` 弹窗 |
| `plan_ready` | `loadTasks()` + `loadAgents()` + `message.info()` 提示 |
| `agent_spawned` | `loadAgents()` — 重新加载全部智能体 |
| `project_completed` | `message.success()` 弹窗 |

### 如何添加新的 WebSocket 事件

1. 后端在 Service 中 `manager.broadcast()` 新事件
2. 前端 `App.tsx` 的 `handleWSEvent` 添加新 case
3. 调用 store 中的 action 更新状态

---

## 开发指南

### 添加新组件

1. 在 `src/components/` 下创建目录：`MyComponent/`
2. 创建文件：
   - `MyComponent.tsx` — 组件实现
   - `MyComponent.css` — 组件样式
   - `index.ts` — 默认导出 (`export { default } from './MyComponent'`)
3. 在需要使用的地方 import

```typescript
// src/components/MyComponent/MyComponent.tsx
import React from "react";
import { useAppStore } from "../../store";
import "./MyComponent.css";

const MyComponent: React.FC = () => {
  const { someData } = useAppStore();
  return <div className="my-component">{/* ... */}</div>;
};

export default MyComponent;
```

### 添加新的 API 接口

1. 在 `services/api.ts` 中的对应模块添加方法
2. 如需新模块，创建新的对象并导出
3. 在 store 或组件中调用

### 添加新的数据类型

1. 在 `types/index.ts` 中定义 interface
2. 在 store 中添加对应 state 字段
3. 在 API service 中添加对应方法
4. 在组件中使用

### 环境配置

| 场景 | 修改位置 |
|------|----------|
| 修改后端 API 地址 | `services/api.ts` → `baseURL` |
| 修改 WebSocket 地址 | `services/websocket.ts` → `connect()` 中的 URL |
| 添加代理（解决跨域） | `vite.config.ts` → `server.proxy` |

**Vite 代理示例：**

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
});
```

### 生产部署

```bash
# 构建  
npm run build

# 产物在 dist/ 目录
# 可部署到 Nginx / Vercel / Cloudflare Pages 等
```

**Nginx 配置参考：**

```nginx
server {
    listen 80;
    root /path/to/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000;
    }
    
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 依赖清单 (package.json)

| 包名 | 用途 |
|------|------|
| `react` / `react-dom` | UI 框架 |
| `antd` | UI 组件库 |
| `@ant-design/icons` | 图标库 |
| `reactflow` | 流程图可视化（预留） |
| `zustand` | 全局状态管理 |
| `axios` | HTTP 客户端 |
| `typescript` | 类型系统 |
| `@vitejs/plugin-react` | Vite React 插件 |

---

> 本文档最后更新于项目初始化阶段。随着功能迭代，请同步更新此文档。
