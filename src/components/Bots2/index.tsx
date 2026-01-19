import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Flex,
  Empty,
  Spin,
  Tooltip,
  Badge,
  Input,
  message,
  Divider,
  List,
  Descriptions
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  FileSearchOutlined,
  MobileOutlined,
  DesktopOutlined,
  GlobalOutlined,
  BellOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useFirebaseGlobal } from '../../contexts/FirebaseGlobalContext';
import { botAPI } from '../../services/api';
import './styles.scss';
import botIcon from '../../assets/bot.png';
const { Title, Text } = Typography;

export function Bots2() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const {
    bots,
    botsLoading
  } = useFirebaseGlobal();

  // Browser detection
  const getBrowserInfo = (ua: string) => {
    const browsers = {
      chrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
      firefox: /Firefox/.test(ua),
      safari: /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor),
      edge: /Edg/.test(ua),
      ie: /MSIE|Trident/.test(ua),
      opera: /Opera|OPR/.test(ua)
    };
    
    const browserName = Object.keys(browsers).find(key => browsers[key as keyof typeof browsers]) || 'Unknown';
    const version = ua.match(new RegExp(`${browserName}/([0-9.]+)`))?.[1] || 'Unknown';
    
    return { name: browserName, version };
  };

  // OS detection
  const getOSInfo = (ua: string) => {
    const os = {
      Windows: /Windows/.test(ua),
      macOS: /Mac OS/.test(ua),
      Linux: /Linux/.test(ua),
      iOS: /iPhone|iPad|iPod/.test(ua),
      Android: /Android/.test(ua)
    };
    
    const osName = Object.keys(os).find(key => os[key as keyof typeof os]) || 'Unknown';
    const version = ua.match(new RegExp(`${osName} ([0-9_.]+)`))?.[1]?.replace(/_/g, '.') || 'Unknown';
    
    return { name: osName, version };
  };

  // Device type detection
  const getDeviceInfo = (ua: string) => {
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua);
    const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
    const isDesktop = !isMobile && !isTablet;
    
    let vendor = 'Unknown';
    let model = 'Unknown';
    
    if (/iPhone/.test(ua)) {
      vendor = 'Apple';
      model = 'iPhone';
    } else if (/iPad/.test(ua)) {
      vendor = 'Apple';
      model = 'iPad';
    } else if (/Android/.test(ua)) {
      vendor = 'Various';
      const match = ua.match(/Android.*?;\s*([^)]*)\)/);
      model = match?.[1] || 'Android Device';
    } else if (/Windows/.test(ua)) {
      vendor = 'Microsoft';
      model = 'Windows PC';
    }
    
    return {
      type: isTablet ? 'Tablet' : isMobile ? 'Mobile' : isDesktop ? 'Desktop' : 'Unknown',
      vendor,
      model
    };
  };

  // Network connection info
  const getConnectionInfo = () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType || 'Unknown',
        downlink: connection.downlink || 'Unknown',
        rtt: connection.rtt || 'Unknown'
      };
    }
    return { effectiveType: 'Unknown', downlink: 'Unknown', rtt: 'Unknown' };
  };

  // Device detection using user agent parsing
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const deviceData = {
      userAgent: userAgent,
      browser: getBrowserInfo(userAgent),
      os: getOSInfo(userAgent),
      device: getDeviceInfo(userAgent),
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      hardware: {
        cores: navigator.hardwareConcurrency || 'Unknown',
        memory: navigator.deviceMemory || 'Unknown',
        connection: getConnectionInfo()
      },
      timezone: {
        offset: new Date().getTimezoneOffset(),
        name: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    setDeviceInfo(deviceData);
    console.log("DEVICE INFO", deviceData);
  }, []);

  useEffect(() => {
    console.log("MY BOTS", bots);
  }, [bots]);

  // Handle scroll events for header positioning
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 57) {
        setIsHeaderFixed(true);
      } else {
        setIsHeaderFixed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter bots based on search query
  const filteredBots = bots.filter(bot => 
    bot.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.strategyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.contractType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format running time to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate net profit
  const getNetProfit = (bot: any): number => {
    return bot.netProfit || 0;
  };

  // Calculate win rate
  const getWinRate = (bot: any): number => {
    if (bot.totalTrades === 0) return 0;
    return Math.round((bot.numberOfWins / bot.totalTrades) * 100);
  };

  // Get status configuration
  const getStatusConfig = (state: string) => {
    switch (state) {
      case 'PLAY':
        return { color: '#52c41a', label: 'Running', icon: <PlayCircleOutlined /> };
      case 'PAUSE':
        return { color: '#faad14', label: 'Paused', icon: <PauseCircleOutlined /> };
      case 'STOP':
        return { color: '#ff4d4f', label: 'Stopped', icon: <StopOutlined /> };
      default:
        return { color: '#d9d9d9', label: 'Unknown', icon: <ClockCircleOutlined /> };
    }
  };

  // Handle bot audit action
  const handleAuditBot = (botId: string) => {
    message.info(`Auditing bot ${botId}`);
    // TODO: Implement audit functionality
  };

  // Handle bot control actions
  const handleBotAction = async (botId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      let response;
      switch (action) {
        case 'start':
          response = await botAPI.startBot(botId);
          break;
        case 'pause':
          response = await botAPI.pauseBot(botId);
          break;
        case 'stop':
          response = await botAPI.stopBot(botId);
          break;
      }

      if (response.success) {
        message.success(`Bot ${action}ed successfully`);
      } else {
        message.error(response.error || `Failed to ${action} bot`);
      }
    } catch (error: any) {
      message.error(`Failed to ${action} bot: ${error?.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="bots2-container">
      {/* Fixed Search Header */}
      <div className={`bots2-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Flex align="center" justify="space-between">
            <h1 style={{fontSize: 32}}>Bots <Badge count={bots.length} /></h1>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                className="create-btn"
              >
                Create Bot
              </Button>
            </Space>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Input
              placeholder="Search bots by name, market, or trade type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<TrophyOutlined />}
              className="search-input"
              allowClear
            />
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="bots2-main-content">
        {/* Bot List */}
        <div className="bots2-list">
          <Row gutter={[16, 16]}>
            {filteredBots.map((bot) => {
            const statusConfig = getStatusConfig(bot.state);
            const netProfit = getNetProfit(bot);
            const winRate = getWinRate(bot);
            const isProfit = netProfit >= 0;

            return (
              <Col xs={24} sm={24} md={12} lg={12} xl={12} key={bot.id}>
                <Card 
                  className={`bot-card ${bot.state === 'PLAY' ? 'running' : ''}`}
                  hoverable
                  size="small"
                >
                  {/* Card Header */}
                  <div className="bot-card-header">
                    
                      <div className="bot-info"><Flex justify="space-between" align="start">
                        <Title level={5} className="bot-name" style={{ margin: 0 }}>
                          {bot.botName}
                        </Title>
                      <Tag  
                        color={statusConfig.color}
                        className="status-tag"
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </Tag></Flex>
                        <Text type="secondary" className="bot-market">
                          {bot.marketName} • {bot.contractType} • {bot.strategyName || 'Default Strategy'}
                        </Text>
                      </div>
                    
                  </div>

                  {/* Bot Stats */}
                  <div className="bot-stats">
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <div className="stat-item">
                          <Flex align="center" gap={6}>
                            <ClockCircleOutlined className="stat-icon" />
                            <div>
                              <Text type="secondary" className="stat-label">Runtime</Text>
                              <div className="stat-value">{formatTime(bot.runningTime)}</div>
                            </div>
                          </Flex>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="stat-item">
                          <Flex align="center" gap={6}>
                            <DollarOutlined className="stat-icon" />
                            <div>
                              <Text type="secondary" className="stat-label">Net Profit</Text>
                              <div className={`stat-value ${isProfit ? 'profit' : 'loss'}`}>
                                {isProfit ? '+' : ''}{netProfit.toFixed(2)}
                              </div>
                            </div>
                          </Flex>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="stat-item">
                          <Flex align="center" gap={6}>
                            <ThunderboltOutlined className="stat-icon" />
                            <div>
                              <Text type="secondary" className="stat-label">Base Stake</Text>
                              <div className="stat-value">{bot.baseStake}</div>
                            </div>
                          </Flex>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="stat-item">
                          <Flex align="center" gap={6}>
                            <TrophyOutlined className="stat-icon" />
                            <div>
                              <Text type="secondary" className="stat-label">Win Rate</Text>
                              <div className="stat-value">{winRate}%</div>
                            </div>
                          </Flex>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Controls */}
                  <div className="bot-controls">
                    <div className="control-buttons">
                      <Button
                        className="control-btn audit-btn"
                        onClick={() => handleAuditBot(bot.id)}
                      >
                        <FileSearchOutlined /> Audit
                      </Button>
                      <Tooltip title={bot.state === 'PLAY' ? 'Bot is running' : 'Start Bot'}>
                        <Button
                          className={`control-btn start-btn ${bot.state === 'PLAY' ? 'current-state' : ''}`}
                          onClick={() => handleBotAction(bot.id, 'start')}
                          disabled={bot.state === 'PLAY'}
                        >
                          <PlayCircleOutlined style={{fontSize: 18}} />
                        </Button>
                      </Tooltip>
                      <Tooltip title={bot.state !== 'PLAY' ? 'Bot is not running' : 'Pause Bot'}>
                        <Button
                          className={`control-btn pause-btn ${bot.state === 'PAUSE' ? 'current-state' : ''}`}
                          onClick={() => handleBotAction(bot.id, 'pause')}
                          disabled={bot.state !== 'PLAY'}
                        >
                          <PauseCircleOutlined style={{fontSize: 18}} />
                        </Button>
                      </Tooltip>
                      <Tooltip title={bot.state === 'STOP' ? 'Bot is already stopped' : 'Stop Bot'}>
                        <Button
                          className={`control-btn stop-btn ${bot.state === 'STOP' ? 'current-state' : ''}`}
                          onClick={() => handleBotAction(bot.id, 'stop')}
                          disabled={bot.state === 'STOP'}
                        >
                          <StopOutlined style={{fontSize: 18}} />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Firebase Messaging Card */}
      <div className="firebase-messaging-section" style={{ marginTop: 32 }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          <BellOutlined /> Firebase Messaging & Device Details
        </Title>
        <Card className="firebase-messaging-card" bordered={false}>
          {deviceInfo ? (
            <div>
              <Descriptions title="Device Information" bordered column={2} size="small">
                <Descriptions.Item label="Device Type">
                  <Space>
                    {deviceInfo.device.type === 'Mobile' && <MobileOutlined />}
                    {deviceInfo.device.type === 'Desktop' && <DesktopOutlined />}
                    {deviceInfo.device.type === 'Tablet' && <MobileOutlined />}
                    {deviceInfo.device.type}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Device Vendor">
                  {deviceInfo.device.vendor}
                </Descriptions.Item>
                <Descriptions.Item label="Device Model">
                  {deviceInfo.device.model}
                </Descriptions.Item>
                <Descriptions.Item label="Platform">
                  {deviceInfo.platform}
                </Descriptions.Item>
                <Descriptions.Item label="Browser">
                  <Space>
                    <GlobalOutlined />
                    {deviceInfo.browser.name} v{deviceInfo.browser.version}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Operating System">
                  {deviceInfo.os.name} v{deviceInfo.os.version}
                </Descriptions.Item>
                <Descriptions.Item label="Language">
                  {deviceInfo.language}
                </Descriptions.Item>
                <Descriptions.Item label="Timezone">
                  {deviceInfo.timezone.name} (UTC{deviceInfo.timezone.offset > 0 ? '+' : ''}{-deviceInfo.timezone.offset / 60})
                </Descriptions.Item>
                <Descriptions.Item label="Screen Resolution">
                  {deviceInfo.screen.width} × {deviceInfo.screen.height}
                </Descriptions.Item>
                <Descriptions.Item label="Viewport Size">
                  {deviceInfo.viewport.width} × {deviceInfo.viewport.height}
                </Descriptions.Item>
                <Descriptions.Item label="CPU Cores">
                  {deviceInfo.hardware.cores}
                </Descriptions.Item>
                <Descriptions.Item label="Device Memory">
                  {deviceInfo.hardware.memory !== 'Unknown' ? `${deviceInfo.hardware.memory} GB` : 'Unknown'}
                </Descriptions.Item>
                <Descriptions.Item label="Connection Type">
                  {deviceInfo.hardware.connection.effectiveType}
                </Descriptions.Item>
                <Descriptions.Item label="Connection Speed">
                  {deviceInfo.hardware.connection.downlink !== 'Unknown' ? `${deviceInfo.hardware.connection.downlink} Mbps` : 'Unknown'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div style={{ marginBottom: 16 }}>
                <Title level={5}>
                  <SettingOutlined /> Firebase Messaging Configuration
                </Title>
                <Space wrap>
                  <Tag color="blue">VAPID Keys Configured</Tag>
                  <Tag color="green">Push Notifications Ready</Tag>
                  <Tag color="orange">Service Worker Active</Tag>
                </Space>
              </div>

              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">User Agent String:</Text>
                <div style={{ 
                  background: '#f5f5f5', 
                  padding: 8, 
                  borderRadius: 4, 
                  fontSize: 12, 
                  wordBreak: 'break-all',
                  marginTop: 4,
                  maxHeight: 100,
                  overflow: 'auto'
                }}>
                  {deviceInfo.userAgent}
                </div>
              </div>

              <Space>
                <Button type="primary" icon={<BellOutlined />} size="small">
                  Test Push Notification
                </Button>
                <Button icon={<SettingOutlined />} size="small">
                  Configure Firebase
                </Button>
                <Button size="small" onClick={() => console.log('Full device info:', deviceInfo)}>
                  Log Device Info
                </Button>
              </Space>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">Loading device information...</Text>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Empty State */}
      {filteredBots.length === 0 && !botsLoading && (
        <div className="empty-state">
            <img src={botIcon} width="200" />
          <Text style={{fontSize: 18, margin: 24, textAlign: 'center'}}>{searchQuery ? 'No bots found matching your search.' : 'No bots yet. Create your first trading bot!'}</Text>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            className="create-first-btn"
          >
            Create Your First Bot
          </Button>
        </div>
      )}

      {/* Loading State */}
      {botsLoading && (
        <div className="loading-state">
          <Spin size="large" />
          <Text type="secondary">Loading your bots...</Text>
        </div>
      )}
      </div>
    </div>
  );
}
