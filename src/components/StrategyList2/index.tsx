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
  Avatar,
  Input,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  MoreOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { BotInstance } from '../../types/bot';
import { botAPI } from '../../services/api';
import './styles.scss';

const { Title, Text } = Typography;

// Mock data for demonstration
const mockBots: BotInstance[] = [
  {
    _id: '1',
    userId: 'user1',
    configuration: {
      general: { botName: 'Alpha Trader', tradeType: 'Rise', market: 'Volatility 100 (1s) Index' },
      basicSettings: { number_of_trades: 50, maximum_stake: 1000, compound_stake: true },
      amounts: {
        amount: { type: 'fixed', value: 10 },
        profit_threshold: { type: 'fixed', value: 100 },
        loss_threshold: { type: 'fixed', value: 50 }
      },
      recovery: { risk_steps: [] },
      schedules: { bot_schedules: [] },
      execution: { recovery_type: 'on', cooldown_period: '300', stop_on_loss_streak: false, auto_restart: true }
    },
    status: 'running',
    sessionId: 'session1',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
    lastRunAt: '2024-01-10T10:00:00Z',
    totalProfit: 1250.50,
    totalLoss: 320.25,
    totalTrades: 45,
    runningTime: 3600
  },
  {
    _id: '2',
    userId: 'user1',
    configuration: {
      general: { botName: 'Beta Scalper', tradeType: 'Fall', market: 'Volatility 75 (1s) Index' },
      basicSettings: { number_of_trades: 30, maximum_stake: 500, compound_stake: false },
      amounts: {
        amount: { type: 'fixed', value: 5 },
        profit_threshold: { type: 'fixed', value: 50 },
        loss_threshold: { type: 'fixed', value: 25 }
      },
      recovery: { risk_steps: [] },
      schedules: { bot_schedules: [] },
      execution: { recovery_type: 'off', cooldown_period: '0', stop_on_loss_streak: false, auto_restart: false }
    },
    status: 'paused',
    createdAt: '2024-01-09T15:30:00Z',
    updatedAt: '2024-01-09T15:30:00Z',
    lastRunAt: '2024-01-09T15:30:00Z',
    totalProfit: 450.75,
    totalLoss: 180.50,
    totalTrades: 28,
    runningTime: 1800
  },
  {
    _id: '3',
    userId: 'user1',
    configuration: {
      general: { botName: 'Gamma Runner', tradeType: 'Rise', market: 'Boom 1000 Index' },
      basicSettings: { number_of_trades: 100, maximum_stake: 2000, compound_stake: true },
      amounts: {
        amount: { type: 'fixed', value: 25 },
        profit_threshold: { type: 'fixed', value: 200 },
        loss_threshold: { type: 'fixed', value: 100 }
      },
      recovery: { risk_steps: [] },
      schedules: { bot_schedules: [] },
      execution: { recovery_type: 'on', cooldown_period: '600', stop_on_loss_streak: true, auto_restart: true }
    },
    status: 'stopped',
    createdAt: '2024-01-08T12:00:00Z',
    updatedAt: '2024-01-08T12:00:00Z',
    lastRunAt: '2024-01-08T12:00:00Z',
    totalProfit: 890.00,
    totalLoss: 445.00,
    totalTrades: 67,
    runningTime: 0
  }
];

export function StrategyList2() {
  const [bots, setBots] = useState<BotInstance[]>(mockBots);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);

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
    bot.configuration.general.botName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.configuration.general.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bot.configuration.general.tradeType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format running time to HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate net profit
  const getNetProfit = (bot: BotInstance): number => {
    return bot.totalProfit - bot.totalLoss;
  };

  // Calculate win rate
  const getWinRate = (bot: BotInstance): number => {
    if (bot.totalTrades === 0) return 0;
    return Math.round((bot.totalProfit / (bot.totalProfit + bot.totalLoss || 1)) * 100);
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running':
        return { color: '#52c41a', label: 'Running', icon: <PlayCircleOutlined /> };
      case 'paused':
        return { color: '#faad14', label: 'Paused', icon: <PauseCircleOutlined /> };
      case 'stopped':
        return { color: '#ff4d4f', label: 'Stopped', icon: <StopOutlined /> };
      default:
        return { color: '#8c8c8c', label: 'Idle', icon: <StopOutlined /> };
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
        // Update local state
        setBots(prev => prev.map(bot => 
          bot._id === botId ? { ...bot, status: action === 'start' ? 'running' : action === 'pause' ? 'paused' : 'stopped' } : bot
        ));
      } else {
        message.error(response.error || `Failed to ${action} bot`);
      }
    } catch (error) {
      message.error(`Failed to ${action} bot`);
    }
  };

  return (
    <div className="strategy-list2-container">
      {/* Fixed Search Header */}
      <div className={`strategy-list2-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Flex align="center" justify="space-between">
            <h1 style={{fontSize: 32}}>Strategies <Badge count={bots.length} /></h1>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                className="create-btn"
              >
                Create Strategy
              </Button>
            </Space>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Input
              placeholder="Search strategies by name, market, or trade type..."
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
      <div className="strategy-list2-main-content">
        {/* Strategy List */}
        <div className="strategy-list2-list">
          <Row gutter={[16, 16]}>
            {filteredBots.map((bot) => {
            const statusConfig = getStatusConfig(bot.status);
            const netProfit = getNetProfit(bot);
            const winRate = getWinRate(bot);
            const isProfit = netProfit >= 0;

            return (
              <Col xs={24} sm={24} md={12} lg={12} xl={12} key={bot._id}>
                <Card 
                  className={`strategy-card ${bot.status === 'running' ? 'running' : ''}`}
                  hoverable
                  size="small"
                >
                  {/* Card Header */}
                  <div className="strategy-card-header">
                    
                      <div className="strategy-info"><Flex justify="space-between" align="start">
                        <Title level={5} className="strategy-name" style={{ margin: 0 }}>
                          {bot.configuration.general.botName}
                        </Title>
                      <Tag  
                        color={statusConfig.color}
                        className="status-tag"
                      >
                        {statusConfig.icon} {statusConfig.label}
                      </Tag></Flex>
                        <Text type="secondary" className="strategy-market">
                          {bot.configuration.general.market} • {bot.configuration.general.tradeType} • {bot.configuration.general.strategy || 'Default Strategy'}
                        </Text>
                      </div>
                    
                  </div>

                  {/* Strategy Stats */}
                  <div className="strategy-stats">
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
                              <div className="stat-value">{bot.configuration.amounts.amount.value}</div>
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
                  <div className="strategy-controls">
                    <div className="control-buttons">
                      <Button
                        className="control-btn audit-btn"
                        onClick={() => handleAuditBot(bot._id)}
                      >
                        <FileSearchOutlined /> Audit
                      </Button>
                      <Tooltip title={bot.status === 'running' ? 'Strategy is running' : 'Start Strategy'}>
                        <Button
                          className={`control-btn start-btn ${bot.status === 'running' ? 'current-state' : ''}`}
                          onClick={() => handleBotAction(bot._id, 'start')}
                          disabled={bot.status === 'running'}
                        >
                          <PlayCircleOutlined style={{fontSize: 18}} />
                        </Button>
                      </Tooltip>
                      <Tooltip title={bot.status !== 'running' ? 'Strategy is not running' : 'Pause Strategy'}>
                        <Button
                          className={`control-btn pause-btn ${bot.status === 'paused' ? 'current-state' : ''}`}
                          onClick={() => handleBotAction(bot._id, 'pause')}
                          disabled={bot.status !== 'running'}
                        >
                          <PauseCircleOutlined style={{fontSize: 18}} />
                        </Button>
                      </Tooltip>
                      <Tooltip title={bot.status === 'stopped' ? 'Strategy is already stopped' : 'Stop Strategy'}>
                        <Button
                          className={`control-btn stop-btn ${bot.status === 'stopped' ? 'current-state' : ''}`}
                          onClick={() => handleBotAction(bot._id, 'stop')}
                          disabled={bot.status === 'stopped'}
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
      {filteredBots.length === 0 && !loading && (
        <div className="empty-state">
          <Empty
            description={
              <span className="empty-text">
                {searchQuery ? 'No strategies found matching your search.' : 'No strategies yet. Create your first trading strategy!'}
              </span>
            }
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            className="create-first-btn"
          >
            Create Your First Strategy
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <Spin size="large" />
          <Text type="secondary">Loading your strategies...</Text>
        </div>
      )}
      </div>
    </div>
  );
}
