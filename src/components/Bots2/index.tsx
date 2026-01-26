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
  Descriptions,
  FloatButton
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
  SettingOutlined,
  ArrowsAltOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useFirebaseGlobal } from '../../contexts/FirebaseGlobalContext';
import { botAPI } from '../../services/api';
import './styles.scss';
import botIcon from '../../assets/bot.png';
import { BottomActionSheet } from '../BottomActionSheet/index';
import { LegacyOpenLink2pxIcon } from '@deriv/quill-icons';
import { Avatar } from 'antd';
import { useLocalStorage } from '../../utils/use-local-storage';
import { EventManagerDemo } from '../EventManagerDemo';
const { Title, Text } = Typography;


// Help Center Component
const StrategiesList = ({strategies, onSelectedStrategy,}:any) => {
  
  const handleStrategySelected = (strategy: any) => {
    onSelectedStrategy(strategy)
  }

  return (
    <div className="settings__action-sheet">
      <div className="settings__action-sheet-header">
        <h3>Select Strategy</h3>
      </div>
      <div className="settings__action-sheet-list" style={{maxHeight: "75vh", overflow: "scroll"}}>
        {strategies.map((strategy:any, strategyIndex:number) => (
          <div
            key={strategyIndex}
            className="settings__action-sheet-list-item"
            onClick={() => handleStrategySelected(strategy)}
          >
            <span className="settings__action-sheet-list-item-label">
              <Flex align="center" justify="space-between" style={{width: "100%"}}>
              <Avatar src={strategy.coverPhoto} style={{width: 38, height: 38, marginRight: 18}} />
              <Space vertical size={0} style={{width: "100%"}}>
                <span>{strategy.configuration.general.botName}</span>
                <small style={{opacity: 0.4}}>{strategy.description.substr(0, 48)}...</small>
              </Space>
              </Flex>
            </span>
            <div className="settings__action-sheet-list-item-right">
              <LegacyOpenLink2pxIcon
                className="settings__menu-arrow"
                iconSize="xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const strategyList: any[] = [
  {
    _id: '1',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Classic Martingale',
        tradeType: 'Progressive Betting',
        market: 'Forex'
      }
    },
    tags: ['Risk Management', 'Position Sizing', 'Recovery System', 'Martingale', 'Forex', 'Progressive Betting'],
    description: 'A sophisticated capital progression system doubling positions after losses, engineered for mean reversion markets. This algorithmic "roulette strategy" transformed into quantitative forex execution - managing drawdowns through exponential recovery mechanics while maintaining risk of ruin calculations.',
    author: {
      photoURL: 'https://example.com/photos/trader1.jpg',
      displayName: 'Alexandre FinTech',
      date: '2024-01-01'
    },
    coverPhoto: '/strategies/martingale-banner.jpg'
  },
  {
    _id: '2',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Martingale Reset',
        tradeType: 'Progressive Betting',
        market: 'Forex'
      }
    },
    tags: ['Risk Reset', 'Drawdown Control', 'Martingale', 'Capital Preservation', 'Forex', 'Sequence Management'],
    description: 'Evolutionary martingale variant with intelligent reset protocols. Deploys strategic position resets after predefined profit targets, mitigating exponential risk exposure. Balances aggressive capital recovery with prudent stop-loss architecture in currency pair volatility.',
    author: {
      photoURL: 'https://example.com/photos/trader2.jpg',
      displayName: 'Sofia Quant',
      date: '2024-01-01'
    },
    coverPhoto: '/strategies/martingale-reset-banner.jpg'
  },
  {
    _id: '3',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'D\'Alembert System',
        tradeType: 'Progressive Betting',
        market: 'Crypto'
      }
    },
    tags: ['Linear Progression', 'Conservative Martingale', 'Cryptocurrency', 'Risk-Adjusted', 'Mathematical Trading'],
    description: 'Arithmetic progression system increasing/decreasing positions by single units - the "gentleman\'s martingale." Applies equilibrium theory to cryptocurrency volatility, offering smoother equity curves than exponential counterparts with disciplined risk management.',
    author: {
      photoURL: 'https://example.com/photos/trader3.jpg',
      displayName: 'Jean d\'Alembert Jr.',
      date: '2024-01-02'
    },
    coverPhoto: '/strategies/dalembert-banner.jpg'
  },
  {
    _id: '4',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'D\'Alembert Reset',
        tradeType: 'Progressive Betting',
        market: 'Crypto'
      }
    },
    tags: ['Hybrid System', 'Crypto Trading', 'Risk Modulation', 'Linear Progression', 'Reset Mechanics'],
    description: 'Synthesizes D\'Alembert\'s linear progression with intelligent reset triggers for cryptocurrency markets. Creates stair-step recovery patterns during bearish phases while preserving capital during extended downtrends through algorithmic position normalization.',
    author: {
      photoURL: 'https://example.com/photos/trader4.jpg',
      displayName: 'Crypto Strategist',
      date: '2024-01-03'
    },
    coverPhoto: '/strategies/dalembert-reset-banner.jpg'
  },
  {
    _id: '5',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Reverse Martingale',
        tradeType: 'Anti-Martingale',
        market: 'Stocks'
      }
    },
    tags: ['Paroli System', 'Positive Progression', 'Trend Following', 'Stocks', 'Momentum Capture'],
    description: 'The "Paroli" positive progression system - doubling winners while keeping losses constant. Exploits equity momentum through compound growth during trending markets, designed for stock portfolio enhancement with asymmetric upside potential.',
    author: {
      photoURL: 'https://example.com/photos/trader5.jpg',
      displayName: 'Momentum Master',
      date: '2024-01-04'
    },
    coverPhoto: '/strategies/reverse-martingale-banner.jpg'
  },
  {
    _id: '6',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Reverse Martingale Reset',
        tradeType: 'Anti-Martingale',
        market: 'Stocks'
      }
    },
    tags: ['Profit Taking', 'Anti-Martingale', 'Equity Management', 'Stock Trading', 'Sequence Optimization'],
    description: 'Intelligent anti-martingale implementation with systematic profit reseeding. Captures extended winning streaks in equities while automatically banking profits at predetermined thresholds - maximizing compound growth while avoiding mean reversion traps.',
    author: {
      photoURL: 'https://example.com/photos/trader6.jpg',
      displayName: 'Equity Architect',
      date: '2024-01-05'
    },
    coverPhoto: '/strategies/reverse-martingale-reset-banner.jpg'
  },
  {
    _id: '7',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Reverse D\'Alembert',
        tradeType: 'Anti-D\'Alembert',
        market: 'Gold'
      }
    },
    tags: ['Gold Trading', 'Conservative Anti-Martingale', 'Safe Haven', 'Linear Positive Progression'],
    description: 'Linear positive progression tailored for gold\'s safe-haven characteristics. Gradually increases positions during winning streaks while decreasing during losses - capturing precious metal trends with reduced volatility exposure versus traditional martingale systems.',
    author: {
      photoURL: 'https://example.com/photos/trader7.jpg',
      displayName: 'Gold Algorithmist',
      date: '2024-01-06'
    },
    coverPhoto: '/strategies/reverse-dalembert-banner.jpg'
  },
  {
    _id: '8',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Reverse D\'Alembert Reset',
        tradeType: 'Anti-D\'Alembert',
        market: 'Gold'
      }
    },
    tags: ['Precious Metals', 'Risk-Adjusted Growth', 'Gold XAU', 'Systematic Resets', 'Defensive Trading'],
    description: 'Defensive gold trading system combining linear positive progression with capital protection resets. Designed for precious metal accumulation during bullish phases while preserving gains during geopolitical uncertainty through algorithmic position management.',
    author: {
      photoURL: 'https://example.com/photos/trader8.jpg',
      displayName: 'Bullion Bot',
      date: '2024-01-07'
    },
    coverPhoto: '/strategies/reverse-dalembert-reset-banner.jpg'
  },
  {
    _id: '9',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Options Martingale',
        tradeType: 'Options Trading',
        market: 'Options'
      }
    },
    tags: ['Options Strategies', 'Volatility Trading', 'Gamma Scalping', 'Derivatives', 'Premium Collection'],
    description: 'Martingale mathematics adapted for options premium markets. Manages option selling positions through strategic lot increases after losses, leveraging theta decay while controlling for volatility spikes and gap risk in derivatives portfolios.',
    author: {
      photoURL: 'https://example.com/photos/trader9.jpg',
      displayName: 'Options Algo',
      date: '2024-01-08'
    },
    coverPhoto: '/strategies/options-martingale-banner.jpg'
  },
  {
    _id: '10',
    userId: 'user1',
    configuration: {
      general: {
        botName: 'Oscar\'s Grind',
        tradeType: 'Conservative Progression',
        market: 'Forex'
      }
    },
    tags: ['Grind System', 'Low Risk', 'Forex Scalping', 'Conservative', 'Bankroll Management'],
    description: 'The patient "grind" - small consistent profits with minimal drawdown exposure. Designed for forex scalpers seeking steady accumulation through 1-unit progression systems, prioritizing capital preservation over explosive growth in currency markets.',
    author: {
      photoURL: 'https://example.com/photos/trader10.jpg',
      displayName: 'Forex Grinder',
      date: '2024-01-09'
    },
    coverPhoto: '/strategies/oscars-grind-banner.jpg'
  },
  {
    _id: '11',
    userId: 'user1',
    configuration: {
      general: {
        botName: '1-3-2-6 System',
        tradeType: 'Fixed Sequence',
        market: 'Crypto'
      }
    },
    tags: ['Fibonacci Sequence', 'Fixed Progression', 'Cryptocurrency', 'Pattern Trading', 'Disciplined Execution'],
    description: 'Fibonacci-inspired fixed sequence progression for cryptocurrency volatility. Executes predetermined position size patterns (1-3-2-6 units) regardless of market outcome, creating mathematical edge through disciplined mechanical execution in digital asset markets.',
    author: {
      photoURL: 'https://example.com/photos/trader11.jpg',
      displayName: 'Crypto Sequence',
      date: '2024-01-10'
    },
    coverPhoto: '/strategies/1326-system-banner.jpg'
  }
];


export function Bots2() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const [botsLoading, setBotsLoading] = useState(false);

  const [bots, setBots] = useLocalStorage('my_bots', {
    defaultValue: []
  });

  const reloadBots = async () => {

    setBotsLoading(true);

    setTimeout(()=>{
      setBots([]);
      setBotsLoading(false);
    },5000)

  }

  const closeActionSheet = () => {

    setIsActionSheetOpen(false);

  }

  const onSelectedStrategyHandler = (strategy: any) => {
    setSelectedStrategy(strategy);
    closeActionSheet();
    console.log({strategy})
  }

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
            <Space size={16}>
              <Button
                size="large"
                type="text" 
                icon={<PlusOutlined style={{fontSize: 24}} />} 
                onClick={()=>setIsActionSheetOpen(true)} />
              <Button
                size="large"
                type="text" 
                icon={<SyncOutlined style={{fontSize: 24}} />} 
                onClick={()=>reloadBots()} />
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
            onClick={()=>setIsActionSheetOpen(true)} 
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

            {/* Bottom Action Sheet */}
            <BottomActionSheet
              isOpen={isActionSheetOpen}
              onClose={closeActionSheet}
              height="auto"
            >
              <StrategiesList strategies={strategyList} onSelectedStrategy={onSelectedStrategyHandler} />
            </BottomActionSheet>
      
    </div>
  );
}
