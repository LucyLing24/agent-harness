# 后端开发文档 — Agent Harness Backend

## 目录

- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [快速启动](#快速启动)
- [配置说明](#配置说明)
- [数据库层](#数据库层)
- [数据模型 (Models)](#数据模型-models)
- [Pydantic 校验层 (Schemas)](#pydantic-校验层-schemas)
- [API 路由层](#api-路由层)
- [服务层 (Services)](#服务层-services)
- [WebSocket 实时通信](#websocket-实时通信)
- [干预系统 (Interventions)](#干预系统-interventions)
- [开发指南](#开发指南)
- [状态机说明](#状态机说明)

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.12+ | 运行时 |
| **FastAPI** | 0.104.1 | Web 框架，自动生成 OpenAPI 文档 |
| **SQLAlchemy** | 2.0.23 | ORM，使用 async 模式 |
| **Pydantic** | 2.5.2 | 请求/响应数据校验 |
| **aiosqlite** | 0.19.0 | SQLite 异步驱动 |
| **greenlet** | 3.1.1 | SQLAlchemy async 运行时依赖 |
| **uvicorn** | 0.24.0 | ASGI 服务器 |
| **openai** | 1.6.1 | LLM API 调用（预留） |
| **websockets** | 12.0 | WebSocket 支持 |
| **python-dotenv** | 1.0.0 | 环境变量加载 |

---

## 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py            # 全局配置 (Settings 类)
│   ├── database.py          # 数据库引擎、会话、初始化
│   ├── main.py              # FastAPI 应用入口 + 编排端点
│   ├── models/              # SQLAlchemy ORM 模型
│   │   ├── __init__.py      # 统一导出所有模型
│   │   ├── project.py       # 项目模型
│   │   ├── agent.py         # 智能体模型
│   │   ├── task.py          # 任务模型
│   │   └── message.py       # 消息模型
│   ├── schemas/             # Pydantic 请求/响应模型
│   │   ├── __init__.py
│   │   └── schemas.py       # 所有 Create/Update/Response 模型
│   ├── api/                 # API 路由模块
│   │   ├── __init__.py
│   │   ├── projects.py      # 项目 CRUD
│   │   ├── agents.py        # 智能体 CRUD
│   │   ├── tasks.py         # 任务 CRUD
│   │   ├── messages.py      # 消息 CRUD
│   │   ├── interventions.py # 干预操作 (审批/反馈)
│   │   └── websocket.py     # WebSocket 连接管理
│   └── services/            # 业务逻辑层
│       ├── __init__.py
│       ├── orchestrator.py  # 核心编排引擎 (Orchestrator)
│       └── agent_manager.py # 子智能体生命周期管理 (AgentManager)
├── requirements.txt         # Python 依赖
└── venv/                    # Python 虚拟环境
```

---

## 快速启动

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# (可选) 设置环境变量
cp .env.example .env  # 如有

# 启动开发服务器
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后访问：
- API 文档：`http://localhost:8000/docs` (Swagger UI)
- ReDoc：`http://localhost:8000/redoc`
- 健康检查：`http://localhost:8000/api/health`

---

## 配置说明

配置文件：`app/config.py`

```python
class Settings:
    APP_NAME = "Agent Harness"
    APP_VERSION = "0.1.0"
    DATABASE_URL = "sqlite+aiosqlite:///./harness.db"    # 数据库连接 URL
    OPENAI_API_KEY = ""              # OpenAI API Key
    OPENAI_BASE_URL = "https://api.openai.com/v1"        # API Base URL (支持自定义)
    OPENAI_MODEL = "gpt-4o"         # 默认模型
    CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]
    REQUIRE_PLAN_APPROVAL = True     # 是否需要用户审批计划
    REQUIRE_TOOL_APPROVAL = True     # 是否需要用户审批敏感工具
    SENSITIVE_TOOLS = ["execute_code", "file_write", "database_write", "payment"]
```

### 环境变量（通过 `.env` 文件或系统环境变量）

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DATABASE_URL` | `sqlite+aiosqlite:///./harness.db` | 数据库连接串，支持替换为 PostgreSQL 等 |
| `OPENAI_API_KEY` | 空 | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | API Base URL，可配置为兼容 API |
| `OPENAI_MODEL` | `gpt-4o` | 使用的 LLM 模型名称 |

### 如何修改配置

1. 修改 `config.py` 中的 `Settings` 类属性
2. 在项目根目录创建 `.env` 文件，以环境变量形式覆盖默认值
3. 添加新配置项时，在 `Settings` 类中添加属性，使用 `os.getenv()` 读取环境变量

---

## 数据库层

文件：`app/database.py`

### 核心组件

| 组件 | 说明 |
|------|------|
| `engine` | 异步 SQLAlchemy 引擎，基于 `aiosqlite` 驱动连接 SQLite |
| `async_session` | 异步会话工厂 (`async_sessionmaker`)，`expire_on_commit=False` |
| `Base` | `DeclarativeBase` 基类，所有 ORM 模型继承自它 |
| `get_db()` | FastAPI 依赖注入函数，提供数据库会话（自动 commit / rollback） |
| `init_db()` | 应用启动时调用，自动创建所有表 |

### 如何修改

**切换到 PostgreSQL：**
1. 安装驱动：`pip install asyncpg`
2. 修改 `DATABASE_URL` 为 `postgresql+asyncpg://user:pass@host/db`
3. 对于生产环境，建议使用 Alembic 做数据库迁移

**添加数据库迁移（Alembic）：**
```bash
pip install alembic
alembic init alembic
# 配置 alembic.ini 和 env.py 后：
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

---

## 数据模型 (Models)

所有模型位于 `app/models/` 目录，统一在 `__init__.py` 中导出：

```python
from app.models.project import Project, ProjectStatus
from app.models.agent import Agent, AgentRole, AgentStatus
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.message import Message, MessageRole
```

### 1. Project（项目）

文件：`app/models/project.py`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `String(36)` PK | UUID 主键 |
| `name` | `String(200)` | 项目名称 |
| `goal` | `Text` | 项目目标描述 |
| `status` | `ProjectStatus` Enum | 项目状态 |
| `context_summary` | `Text` nullable | Team Lead 的上下文总结 |
| `created_at` | `DateTime` | 创建时间（自动） |
| `updated_at` | `DateTime` | 更新时间（自动） |

**ProjectStatus 枚举值：**
- `planning` — 规划中
- `awaiting_approval` — 等待用户审批计划
- `in_progress` — 执行中
- `paused` — 已暂停
- `completed` — 已完成
- `failed` — 失败

**关联关系：**
- `tasks` — 一对多关联 Task（级联删除）
- `agents` — 一对多关联 Agent（级联删除）
- `messages` — 一对多关联 Message（级联删除）

### 2. Agent（智能体）

文件：`app/models/agent.py`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `String(36)` PK | UUID 主键 |
| `project_id` | `String(36)` FK | 所属项目 ID |
| `name` | `String(200)` | 智能体名称 |
| `role` | `AgentRole` Enum | 角色：team_lead / sub_agent |
| `status` | `AgentStatus` Enum | 当前状态 |
| `system_prompt` | `Text` nullable | 系统提示词 |
| `persona` | `Text` nullable | 角色人设描述 |
| `task_id` | `String(36)` FK nullable | 当前执行的任务 ID (Sub-Agent) |
| `parent_agent_id` | `String(36)` FK nullable | 父 Agent ID（自引用） |
| `token_used` | `Integer` | 已消耗 Token 数，默认 0 |
| `progress` | `Integer` | 进度百分比 0-100 |
| `current_action` | `String(500)` nullable | 当前正在执行的操作描述 |
| `is_active` | `Boolean` | 是否活跃，销毁后设为 False |
| `created_at` / `updated_at` | `DateTime` | 时间戳 |

**AgentRole 枚举值：**
- `team_lead` — Team Lead（每个项目唯一）
- `sub_agent` — 子智能体

**AgentStatus 枚举值：**
- `idle` — 空闲
- `running` — 运行中
- `waiting_approval` — 等待审批
- `completed` — 已完成
- `failed` — 失败
- `destroyed` — 已销毁

### 3. Task（任务）

文件：`app/models/task.py`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `String(36)` PK | UUID 主键 |
| `project_id` | `String(36)` FK | 所属项目 ID |
| `title` | `String(500)` | 任务标题 |
| `description` | `Text` nullable | 任务描述 |
| `status` | `TaskStatus` Enum | 任务状态 |
| `priority` | `TaskPriority` Enum | 优先级 |
| `order_index` | `Integer` | 排序索引，默认 0 |
| `result` | `Text` nullable | 任务执行结果 |
| `error_message` | `Text` nullable | 错误信息 |
| `created_at` / `updated_at` | `DateTime` | 时间戳 |

**TaskStatus 枚举值：**
- `pending` — 待处理
- `awaiting_approval` — 等待审批
- `in_progress` — 执行中
- `paused` — 暂停
- `completed` — 已完成
- `failed` — 失败
- `cancelled` — 已取消

**TaskPriority 枚举值：** `low`, `medium`, `high`, `critical`

### 4. Message（消息）

文件：`app/models/message.py`

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `String(36)` PK | UUID 主键 |
| `project_id` | `String(36)` FK | 所属项目 ID |
| `agent_id` | `String(36)` nullable | 关联的智能体 ID（可空） |
| `role` | `MessageRole` Enum | 消息角色 |
| `content` | `Text` | 消息内容 |
| `metadata_json` | `Text` nullable | JSON 元数据 |
| `created_at` | `DateTime` | 创建时间 |

**MessageRole 枚举值：**
- `user` — 用户消息
- `team_lead` — Team Lead 消息
- `sub_agent` — 子智能体消息
- `system` — 系统消息
- `intervention` — 干预消息

### 如何添加新模型

1. 在 `app/models/` 下创建新文件，继承 `Base`
2. 在 `app/models/__init__.py` 中导入新模型
3. 在 `app/schemas/schemas.py` 中创建对应的 Pydantic 模型
4. 重启应用后，`init_db()` 会自动创建新表

---

## Pydantic 校验层 (Schemas)

文件：`app/schemas/schemas.py`

每个实体包含三种 Schema：

| Schema 类型 | 用途 | 示例 |
|-------------|------|------|
| `XxxCreate` | POST 请求体 | `ProjectCreate(name, goal)` |
| `XxxUpdate` | PATCH 请求体（字段均 Optional） | `ProjectUpdate(name?, goal?, status?)` |
| `XxxResponse` | API 响应 | `ProjectResponse` 含所有字段 + 时间戳 |

所有 Response 模型配置 `model_config = {"from_attributes": True}`，支持从 ORM 模型直接转换。

### 修改指南

- 添加新字段：在对应的模型和 Schema 中同时添加
- 所有 Create/Update Schema 仅包含客户端可设置的字段
- Response Schema 包含所有字段，用于 API 返回

---

## API 路由层

所有路由前缀为 `/api`，注册在 `app/main.py` 中。

### 1. Projects（项目管理）

文件：`app/api/projects.py` | 前缀：`/api/projects`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects` | 获取所有项目列表 |
| `GET` | `/api/projects/{id}` | 获取单个项目 |
| `POST` | `/api/projects/` | 创建项目（**自动创建 Team Lead**） |
| `PATCH` | `/api/projects/{id}` | 更新项目信息 |
| `DELETE` | `/api/projects/{id}` | 删除项目 |

> **注意**：`POST /api/projects/` 在创建项目时会自动创建一个 Team Lead 智能体，系统提示词为 "You are the Team Lead..."。

### 2. Agents（智能体管理）

文件：`app/api/agents.py` | 前缀：`/api/projects/{project_id}/agents`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `.../agents` | 获取项目下所有智能体 |
| `GET` | `.../agents/{id}` | 获取单个智能体 |
| `POST` | `.../agents/` | 创建新智能体 |
| `PATCH` | `.../agents/{id}` | 更新智能体信息 |
| `DELETE` | `.../agents/{id}` | **销毁**智能体 (设置 `is_active=False`, `status=destroyed`) |

### 3. Tasks（任务管理）

文件：`app/api/tasks.py` | 前缀：`/api/projects/{project_id}/tasks`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `.../tasks` | 获取项目下所有任务（按 `order_index` 排序） |
| `GET` | `.../tasks/{id}` | 获取单个任务 |
| `POST` | `.../tasks/` | 创建新任务 |
| `PATCH` | `.../tasks/{id}` | 更新任务信息 |
| `DELETE` | `.../tasks/{id}` | 删除任务 |

### 4. Messages（消息管理）

文件：`app/api/messages.py` | 前缀：`/api/projects/{project_id}/messages`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `.../messages` | 获取消息列表，支持 `?agent_id=` 和 `?limit=` 查询参数 |
| `POST` | `.../messages/` | 创建新消息 |

### 5. 编排端点（定义在 main.py）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/projects/{id}/decompose` | 触发 Team Lead 任务拆解 |
| `POST` | `/api/projects/{id}/dispatch` | 审批后派发任务到子智能体 |

### 6. 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 返回 `{status, app, version}` |

### 如何添加新 API 路由

1. 在 `app/api/` 下创建新文件
2. 创建 `APIRouter` 实例并定义路由
3. 在 `app/main.py` 中 `import` 并 `app.include_router()`

```python
# app/api/my_feature.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/api/my-feature", tags=["my-feature"])

@router.get("/")
async def list_items(db: AsyncSession = Depends(get_db)):
    # 业务逻辑
    return []
```

---

## 服务层 (Services)

### 1. Orchestrator（编排器）

文件：`app/services/orchestrator.py`

Orchestrator 是系统的核心调度引擎，负责 Hub-and-Spoke 模式中"Hub"的角色：

#### 主要方法

| 方法 | 说明 |
|------|------|
| `decompose_goal(project_id, goal)` | 接收用户目标，让 Team Lead 拆解为子任务列表 |
| `dispatch_tasks(project_id)` | 计划审批后，为每个 pending 任务生成子智能体并派发 |
| `handle_task_completion(task_id, result)` | 处理任务完成，销毁对应子智能体，检查项目是否全部完成 |

#### 工作流程

```
用户输入目标
    ↓
decompose_goal()
    ├── 找到 Team Lead
    ├── 记录用户消息
    ├── TODO: 调用 LLM 拆解目标 ← 需要实现
    ├── 生成 5 个占位子任务 (awaiting_approval)
    ├── 项目状态 → awaiting_approval
    ├── 记录 Team Lead 响应消息
    └── WebSocket 广播 plan_ready
    
用户审批计划
    ↓
dispatch_tasks()
    ├── 将所有 awaiting_approval 任务 → pending
    ├── 项目状态 → in_progress
    ├── 为每个任务 spawn_sub_agent()
    ├── 任务状态 → in_progress
    └── WebSocket 广播 agent_spawned
    
子任务完成
    ↓
handle_task_completion()
    ├── 任务状态 → completed，保存结果
    ├── destroy_sub_agent()
    ├── 检查所有任务是否完成
    ├── 如果全部完成 → 项目状态 completed
    └── WebSocket 广播 project_completed
```

#### 如何接入真实 LLM

当前 `decompose_goal()` 中有一个 TODO 标记，使用占位数据代替 LLM 调用。要接入真实 LLM：

```python
# 在 orchestrator.py 中替换占位代码为：
from openai import AsyncOpenAI
from app.config import settings

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
)

response = await client.chat.completions.create(
    model=settings.OPENAI_MODEL,
    messages=[
        {"role": "system", "content": team_lead.system_prompt},
        {"role": "user", "content": f"请将以下目标拆解为可独立执行的子任务：{goal}"},
    ],
    response_format={"type": "json_object"},
)
# 解析 response.choices[0].message.content 为 proposed_tasks
```

### 2. AgentManager（智能体管理器）

文件：`app/services/agent_manager.py`

管理子智能体的完整生命周期：

#### 主要方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `spawn_sub_agent()` | project_id, task_id, parent_agent_id, name, system_prompt, persona | 创建并激活新的子智能体 |
| `destroy_sub_agent()` | agent_id | 销毁子智能体（`is_active=False`, `status=destroyed`） |
| `update_progress()` | agent_id, progress, current_action, token_used | 更新进度信息，通过 WebSocket 实时推送 |
| `check_tool_approval()` | agent_id, tool_name | 检查工具调用是否需要用户审批 |
| `get_active_agents()` | project_id | 获取项目下所有活跃智能体 |

#### 工具审批机制

`check_tool_approval()` 方法检查 `SENSITIVE_TOOLS` 列表：
- 如果工具名在敏感列表中，暂停该智能体 (`status=waiting_approval`)
- 通过 WebSocket 广播 `intervention_required` 事件通知前端
- 返回 `needs_approval=True`

---

## WebSocket 实时通信

文件：`app/api/websocket.py`

### ConnectionManager

全局单例对象 `manager`，管理所有 WebSocket 连接：

| 方法 | 说明 |
|------|------|
| `connect(project_id, websocket)` | 注册到项目房间 |
| `disconnect(project_id, websocket)` | 从项目房间断开 |
| `broadcast(project_id, data)` | 向项目内所有连接广播消息 |
| `send_personal(websocket, data)` | 向单个连接发送消息 |

### 连接端点

```
ws://localhost:8000/ws/{project_id}
```

### 客户端 → 服务端消息

| type | 说明 |
|------|------|
| `user_message` | 用户发送消息 |
| `intervention_response` | 用户对干预的响应 |
| `ping` | 心跳检测 |

### 服务端 → 客户端事件

| type | 触发场景 | data 字段 |
|------|----------|-----------|
| `agent_status_changed` | 智能体状态/进度变化 | agent_id, status, progress, current_action, token_used |
| `task_status_changed` | 任务状态变化 | task_id, status |
| `task_completed` | 任务完成 | task_id, result |
| `new_message` | 新消息产生 | 完整 Message 对象 |
| `plan_ready` | 计划拆解完成 | project_id, tasks |
| `agent_spawned` | 子智能体创建 | agent_id, name, task_id |
| `agent_destroyed` | 子智能体销毁 | agent_id |
| `intervention_required` | 需要用户审批 | agent_id, agent_name, tool_name, message |
| `project_completed` | 项目所有任务完成 | project_id |
| `plan_approved` | 计划被批准 | approved, feedback |
| `tool_approved` | 工具调用被批准/拒绝 | agent_id, tool_name, approved, reason |
| `feedback_received` | 收到用户反馈 | agent_id, score, comment |
| `connected` | WebSocket 连接成功 | 无 |
| `pong` | 心跳响应 | 无 |

---

## 干预系统 (Interventions)

文件：`app/api/interventions.py`

干预系统是用户对智能体行为进行"人在回路"(Human-in-the-Loop) 控制的核心机制。

### 三种干预类型

#### 1. 计划审批 (Plan Approval)

```
POST /api/projects/{project_id}/interventions/approve-plan
{
    "approved": true,
    "feedback": "可选反馈信息"
}
```

Team Lead 拆解目标后，所有子任务处于 `awaiting_approval` 状态，需要用户审批后才能执行。

#### 2. 工具审批 (Tool Approval)

```
POST /api/projects/{project_id}/interventions/approve-tool
{
    "agent_id": "agent-uuid",
    "tool_name": "execute_code",
    "approved": true,
    "reason": "可选原因"
}
```

子智能体调用敏感工具时需要用户批准。敏感工具列表在 `config.py` 的 `SENSITIVE_TOOLS` 中配置。

#### 3. 中间反馈 (Intermediate Feedback)

```
POST /api/projects/{project_id}/interventions/feedback
{
    "agent_id": "agent-uuid",
    "score": 4,
    "comment": "可选评论"
}
```

用户可以在执行过程中对智能体的表现给出评分和反馈。

### 如何添加新的干预类型

1. 在 `interventions.py` 中定义新的 Pydantic 请求模型
2. 创建新的 POST 端点
3. 在 WebSocket 中广播对应的事件类型
4. 在前端 `ContextPanel` 中添加对应的 UI 处理

---

## 开发指南

### 添加新功能的典型流程

1. **定义模型** → `app/models/xxx.py` + `__init__.py` 导出
2. **定义 Schema** → `app/schemas/schemas.py`
3. **创建 API 路由** → `app/api/xxx.py`
4. **注册路由** → `app/main.py` 中 `include_router()`
5. **（可选）添加服务** → `app/services/xxx.py`
6. **（可选）添加 WebSocket 事件** → 在服务中 `manager.broadcast()`

### 数据库调试

SQLite 数据库文件为 `harness.db`，启动后自动创建在 backend 目录下。
可用 DB Browser for SQLite 等工具直接查看。

### 日志与调试

- FastAPI 自带请求日志
- `uvicorn --reload` 支持热重载
- WebSocket 调试可通过浏览器开发者工具的 Network > WS 面板

### CORS 配置

默认允许 `http://localhost:5173`（Vite）和 `http://localhost:3000`（CRA）。
生产环境需在 `config.py` 中修改 `CORS_ORIGINS`。

---

## 状态机说明

### 项目状态流转

```
planning → awaiting_approval → in_progress → completed
                                    ↓             ↑
                                  paused ─────────┘
                                    ↓
                                  failed
```

### 智能体状态流转

```
idle → running → completed
         ↓          ↑
   waiting_approval ┘
         ↓
       failed
         ↓
     destroyed
```

### 任务状态流转

```
pending → awaiting_approval → in_progress → completed
                                  ↓             ↑
                                paused ─────────┘
                                  ↓
                                failed
                                  ↓
                              cancelled
```

---

## 依赖清单 (requirements.txt)

```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
aiosqlite==0.19.0
greenlet==3.1.1
pydantic==2.5.2
python-dotenv==1.0.0
openai==1.6.1
websockets==12.0
```

---

> 本文档最后更新于项目初始化阶段。随着功能迭代，请同步更新此文档。
