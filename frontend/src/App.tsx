/**
 * Agent Harness — Main Application Layout
 * Three-panel layout: Planner | Chat | Context
 */
import React, { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Modal,
  Input,
  Form,
  Typography,
  Space,
  message,
  Select,
  Spin,
} from "antd";
import { PlusOutlined, FolderOpenOutlined } from "@ant-design/icons";
import PlannerPanel from "./components/PlannerPanel";
import ChatPanel from "./components/ChatPanel";
import ContextPanel from "./components/ContextPanel";
import { useAppStore } from "./store";
import { wsService } from "./services/websocket";
import type { WSEvent } from "./types";
import "./App.css";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const App: React.FC = () => {
  const {
    currentProject,
    projects,
    loading,
    loadProjects,
    createProject,
    selectProject,
    updateAgentInStore,
    updateTaskInStore,
    addMessage,
    addIntervention,
    loadAgents,
    loadTasks,
    loadMessages,
  } = useAppStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Connect WebSocket when project selected
  useEffect(() => {
    if (currentProject) {
      wsService.connect(currentProject.id);
      const unsub = wsService.onEvent((event: WSEvent) => {
        handleWSEvent(event);
      });
      return () => {
        unsub();
        wsService.disconnect();
      };
    }
  }, [currentProject?.id]);

  const handleWSEvent = (event: WSEvent) => {
    const data = event.data as Record<string, any>;
    switch (event.type) {
      case "agent_status_changed":
        updateAgentInStore({
          id: data.agent_id,
          status: data.status,
          progress: data.progress,
          current_action: data.current_action,
          token_used: data.token_used,
        });
        break;
      case "task_status_changed":
      case "task_completed":
        if (currentProject) loadTasks(currentProject.id);
        break;
      case "new_message":
        if (data.id) addMessage(data as any);
        break;
      case "intervention_required":
        addIntervention({
          agent_id: data.agent_id,
          agent_name: data.agent_name,
          tool_name: data.tool_name,
          message: data.message,
        });
        message.warning(`⚠️ 需要审批: ${data.message}`);
        break;
      case "plan_ready":
        if (currentProject) {
          loadTasks(currentProject.id);
          loadAgents(currentProject.id);
        }
        message.info("📋 任务计划已就绪，请审批");
        break;
      case "agent_spawned":
        if (currentProject) loadAgents(currentProject.id);
        break;
      case "project_completed":
        message.success("🎉 项目已完成！");
        break;
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const project = await createProject(values.name, values.goal);
      await selectProject(project);
      setCreateModalOpen(false);
      form.resetFields();
      message.success("项目已创建");
    } catch (err) {
      // validation error
    }
  };

  const handleSelectProject = async (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      await selectProject(project);
      setSelectModalOpen(false);
    }
  };

  return (
    <Layout className="app-layout">
      {/* Top Header */}
      <Header className="app-header">
        <div className="header-left">
          <Title level={4} style={{ color: "#fff", margin: 0 }}>
            🕹️ Agent Harness
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginLeft: 12 }}>
            Hub-and-Spoke Multi-Agent Management
          </Text>
        </div>
        <Space className="header-right">
          {currentProject && (
            <Text style={{ color: "rgba(255,255,255,0.85)" }}>
              📌 {currentProject.name}
            </Text>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            新建项目
          </Button>
          <Button
            icon={<FolderOpenOutlined />}
            onClick={() => {
              loadProjects();
              setSelectModalOpen(true);
            }}
          >
            打开项目
          </Button>
        </Space>
      </Header>

      {/* Main Three-Panel Layout */}
      <Layout className="app-body">
        {/* Left Panel — Planner */}
        <Sider width={300} className="panel-sider panel-left">
          {currentProject ? (
            <PlannerPanel />
          ) : (
            <div className="panel-empty">
              <Text type="secondary">创建或选择项目以开始</Text>
            </div>
          )}
        </Sider>

        {/* Center Panel — Chat */}
        <Content className="panel-center">
          <Spin spinning={loading}>
            <ChatPanel />
          </Spin>
        </Content>

        {/* Right Panel — Context */}
        <Sider width={320} className="panel-sider panel-right">
          <ContextPanel />
        </Sider>
      </Layout>

      {/* Create Project Modal */}
      <Modal
        title="🚀 创建新项目"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: "请输入项目名称" }]}
          >
            <Input placeholder="例如：外卖APP开发" />
          </Form.Item>
          <Form.Item
            name="goal"
            label="项目目标"
            rules={[{ required: true, message: "请描述项目目标" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="详细描述你的项目目标，Team Lead 将据此生成任务计划..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Select Project Modal */}
      <Modal
        title="📂 选择项目"
        open={selectModalOpen}
        onCancel={() => setSelectModalOpen(false)}
        footer={null}
      >
        {projects.length === 0 ? (
          <Text type="secondary">暂无项目，请先创建</Text>
        ) : (
          <Select
            style={{ width: "100%" }}
            placeholder="选择项目"
            onChange={handleSelectProject}
            options={projects.map((p) => ({
              label: `${p.name} — ${p.status}`,
              value: p.id,
            }))}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default App;
