/**
 * ContextPanel — Right sidebar with context tabs.
 * Shows: Basic Info, System Prompt, Active Persona, Conversation History, User Profile.
 * Tabs: Context | Tasks | Msg
 */
import React from "react";
import { Tabs, Card, Typography, Tag, Progress, List, Badge, Empty, Button, Descriptions, Rate, Space } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../../store";
import { interventionsApi, projectsApi } from "../../services/api";
import type { Task, Agent } from "../../types";
import "./ContextPanel.css";

const { Text, Title, Paragraph } = Typography;

const taskStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
    case "in_progress": return <ClockCircleOutlined style={{ color: "#1677ff" }} />;
    case "failed": return <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />;
    default: return <ClockCircleOutlined style={{ color: "#d9d9d9" }} />;
  }
};

const ContextPanel: React.FC = () => {
  const {
    currentProject,
    selectedAgent,
    agents,
    tasks,
    messages,
    contextTab,
    setContextTab,
    interventions,
    removeIntervention,
  } = useAppStore();

  const teamLead = agents.find((a) => a.role === "team_lead");

  const handleApprovePlan = async (approved: boolean) => {
    if (!currentProject) return;
    await interventionsApi.approvePlan(currentProject.id, approved);
    if (approved) {
      await projectsApi.dispatch(currentProject.id);
    }
  };

  // ---- Context Tab Content ----
  const renderContextTab = () => (
    <div className="context-content">
      {/* Basic Info */}
      <Card
        className="context-card"
        hoverable
        onClick={() => {}}
      >
        <div className="context-card-inner">
          <ProfileOutlined />
          <Text strong>Basic Info</Text>
        </div>
        {selectedAgent && (
          <div className="context-card-detail">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="名称">{selectedAgent.name}</Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={selectedAgent.role === "team_lead" ? "blue" : "green"}>
                  {selectedAgent.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={selectedAgent.status === "running" ? "processing" : "default"}
                  text={selectedAgent.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Token消耗">{selectedAgent.token_used}</Descriptions.Item>
              <Descriptions.Item label="进度">
                <Progress percent={selectedAgent.progress} size="small" />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>

      {/* System Prompt */}
      <Card className="context-card" hoverable>
        <div className="context-card-inner">
          <FileTextOutlined />
          <Text strong>System Prompt</Text>
        </div>
        {selectedAgent?.system_prompt && (
          <div className="context-card-detail">
            <Paragraph ellipsis={{ rows: 3, expandable: true }}>
              {selectedAgent.system_prompt}
            </Paragraph>
          </div>
        )}
      </Card>

      {/* Active Persona */}
      <Card className="context-card" hoverable>
        <div className="context-card-inner">
          <RobotOutlined />
          <Text strong>Active Persona</Text>
        </div>
        {selectedAgent?.persona && (
          <div className="context-card-detail">
            <Text>{selectedAgent.persona}</Text>
          </div>
        )}
      </Card>

      {/* Conversation History */}
      <Card className="context-card" hoverable>
        <div className="context-card-inner">
          <HistoryOutlined />
          <Text strong>Conversation History</Text>
        </div>
        <div className="context-card-detail">
          <Text type="secondary">{messages.length} 条消息</Text>
        </div>
      </Card>

      {/* User Profile */}
      <Card className="context-card" hoverable>
        <div className="context-card-inner">
          <UserOutlined />
          <Text strong>User Profile</Text>
        </div>
      </Card>
    </div>
  );

  // ---- Tasks Tab Content ----
  const renderTasksTab = () => (
    <div className="context-content">
      {currentProject?.status === "awaiting_approval" && (
        <Card className="approval-card" size="small">
          <Text strong>📋 计划待审批</Text>
          <Paragraph type="secondary" style={{ margin: "8px 0" }}>
            Team Lead 已完成任务拆解，请审核以下计划：
          </Paragraph>
          <Space>
            <Button type="primary" size="small" onClick={() => handleApprovePlan(true)}>
              ✅ 批准
            </Button>
            <Button danger size="small" onClick={() => handleApprovePlan(false)}>
              ❌ 驳回
            </Button>
          </Space>
        </Card>
      )}

      <List
        dataSource={tasks}
        locale={{ emptyText: <Empty description="暂无任务" /> }}
        renderItem={(task: Task) => (
          <List.Item>
            <List.Item.Meta
              avatar={taskStatusIcon(task.status)}
              title={
                <span>
                  {task.title}
                  <Tag
                    color={task.priority === "critical" ? "red" : task.priority === "high" ? "orange" : "default"}
                    style={{ marginLeft: 8, fontSize: 10 }}
                  >
                    {task.priority}
                  </Tag>
                </span>
              }
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{task.description}</Text>
                  <br />
                  <Tag style={{ fontSize: 10, marginTop: 4 }}>{task.status}</Tag>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  // ---- Messages Tab Content ----
  const renderMsgTab = () => (
    <div className="context-content">
      {/* Intervention Alerts */}
      {interventions.map((inv) => (
        <Card key={inv.agent_id} className="intervention-card" size="small">
          <Text strong>⚠️ {inv.message}</Text>
          <Space style={{ marginTop: 8 }}>
            <Button
              type="primary"
              size="small"
              onClick={async () => {
                if (currentProject) {
                  await interventionsApi.approveTool(
                    currentProject.id, inv.agent_id, inv.tool_name, true
                  );
                  removeIntervention(inv.agent_id);
                }
              }}
            >
              允许
            </Button>
            <Button
              danger
              size="small"
              onClick={async () => {
                if (currentProject) {
                  await interventionsApi.approveTool(
                    currentProject.id, inv.agent_id, inv.tool_name, false, "Rejected by user"
                  );
                  removeIntervention(inv.agent_id);
                }
              }}
            >
              拒绝
            </Button>
          </Space>
        </Card>
      ))}

      <List
        dataSource={messages.slice(-20)}
        locale={{ emptyText: <Empty description="暂无消息" /> }}
        renderItem={(msg) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Tag color={msg.role === "user" ? "blue" : msg.role === "system" ? "purple" : "green"}>
                  {msg.role}
                </Tag>
              }
              description={
                <Text ellipsis style={{ fontSize: 12 }}>
                  {msg.content.slice(0, 100)}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  const tabItems = [
    { key: "context", label: "Context", children: renderContextTab() },
    { key: "tasks", label: <Badge count={tasks.filter(t => t.status === "awaiting_approval").length} size="small" offset={[6, 0]}>Tasks</Badge>, children: renderTasksTab() },
    { key: "msg", label: <Badge count={interventions.length} size="small" offset={[6, 0]}>Msg</Badge>, children: renderMsgTab() },
  ];

  return (
    <div className="context-panel">
      <Tabs
        activeKey={contextTab}
        onChange={(k) => setContextTab(k as "context" | "tasks" | "msg")}
        items={tabItems}
        className="context-tabs"
      />
    </div>
  );
};

export default ContextPanel;
