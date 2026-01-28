import { useState } from "react";
import { Drawer, Button, Typography, Tag, Tooltip, Row, Col, Popconfirm } from "antd";
import { 
  SafetyOutlined, 
  KeyOutlined, 
  GlobalOutlined, 
  ArrowLeftOutlined,
  DeleteOutlined,
  HistoryOutlined,
  LockOutlined,
  QuestionCircleOutlined
} from "@ant-design/icons";
import { User } from '../../services/api';
import "./styles.scss";

const { Title, Paragraph, Text } = Typography;

interface TokensSettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
}

export function TokensSettingsDrawer({ visible, onClose, user }: TokensSettingsDrawerProps) {
  const [activeTokens, setActiveTokens] = useState([
    {
      id: 'token_1',
      name: 'Web Session - Chrome',
      createdAt: '2024-01-05T10:30:00Z',
      expiresAt: '2024-01-12T10:30:00Z',
      token: 'eyJhbGciOiJIUzI1NiIIkpXVCJ9...',
      deviceId: 'DEV-CHROME-8821',
      ipAddress: '192.168.1.105',
      riskScore: 12,
      riskLevel: 'Low',
      status: 'Online',
      lastSeen: '2024-01-06T08:15:00Z'
    },
    {
      id: 'token_2', 
      name: 'Mobile App - iOS',
      createdAt: '2024-01-03T14:20:00Z',
      expiresAt: '2024-01-17T14:20:00Z',
      token: 'eyJhbGciOiJSUzfghgf6IkpXVCJ9...',
      deviceId: 'DEV-IPHONE-XR',
      ipAddress: '10.0.0.42',
      riskScore: 65,
      riskLevel: 'High',
      status: 'Idle/Away',
      lastSeen: '2024-01-05T22:45:00Z'
    }
  ]);

  const handleRevokeToken = (tokenId: string) => {
    setActiveTokens(prev => prev.filter(token => token.id !== tokenId));
    // TODO: Implement API call to revoke token
    console.log('Revoking token:', tokenId);
  };

  const handleRevokeAllTokens = () => {
    setActiveTokens([]);
    // TODO: Implement API call to revoke all tokens
    console.log('Revoking all tokens');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Drawer
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      closable={false}
      className="tokens-settings-drawer"
    >
      <div className="drawer-header">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={onClose}
          className="back-button"
        />
        <div className="header-text">
          <Title level={4} className="drawer-title">Device Sessions</Title>
          {user?.displayName && <Text type="secondary" className="drawer-subtitle">Manage device access and session tokens</Text>}
        </div>
      </div>

      <div className="drawer-content">
        {/* Active Sessions Section */}
        <section className="tokens-section">
          <div className="tokens-section-header">
            {activeTokens.length > 0 && (<>
            <div className="header-title">
              <div className="section-icon">
                <HistoryOutlined />
              </div>
              <h3>Active Sessions</h3>
            </div>
              <Popconfirm
                title="Revoke all sessions?"
                description="This will log you out from all other devices."
                onConfirm={handleRevokeAllTokens}
                okText="Yes, Revoke All"
                cancelText="No"
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              >
                <Button 
                  danger 
                  type="text"
                  icon={<DeleteOutlined />}
                  className="revoke-all-btn"
                >
                  Revoke All
                </Button>
              </Popconfirm></>
            )}
          </div>

          {activeTokens.length === 0 ? (
            <div className="security-tips-container">
              <div className="security-card premium-card">
              <div className="tip-icon"><KeyOutlined /></div>
              <div className="tip-content">
                <h5>Token Management</h5>
                <Paragraph>
                  Create tokens with minimal required permissions and revoke them immediately when they are no longer needed.
                </Paragraph>
              </div>
            </div>
            </div>
          ) : (
            <div className="tokens-grid-container">
              {activeTokens.map((token) => (
                <div key={token.id} className="token-card premium-card">
                  <div className="token-main">
                    <div className="token-title-wrapper">
                      <span className="token-name">{token.name}</span>
                    </div>
                    <Popconfirm
                      title="Revoke this session?"
                      description="Access from this device will be immediately terminated."
                      onConfirm={() => handleRevokeToken(token.id)}
                      okText="Revoke"
                      cancelText="Cancel"
                      icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    >
                      <Tooltip title="Revoke access">
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          className="revoke-btn"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>

                  <div className="token-details-grid">
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div className="token-info-box">
                          <label>Device ID</label>
                          <code>{token.deviceId}</code>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div className="token-info-box">
                          <label>Token</label>
                          <code>{token.token.substr(0, 48)}</code>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="token-info-box">
                          <label>Last Seen</label>
                          <span>{formatDate(token.lastSeen)}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="token-info-box">
                          <label>IP Address</label>
                          <span>{token.ipAddress}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="token-info-box">
                          <label>Created</label>
                          <span>{formatDate(token.createdAt)}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="token-info-box">
                          <label>Expires</label>
                          <span>{formatDate(token.expiresAt)}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="token-info-box">
                          <label>Status</label>
                          <Tag className={`status-badge ${token.status.toLowerCase().replace('/', '-')}`}>
                            <span className="status-emoji">
                              {token.status === 'Online' ? '🟢' : 
                               (token.status === 'Idle' || token.status === 'Idle/Away') ? '🟠' : 
                               token.status === 'Offline' ? '⚪' : '🚫'}
                            </span>
                            <span className="status-text">
                              {token.status}
                            </span>
                          </Tag>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="token-info-box">
                          <label>Risk Score</label>
                          <Tag className={`risk-score-badge ${token.riskLevel.toLowerCase()}`}>
                            <span className="risk-emoji">
                              {token.riskLevel === 'High' ? '🔴' : token.riskLevel === 'Medium' ? '🟡' : '🟢'}
                            </span>
                            <span className="risk-text">
                              {token.riskLevel} : {token.riskScore}
                            </span>
                          </Tag>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Security Tips Section */}
        <section className="tokens-section">
          <div className="tokens-section-header">
            <div className="header-title">
              <div className="section-icon">
                <LockOutlined />
              </div>
              <h3>Security Best Practices</h3>
            </div>
          </div>

          <div className="security-tips-container">
            <div className="security-card premium-card">
              <div className="tip-icon"><SafetyOutlined /></div>
              <div className="tip-content">
                <h5>Regular Session Review</h5>
                <Paragraph>
                  Periodically review your active sessions and revoke any that you don't recognize to maintain account integrity.
                </Paragraph>
              </div>
            </div>

            <div className="security-card premium-card">
              <div className="tip-icon"><KeyOutlined /></div>
              <div className="tip-content">
                <h5>Token Management</h5>
                <Paragraph>
                  Create tokens with minimal required permissions and revoke them immediately when they are no longer needed.
                </Paragraph>
              </div>
            </div>

            <div className="security-card premium-card">
              <div className="tip-icon"><GlobalOutlined /></div>
              <div className="tip-content">
                <h5>Secure Access</h5>
                <Paragraph>
                  Always use trusted networks and ensure your account has two-factor authentication enabled for maximum protection.
                </Paragraph>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
