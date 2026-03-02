/**
 * PlannerPanel — Left sidebar showing the topology tree.
 * Displays: Project goal, Team Lead → Tasks → Sub-agents hierarchy.
 * Also shows the Output section at the bottom.
 */
import React from "react";
import { Tag, Progress, Tooltip, Badge, Button, Space, Typography } from "antd";
import {
  PlusOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  TeamOutlined,
  NodeIndexOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../../store";
import type { Agent, Task } from "../../types";
import "./PlannerPanel.css";

const { Text, Title } = Typography;

const statusColors: Record<string, string> = {
  idle: "#d9d9d9",
  running: "#52c41a",
  waiting_approval: "#faad14",
  completed: "#1677ff",
  failed: "#ff4d4f",
  destroyed: "#8c8c8c",
  pending: "#d9d9d9",
  in_progress: "#52c41a",
  awaiting_approval: "#faad14",
  cancelled: "#8c8c8c",
};

const agentNodeColor = (agent: Agent) => {
  const colors: Record<string, string> = {
    idle: "#52c41a",
    running: "#faad14",
    waiting_approval: "#fa8c16",
    completed: "#1677ff",
    failed: "#ff4d4f",
    destroyed: "#8c8c8c",
  };
  return colors[agent.status] || "#d9d9d9";
};

const PlannerPanel: React.FC = () => {
  const { currentProject, agents, tasks, setSelectedAgent } = useAppStore();

  const teamLead = agents.find((a) => a.role === "team_lead");
  const subAgents = agents.filter((a) => a.role === "sub_agent" && a.is_active);
  const destroyedAgents = agents.filter((a) => a.role === "sub_agent" && !a.is_active);

  return (
    <div className="planner-panel">
      {/* Project Goal Header */}
      <div className="planner-goal">
        <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
          目标：{currentProject?.name || "未选择项目"}
        </Tag>
      </div>

      {/* Planner Section */}
      <div className="planner-section">
        <Text type="secondary" style={{ fontSize: 12 }}>
          Planner
        </Text>

        {/* Team Lead Node */}
        <div className="planner-tree">
          <div className="tree-node team-lead-node" onClick={() => teamLead && setSelectedAgent(teamLead)}>
            <div className="node-label">Team Lead</div>
            <div
              className="node-dot"
              style={{ backgroundColor: "#001529", width: 28, height: 28 }}
            />
          </div>

          {/* Arrow */}
          <div className="tree-connector">↓</div>

          {/* Tasks Box */}
          <div className="tasks-box">
            <NodeIndexOutlined /> tasks ({tasks.length})
          </div>

          {/* Sub-agent nodes */}
          <div className="tree-connector">
            <svg width="100%" height="40" style={{ overflow: "visible" }}>
              {subAgents.map((_, i) => {
                const totalWidth = Math.min(subAgents.length * 50, 240);
                const startX = (280 - totalWidth) / 2;
                const x = startX + i * (totalWidth / Math.max(subAgents.length - 1, 1));
                return (
                  <line
                    key={i}
                    x1="140"
                    y1="0"
                    x2={x}
                    y2="40"
                    stroke="#91caff"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                  />
                );
              })}
            </svg>
          </div>

          <div className="agent-nodes-row">
            {subAgents.map((agent) => (
              <Tooltip
                key={agent.id}
                title={`${agent.name} — ${agent.status} (${agent.progress}%)`}
              >
                <div
                  className="node-dot agent-dot"
                  style={{ backgroundColor: agentNodeColor(agent) }}
                  onClick={() => setSelectedAgent(agent)}
                />
              </Tooltip>
            ))}
          </div>

          {/* Destroyed agents (smaller, below) */}
          {destroyedAgents.length > 0 && (
            <div className="agent-nodes-row destroyed-row">
              {destroyedAgents.map((agent) => (
                <Tooltip key={agent.id} title={`${agent.name} (已销毁)`}>
                  <div
                    className="node-dot agent-dot-small"
                    style={{ backgroundColor: "#8c8c8c" }}
                    onClick={() => setSelectedAgent(agent)}
                  />
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Output Section */}
      <div className="planner-output">
        <div className="output-icon">
          <div style={{ fontSize: 40, color: "#595959" }}>📄 {"</>"}</div>
          <Text style={{ fontSize: 12 }}>Output</Text>
        </div>
        <Space size={4}>
          <Button type="text" icon={<PlusOutlined />} size="small" />
          <Button type="text" icon={<CloseCircleOutlined />} size="small" />
          <Button type="text" icon={<ExportOutlined />} size="small" />
        </Space>
      </div>
    </div>
  );
};

export default PlannerPanel;
