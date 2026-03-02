#!/bin/bash
#
# Agent Harness — 一键启动脚本
# 同时启动前端 (Vite) 和后端 (FastAPI)，各自在独立的 Terminal 窗口中运行
#

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 启动后端 — 新 Terminal 窗口
osascript -e "
tell application \"Terminal\"
    activate
    set backendTab to do script \"cd '$PROJECT_DIR/backend' && source venv/bin/activate && echo '🚀 启动后端服务 (FastAPI)...' && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000\"
    set custom title of front window to \"Backend — Agent Harness\"
end tell
"

# 启动前端 — 新 Terminal 窗口
osascript -e "
tell application \"Terminal\"
    activate
    do script \"cd '$PROJECT_DIR/frontend' && echo '🚀 启动前端服务 (Vite)...' && npm run dev\"
    set custom title of front window to \"Frontend — Agent Harness\"
end tell
"

echo ""
echo "✅ Agent Harness 已启动！"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:8000"
echo "   API 文档: http://localhost:8000/docs"
echo ""
