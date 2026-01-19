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

  const {
    bots,
    botsLoading
  } = useFirebaseGlobal();

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
