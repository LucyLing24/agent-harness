# Agent Harness — API 接口文档

> Hub-and-Spoke Multi-Agent Management System  
> Base URL: `http://localhost:8000`  
> WebSocket: `ws://localhost:8000/ws/{project_id}`

---

## 一、系统健康检查

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/health` |
| **描述** | 检查系统状态 |
| **响应** | `{ "status": "ok", "app": "Agent Harness", "version": "0.1.0" }` |

---

## 二、项目管理 (Projects)

### 2.1 创建项目

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/` |
| **描述** | 创建新项目，自动创建 Team Lead 智能体 |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 项目名称（最大200字符） |
| `goal` | string | ✅ | 项目目标描述 |

**响应体 (ProjectResponse)：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 项目唯一ID |
| `name` | string | 项目名称 |
| `goal` | string | 项目目标 |
| `status` | enum | `planning` / `awaiting_approval` / `in_progress` / `paused` / `completed` / `failed` |
| `context_summary` | string \| null | 上下文摘要 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 2.2 获取项目列表

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/` |
| **描述** | 获取所有项目（按创建时间倒序） |
| **响应** | `ProjectResponse[]` |

---

### 2.3 获取项目详情

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}` |
| **描述** | 获取指定项目详情 |
| **路径参数** | `project_id` — 项目UUID |
| **响应** | `ProjectResponse` |

---

### 2.4 更新项目

| 字段 | 值 |
|------|------|
| **URL** | `PATCH /api/projects/{project_id}` |
| **描述** | 更新项目字段（部分更新） |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ❌ | 新名称 |
| `goal` | string | ❌ | 新目标 |
| `status` | string | ❌ | 新状态 |
| `context_summary` | string | ❌ | 上下文摘要 |

---

### 2.5 删除项目

| 字段 | 值 |
|------|------|
| **URL** | `DELETE /api/projects/{project_id}` |
| **描述** | 删除项目及关联的所有任务、智能体、消息 |
| **响应** | `{ "detail": "Project deleted" }` |

---

## 三、编排控制 (Orchestration)

### 3.1 目标分解

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/decompose` |
| **描述** | 触发 Team Lead 将目标分解为子任务列表，进入审批流程 |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `goal` | string | ✅ | 用户的宏观目标 |

**响应：**

```json
{
  "tasks": [
    { "title": "子任务标题", "description": "描述", "priority": "medium", "order_index": 0 }
  ]
}
```

---

### 3.2 任务派发

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/dispatch` |
| **描述** | 计划批准后，为每个待处理任务生成（spawn）Sub-agent |
| **响应** | `{ "detail": "Tasks dispatched" }` |

---

## 四、智能体管理 (Agents)

### 4.1 创建智能体

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/agents/` |
| **描述** | 在项目中创建新智能体 |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 智能体名称（最大100字符） |
| `role` | enum | ✅ | `team_lead` / `sub_agent` |
| `system_prompt` | string | ❌ | 系统提示词 |
| `persona` | string | ❌ | 人设描述 |
| `task_id` | string | ❌ | 关联任务ID |
| `parent_agent_id` | string | ❌ | 父智能体ID（Team Lead） |

**响应体 (AgentResponse)：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 智能体唯一ID |
| `project_id` | string | 所属项目ID |
| `name` | string | 名称 |
| `role` | enum | `team_lead` / `sub_agent` |
| `status` | enum | `idle` / `running` / `waiting_approval` / `completed` / `failed` / `destroyed` |
| `system_prompt` | string \| null | 系统提示词 |
| `persona` | string \| null | 人设 |
| `task_id` | string \| null | 当前任务ID |
| `parent_agent_id` | string \| null | 父智能体ID |
| `token_used` | int | Token消耗量 |
| `progress` | int (0-100) | 进度百分比 |
| `current_action` | string \| null | 当前正在执行的操作 |
| `is_active` | bool | 是否存活 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 4.2 获取智能体列表

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}/agents/` |
| **描述** | 列出项目中所有智能体 |
| **响应** | `AgentResponse[]` |

---

### 4.3 获取智能体详情

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}/agents/{agent_id}` |
| **描述** | 获取指定智能体详情 |
| **响应** | `AgentResponse` |

---

### 4.4 更新智能体

| 字段 | 值 |
|------|------|
| **URL** | `PATCH /api/projects/{project_id}/agents/{agent_id}` |
| **描述** | 更新智能体状态、进度等 |

**请求体（均为可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `name` | string | 名称 |
| `status` | string | 状态 |
| `system_prompt` | string | 系统提示词 |
| `persona` | string | 人设 |
| `token_used` | int | Token消耗 |
| `progress` | int | 进度 (0-100) |
| `current_action` | string | 当前操作 |
| `is_active` | bool | 是否存活 |

---

### 4.5 销毁智能体

| 字段 | 值 |
|------|------|
| **URL** | `DELETE /api/projects/{project_id}/agents/{agent_id}` |
| **描述** | 销毁（停用）子智能体，标记为 `destroyed` |
| **响应** | `{ "detail": "Agent destroyed" }` |

---

## 五、任务管理 (Tasks)

### 5.1 创建任务

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/tasks/` |
| **描述** | 在项目中创建新任务 |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 任务标题（最大300字符） |
| `description` | string | ❌ | 任务详细描述 |
| `priority` | enum | ❌ | `low` / `medium`(默认) / `high` / `critical` |
| `order_index` | int | ❌ | 排序索引（默认0） |

**响应体 (TaskResponse)：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 任务唯一ID |
| `project_id` | string | 所属项目ID |
| `title` | string | 标题 |
| `description` | string \| null | 描述 |
| `status` | enum | `pending` / `awaiting_approval` / `in_progress` / `paused` / `completed` / `failed` / `cancelled` |
| `priority` | enum | `low` / `medium` / `high` / `critical` |
| `order_index` | int | 排序索引 |
| `result` | string \| null | 任务执行结果 |
| `error_message` | string \| null | 错误信息 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

---

### 5.2 获取任务列表

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}/tasks/` |
| **描述** | 按排序索引获取项目中所有任务 |
| **响应** | `TaskResponse[]` |

---

### 5.3 获取任务详情

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}/tasks/{task_id}` |
| **描述** | 获取指定任务详情 |
| **响应** | `TaskResponse` |

---

### 5.4 更新任务

| 字段 | 值 |
|------|------|
| **URL** | `PATCH /api/projects/{project_id}/tasks/{task_id}` |
| **描述** | 更新任务状态、结果等 |

**请求体（均为可选）：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题 |
| `description` | string | 描述 |
| `status` | string | 状态 |
| `priority` | string | 优先级 |
| `order_index` | int | 排序 |
| `result` | string | 执行结果 |
| `error_message` | string | 错误信息 |

---

### 5.5 删除任务

| 字段 | 值 |
|------|------|
| **URL** | `DELETE /api/projects/{project_id}/tasks/{task_id}` |
| **描述** | 删除指定任务 |
| **响应** | `{ "detail": "Task deleted" }` |

---

## 六、消息管理 (Messages)

### 6.1 发送消息

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/messages/` |
| **描述** | 发送消息（用户输入 / 智能体回复 / 系统通知） |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `role` | enum | ✅ | `user` / `team_lead` / `sub_agent` / `system` / `intervention` |
| `content` | string | ✅ | 消息内容 |
| `agent_id` | string | ❌ | 关联智能体ID |
| `metadata_json` | string | ❌ | 附加元数据(JSON字符串) |

**响应体 (MessageResponse)：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 消息唯一ID |
| `project_id` | string | 所属项目ID |
| `agent_id` | string \| null | 关联智能体ID |
| `role` | enum | 消息角色 |
| `content` | string | 消息内容 |
| `metadata_json` | string \| null | 附加元数据 |
| `created_at` | datetime | 创建时间 |

---

### 6.2 获取消息列表

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}/messages/` |
| **描述** | 获取项目消息历史 |

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agent_id` | string | ❌ | 按智能体过滤 |
| `limit` | int | ❌ | 最大返回数（默认100） |

**响应：** `MessageResponse[]`

---

### 6.3 获取单条消息

| 字段 | 值 |
|------|------|
| **URL** | `GET /api/projects/{project_id}/messages/{message_id}` |
| **描述** | 获取指定消息详情 |
| **响应** | `MessageResponse` |

---

## 七、干预控制 (Interventions)

### 7.1 审批任务计划

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/interventions/approve-plan` |
| **描述** | 审批或驳回 Team Lead 生成的任务拆解计划（Planning Intervention） |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `approved` | bool | ✅ | `true` = 批准, `false` = 驳回 |
| `feedback` | string | ❌ | 驳回理由或修改建议 |

**响应：** `{ "detail": "Plan approved/rejected", "feedback": "..." }`

---

### 7.2 审批工具使用

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/interventions/approve-tool` |
| **描述** | 审批或拒绝敏感工具的使用（Environment Intervention） |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agent_id` | string | ✅ | 发起请求的智能体ID |
| `tool_name` | string | ✅ | 工具名称 |
| `approved` | bool | ✅ | `true` = 允许, `false` = 拒绝 |
| `reason` | string | ❌ | 拒绝原因 |

**响应：** `{ "detail": "Tool approved/rejected" }`

---

### 7.3 提交中途反馈

| 字段 | 值 |
|------|------|
| **URL** | `POST /api/projects/{project_id}/interventions/feedback` |
| **描述** | 对运行中的子智能体提交评分和纠正建议（Intermediate Feedback） |

**请求体：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agent_id` | string | ✅ | 目标智能体ID |
| `score` | int (1-5) | ✅ | 评分 |
| `comment` | string | ❌ | 纠正建议 |

**响应：** `{ "detail": "Feedback submitted", "score": 4 }`

---

## 八、WebSocket 实时通信

### 连接

```
ws://localhost:8000/ws/{project_id}
```

### 客户端发送事件

| 事件类型 | data 字段 | 说明 |
|----------|-----------|------|
| `user_message` | `{ content, role, ... }` | 用户发送聊天消息 |
| `intervention_response` | `{ agent_id, approved, ... }` | 用户对干预请求的响应 |
| `ping` | `{}` | 心跳检测 |

### 服务端推送事件

| 事件类型 | data 字段 | 说明 |
|----------|-----------|------|
| `agent_status_changed` | `{ agent_id, status, progress, current_action, token_used }` | 智能体状态/进度变更 |
| `task_status_changed` | `{ task_id, status }` | 任务状态变更 |
| `new_message` | `MessageResponse` 结构 | 新消息推送 |
| `intervention_required` | `{ agent_id, agent_name, tool_name, message }` | 需要人工审批（敏感工具） |
| `plan_ready` | `{ project_id, tasks: [{ id, title, description }] }` | 任务计划就绪，等待审批 |
| `plan_approved` | `{ project_id }` | 计划已被批准 |
| `plan_rejected` | `{ project_id, feedback }` | 计划被驳回 |
| `tool_approved` | `{ agent_id, tool_name }` | 工具使用被批准 |
| `tool_rejected` | `{ agent_id, tool_name, reason }` | 工具使用被拒绝 |
| `feedback_received` | `{ agent_id, score, comment }` | 收到中途反馈 |
| `agent_spawned` | `{ agent_id, task_id, task_title }` | Sub-agent 被创建 |
| `task_completed` | `{ agent_id, task_id, task_title }` | 任务已完成 |
| `project_completed` | `{ project_id }` | 项目已全部完成 |
| `pong` | `{}` | 心跳响应 |
| `error` | `{ message }` | 错误推送 |

---

## 九、接口总览表

| # | 方法 | 路径 | 用途 | 对应层级 |
|---|------|------|------|----------|
| 1 | GET | `/api/health` | 健康检查 | 基础 |
| 2 | POST | `/api/projects/` | 创建项目 | 项目管理 |
| 3 | GET | `/api/projects/` | 项目列表 | 项目管理 |
| 4 | GET | `/api/projects/{id}` | 项目详情 | 项目管理 |
| 5 | PATCH | `/api/projects/{id}` | 更新项目 | 项目管理 |
| 6 | DELETE | `/api/projects/{id}` | 删除项目 | 项目管理 |
| 7 | POST | `/api/projects/{id}/decompose` | 目标分解 | 编排控制 |
| 8 | POST | `/api/projects/{id}/dispatch` | 任务派发 | 编排控制 |
| 9 | POST | `/api/projects/{id}/agents/` | 创建智能体 | 智能体管理 |
| 10 | GET | `/api/projects/{id}/agents/` | 智能体列表 | 智能体管理 |
| 11 | GET | `/api/projects/{id}/agents/{aid}` | 智能体详情 | 智能体管理 |
| 12 | PATCH | `/api/projects/{id}/agents/{aid}` | 更新智能体 | 智能体管理 |
| 13 | DELETE | `/api/projects/{id}/agents/{aid}` | 销毁智能体 | 智能体管理 |
| 14 | POST | `/api/projects/{id}/tasks/` | 创建任务 | 任务管理 |
| 15 | GET | `/api/projects/{id}/tasks/` | 任务列表 | 任务管理 |
| 16 | GET | `/api/projects/{id}/tasks/{tid}` | 任务详情 | 任务管理 |
| 17 | PATCH | `/api/projects/{id}/tasks/{tid}` | 更新任务 | 任务管理 |
| 18 | DELETE | `/api/projects/{id}/tasks/{tid}` | 删除任务 | 任务管理 |
| 19 | POST | `/api/projects/{id}/messages/` | 发送消息 | 消息管理 |
| 20 | GET | `/api/projects/{id}/messages/` | 消息列表 | 消息管理 |
| 21 | GET | `/api/projects/{id}/messages/{mid}` | 消息详情 | 消息管理 |
| 22 | POST | `/api/projects/{id}/interventions/approve-plan` | 审批计划 | 干预控制 |
| 23 | POST | `/api/projects/{id}/interventions/approve-tool` | 审批工具 | 干预控制 |
| 24 | POST | `/api/projects/{id}/interventions/feedback` | 中途反馈 | 干预控制 |
| 25 | WS | `/ws/{project_id}` | 实时通信 | WebSocket |

---

## 十、敏感工具列表（需要审批）

| 工具名 | 说明 |
|--------|------|
| `execute_code` | 执行代码 |
| `file_write` | 写入文件 |
| `database_write` | 写入数据库 |
| `payment` | 资金操作 |

> 可在 `backend/app/config.py` 的 `SENSITIVE_TOOLS` 中配置。

---

## 十一、状态机

### 项目状态流转

```
planning → awaiting_approval → in_progress → completed
                ↓                    ↓
            planning (驳回)       paused / failed
```

### 智能体状态流转

```
idle → running → completed → destroyed
         ↓           ↑
   waiting_approval ─┘
         ↓
       failed → destroyed
```

### 任务状态流转

```
pending → awaiting_approval → in_progress → completed
                                   ↓
                              paused / failed / cancelled
```
