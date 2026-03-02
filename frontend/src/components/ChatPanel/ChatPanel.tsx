/**
 * ChatPanel — Center panel with tab-based chat interface.
 * Tabs: Leader, Field, Mate 1, Mate 2
 * Shows conversation history + input area.
 */
import React, { useState, useRef, useEffect } from "react";
import { Tabs, Input, Button, Typography, Tag, Space, Avatar, Tooltip } from "antd";
import {
  SendOutlined,
  AudioOutlined,
  AudioMutedOutlined,
} from "@ant-design/icons";
import { useAppStore } from "../../store";
import { messagesApi, projectsApi } from "../../services/api";
import "./ChatPanel.css";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const roleLabels: Record<string, string> = {
  user: "用户",
  team_lead: "Team Lead",
  sub_agent: "Sub-Agent",
  system: "系统",
  intervention: "干预",
};

const roleColors: Record<string, string> = {
  user: "#e6f4ff",
  team_lead: "#f6ffed",
  sub_agent: "#fff7e6",
  system: "#f9f0ff",
  intervention: "#fff1f0",
};

const ChatPanel: React.FC = () => {
  const { currentProject, messages, addMessage, activeTab, setActiveTab } =
    useAppStore();
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !currentProject) return;
    setSending(true);
    try {
      // Create user message
      const msg = await messagesApi.create(currentProject.id, {
        role: "user",
        content: inputValue.trim(),
      });
      addMessage(msg);

      // If first message, trigger decomposition
      if (messages.length === 0) {
        await projectsApi.decompose(currentProject.id, inputValue.trim());
      }

      setInputValue("");
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = messages; // In future, filter by tab

  const tabItems = [
    { key: "leader", label: "Leader" },
    { key: "field", label: "Field" },
    { key: "mate1", label: "Mate 1" },
    { key: "mate2", label: "Mate 2" },
  ];

  return (
    <div className="chat-panel">
      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as typeof activeTab)}
        items={tabItems}
        className="chat-tabs"
      />

      {/* Messages Area */}
      <div className="chat-messages">
        {!currentProject && (
          <div className="chat-empty">
            <Text type="secondary">请先创建或选择一个项目</Text>
          </div>
        )}

        {filteredMessages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-message ${msg.role === "user" ? "chat-message-user" : "chat-message-agent"}`}
          >
            <div
              className="message-bubble"
              style={{ backgroundColor: roleColors[msg.role] || "#f5f5f5" }}
            >
              <div className="message-header">
                <Tag color={msg.role === "user" ? "blue" : "green"} style={{ fontSize: 11 }}>
                  {roleLabels[msg.role] || msg.role}
                </Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
              </div>
              <Paragraph
                style={{ margin: 0, whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </Paragraph>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <span className="input-prefix">+</span>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              currentProject
                ? "输入消息..."
                : "请先创建项目"
            }
            disabled={!currentProject || sending}
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="chat-input"
          />
          <Space className="input-actions">
            <Tooltip title="语音输入">
              <Button type="text" icon={<AudioOutlined />} size="small" />
            </Tooltip>
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              disabled={!inputValue.trim() || !currentProject}
              size="small"
            />
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
