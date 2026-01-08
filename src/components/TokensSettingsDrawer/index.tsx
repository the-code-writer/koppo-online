import React, { useState, useRef, useEffect } from "react";
import {
  Drawer,
  Form,
  Button,
  Input,
  Card,
  Alert,
  Typography,
  Tabs,
  Space,
  List,
  Tag,
  Collapse,
  Divider,
  Switch,
  Select,
  Upload,
  message,
  Modal,
  Tooltip,
  Table,
  Popconfirm,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyOutlined,
  GoogleOutlined,
  PhoneOutlined,
  MailOutlined,
  KeyOutlined,
  CopyOutlined,
  DownloadOutlined,
  UploadOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  InfoCircleOutlined,
  MobileOutlined,
  WhatsAppOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  GlobalOutlined,
  LaptopOutlined,
  TabletOutlined,
} from "@ant-design/icons";
import "./styles.scss";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface TokensSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user?: any;
}

interface Session {
  id: string;
  name: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

interface APIToken {
  id: string;
  name: string;
  token: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  expiresAt?: string;
}

const TokensSettingsDrawer: React.FC<TokensSettingsDrawerProps> = ({
  visible,
  onClose,
  user,
}) => {
  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      name: "Chrome on MacBook Pro",
      device: "laptop",
      location: "San Francisco, CA",
      ipAddress: "192.168.1.100",
      lastActive: "2 minutes ago",
      current: true,
    },
    {
      id: "2",
      name: "iPhone 14 Pro",
      device: "mobile",
      location: "New York, NY",
      ipAddress: "192.168.1.101",
      lastActive: "1 hour ago",
      current: false,
    },
    {
      id: "3",
      name: "iPad Air",
      device: "tablet",
      location: "Los Angeles, CA",
      ipAddress: "192.168.1.102",
      lastActive: "3 days ago",
      current: false,
    },
  ]);

  // API Tokens State
  const [apiTokens, setApiTokens] = useState<APIToken[]>([
    {
      id: "1",
      name: "Production API",
      token: "pk_live_1234567890abcdef",
      permissions: ["read", "write"],
      createdAt: "2024-01-01",
      lastUsed: "2 hours ago",
    },
    {
      id: "2",
      name: "Development API",
      token: "pk_test_0987654321fedcba",
      permissions: ["read"],
      createdAt: "2024-01-15",
      lastUsed: "1 day ago",
      expiresAt: "2024-12-31",
    },
  ]);

  // Form States
  const [showCreateTokenModal, setShowCreateTokenModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenPermissions, setNewTokenPermissions] = useState<string[]>(["read"]);
  const [generatedToken, setGeneratedToken] = useState("");
  const [showGeneratedToken, setShowGeneratedToken] = useState(false);

  // Session Handlers
  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter(session => session.id !== sessionId));
    message.success("Session revoked successfully");
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions(sessions.filter(session => session.current));
    message.success("All other sessions revoked successfully");
  };

  // Token Handlers
  const handleCreateToken = () => {
    const token = `pk_${Math.random().toString(36).substr(2, 32)}`;
    const newToken: APIToken = {
      id: (apiTokens.length + 1).toString(),
      name: newTokenName,
      token,
      permissions: newTokenPermissions,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: "Never",
    };
    
    setApiTokens([...apiTokens, newToken]);
    setGeneratedToken(token);
    setShowGeneratedToken(true);
    setNewTokenName("");
    setNewTokenPermissions(["read"]);
    setShowCreateTokenModal(false);
    message.success("API token created successfully");
  };

  const handleRevokeToken = (tokenId: string) => {
    setApiTokens(apiTokens.filter(token => token.id !== tokenId));
    message.success("API token revoked successfully");
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    message.success("Token copied to clipboard");
  };

  const handleCopyGeneratedToken = () => {
    navigator.clipboard.writeText(generatedToken);
    message.success("Token copied to clipboard");
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "laptop":
        return <LaptopOutlined />;
      case "mobile":
        return <MobileOutlined />;
      case "tablet":
        return <TabletOutlined />;
      default:
        return <GlobalOutlined />;
    }
  };

  const getPermissionsColor = (permissions: string[]) => {
    if (permissions.includes("write")) return "red";
    if (permissions.includes("read")) return "green";
    return "default";
  };

  const sessionColumns = [
    {
      title: "Device",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Session) => (
        <Space>
          {getDeviceIcon(record.device)}
          <div>
            <div>{name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.location} • {record.ipAddress}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Last Active",
      dataIndex: "lastActive",
      key: "lastActive",
    },
    {
      title: "Status",
      dataIndex: "current",
      key: "current",
      render: (current: boolean) => (
        current ? <Tag color="green">Current</Tag> : <Tag>Other</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Session) => (
        !record.current && (
          <Popconfirm
            title="Revoke this session?"
            description="This will log out the device and require re-authentication."
            onConfirm={() => handleRevokeSession(record.id)}
            okText="Revoke"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              Revoke
            </Button>
          </Popconfirm>
        )
      ),
    },
  ];

  const tokenColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions: string[]) => (
        <Space>
          {permissions.map(perm => (
            <Tag key={perm} color={getPermissionsColor(permissions)}>
              {perm}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Last Used",
      dataIndex: "lastUsed",
      key: "lastUsed",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: APIToken) => (
        <Space>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => handleCopyToken(record.token)}
          />
          <Popconfirm
            title="Revoke this token?"
            description="This action cannot be undone. Any applications using this token will lose access."
            onConfirm={() => handleRevokeToken(record.id)}
            okText="Revoke"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>
              Revoke
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title="Sessions & Tokens"
      placement="right"
      width={800}
      onClose={onClose}
      open={visible}
      className="settings-drawer"
    >
      <div className="settings-content">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          
          {/* Active Sessions */}
          <Card title="Active Sessions">
            <Alert
              message="Session Management"
              description="Manage your active sessions across different devices. Revoking a session will log out that device."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={sessions}
              columns={sessionColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
            
            <div style={{ marginTop: 16, textAlign: "right" }}>
              <Popconfirm
                title="Revoke all other sessions?"
                description="This will log out all devices except your current session."
                onConfirm={handleRevokeAllOtherSessions}
                okText="Revoke All"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button danger>
                  Revoke All Other Sessions
                </Button>
              </Popconfirm>
            </div>
          </Card>

          {/* API Tokens */}
          <Card 
            title="API Tokens"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateTokenModal(true)}
              >
                Create Token
              </Button>
            }
          >
            <Alert
              message="API Token Security"
              description="API tokens provide full access to your account. Keep them secure and never share them publicly."
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              dataSource={apiTokens}
              columns={tokenColumns}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>

          {/* Security Tips */}
          <Card title="Security Tips">
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <Title level={5}>
                  <SafetyOutlined /> Regular Session Review
                </Title>
                <Text type="secondary">
                  Periodically review your active sessions and revoke any that you don't recognize.
                </Text>
              </div>
              
              <div>
                <Title level={5}>
                  <KeyOutlined /> Token Management
                </Title>
                <Text type="secondary">
                  Create tokens with minimal required permissions and revoke them when no longer needed.
                </Text>
              </div>
              
              <div>
                <Title level={5}>
                  <GlobalOutlined /> Secure Access
                </Title>
                <Text type="secondary">
                  Use secure networks and enable 2FA for additional account protection.
                </Text>
              </div>
            </Space>
          </Card>

        </Space>
      </div>

      {/* Create Token Modal */}
      <Modal
        title="Create API Token"
        open={showCreateTokenModal}
        onCancel={() => setShowCreateTokenModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateTokenModal(false)}>
            Cancel
          </Button>,
          <Button key="create" type="primary" onClick={handleCreateToken}>
            Create Token
          </Button>,
        ]}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <Text strong>Token Name</Text>
            <Input
              placeholder="e.g., Production API, Development API"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <Text strong>Permissions</Text>
            <Select
              mode="multiple"
              value={newTokenPermissions}
              onChange={setNewTokenPermissions}
              style={{ width: "100%", marginTop: 8 }}
              options={[
                { label: "Read Access", value: "read" },
                { label: "Write Access", value: "write" },
                { label: "Admin Access", value: "admin" },
              ]}
            />
          </div>
        </Space>
      </Modal>

      {/* Generated Token Modal */}
      <Modal
        title="API Token Created"
        open={showGeneratedToken}
        onCancel={() => setShowGeneratedToken(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyGeneratedToken}>
            Copy Token
          </Button>,
          <Button key="done" onClick={() => setShowGeneratedToken(false)}>
            Done
          </Button>,
        ]}
      >
        <Alert
          message="Save this token securely"
          description="This token will only be shown once. Copy it and store it in a secure location."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Input.TextArea
          value={generatedToken}
          readOnly
          rows={3}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </Modal>
    </Drawer>
  );
};

export default TokensSettingsDrawer;
