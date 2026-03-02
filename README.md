# 🕹️ Agent Harness — 中心辐射型多智能体管理系统

> Hub-and-Spoke Multi-Agent Management System

将用户从"聊天参与者"转化为"即时战略游戏指挥官"。采用扁平化、一次性工作流，最大程度降低多智能体死锁和幻觉。

---

## 📐 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ Planner  │  │  Chat Panel  │  │  Context Panel     │     │
│  │ (拓扑图) │  │  (对话交互)  │  │  (上下文/任务/消息) │     │
│  └──────────┘  └──────────────┘  └────────────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API + WebSocket
┌────────────────────────┴────────────────────────────────────┐
│                       Backend (FastAPI)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Orchestrator │  │ Agent Manager│  │ Intervention API │   │
│  │ (调度引擎)   │  │ (生命周期)   │  │ (人机回路)       │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│                         │                                    │
│                    SQLite Database                            │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ 项目结构

```
harness/
├── backend/                    # Python FastAPI 后端
│   ├── app/
│   │   ├── api/               # REST API 路由
│   │   │   ├── projects.py    # 项目 CRUD
│   │   │   ├── agents.py      # 智能体管理
│   │   │   ├── tasks.py       # 任务管理
│   │   │   ├── messages.py    # 消息管理
│   │   │   ├── interventions.py # 干预控制
│   │   │   └── websocket.py   # WebSocket 实时通信
│   │   ├── models/            # SQLAlchemy 数据模型
│   │   ├── schemas/           # Pydantic 验证模型
│   │   ├── services/          # 业务逻辑
│   │   │   ├── orchestrator.py # Team Lead 调度引擎
│   │   │   └── agent_manager.py # Sub-agent 生命周期
│   │   ├── config.py          # 配置
│   │   ├── database.py        # 数据库连接
│   │   └── main.py            # FastAPI 入口
│   ├── requirements.txt
│   └── venv/
├── frontend/                   # React + TypeScript 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── PlannerPanel/  # 左侧拓扑面板
│   │   │   ├── ChatPanel/     # 中间对话面板
│   │   │   └── ContextPanel/  # 右侧上下文面板
│   │   ├── services/          # API 调用 & WebSocket
│   │   ├── store/             # Zustand 状态管理
│   │   └── types/             # TypeScript 类型
│   └── package.json
└── docs/
    └── API_INTERFACES.md      # 完整接口文档（25个接口）
```

## 🚀 快速启动

### 后端

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 文档自动生成：http://localhost:8000/docs
 
### 前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173

## 🔑 核心设计原则

1. **单任务生命周期** — Sub-agent 只为一件任务而生，完成即销毁
2. **绝对信息隔离** — Sub-agent 间不可通信、不可感知、不可派生
3. **单点汇报线** — 所有产出只汇报给 Team Lead
4. **三重拦截** — 计划审批 → 中途反馈 → 工具授权

## 📡 接口概览

详见 [docs/API_INTERFACES.md](docs/API_INTERFACES.md)（25 个 REST/WebSocket 接口的完整定义）
