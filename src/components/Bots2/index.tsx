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
  Spin,
  Tooltip,
  Badge,
  Input,
  message,
  Avatar
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
  SyncOutlined,
  TrophyOutlined as SearchIcon
} from '@ant-design/icons';
import { botAPI } from '../../services/api';
import './styles.scss';
import botIcon from '../../assets/bot.png';
import { BottomActionSheet } from '../BottomActionSheet/index';
import { LegacyOpenLink2pxIcon } from '@deriv/quill-icons';
import { useLocalStorage } from '../../utils/use-local-storage';
import { StrategyDrawer } from '../StrategyDrawer/index';
import { useEventPublisher } from '../../hooks/useEventManager';

const { Title, Text } = Typography;

interface StrategyAuthor {
  photoURL: string;
  displayName: string;
  date: string;
}

interface StrategyItem {
  _id: string;
  userId: string;
  configuration: {
    general: {
      botName: string;
      tradeType: string;
      market: string;
    };
  };
  tags: string[];
  description: string;
  author: StrategyAuthor;
  coverPhoto: string;
}

interface BotParam {
  key: string;
  label: string;
  value: number;
}

interface Bot {
  id: string;
  botName: string;
  botDescription: string;
  marketName: string;
  contractType: string;
  strategyName: string;
  startedAt: Date;
  netProfit: number;
  baseStake: number;
  numberOfWins: number;
  numberOfLosses: number;
  state: 'PLAY' | 'PAUSE' | 'STOP';
  botMetadata: {
    version: string;
    algorithm: string;
    riskLevel: string;
  };
  isActive: boolean;
  totalTrades: number;
  winRate: number;
  averageProfit: number;
  maxDrawdown: number;
  lastRunAt: Date;
  runningTime?: number;
  settings: {
    maxConcurrentTrades: number;
    stopLoss: number;
    takeProfit: number;
    riskPerTrade: number;
  };
  performance: {
    dailyProfit: number;
    weeklyProfit: number;
    monthlyProfit: number;
    allTimeHigh: number;
    allTimeLow: number;
  };
  params: BotParam[];
}

// Strategy Selection Component for Action Sheet
const StrategiesList = ({ strategies, onSelectedStrategy }: { 
  strategies: StrategyItem[]; 
  onSelectedStrategy: (strategy: StrategyItem) => void; 
}) => {
  return (
    <div className="modern-action-sheet-list">
      <div className="modern-action-sheet-header">
        <h3>🎯 Trading Strategies</h3>
      </div>
      <div className="modern-action-sheet-list">
        {strategies.map((strategy: StrategyItem) => (
          <div
            key={strategy._id}
            className="modern-action-sheet-item"
            onClick={() => onSelectedStrategy(strategy)}
          >
            <div className="modern-action-sheet-icon">
              <Avatar 
                src={strategy.coverPhoto} 
                shape="square" 
                className="strategy-selection-avatar"
              />
            </div>
            <div className="modern-action-sheet-content">
              <div>
                <div className="modern-action-sheet-label">
                  {strategy.configuration.general.botName}
                </div>
                <div className="modern-action-sheet-description">
                  {strategy.description}
                </div>
              </div>
              <div className="modern-action-sheet-right">
                <span className="modern-action-sheet-arrow">→</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const strategyList: StrategyItem[] = [
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

const staticBots: Bot[] = [{
      id: 'bot1',
      botName: "Volatility Master",
      botDescription: "Advanced bot for trading volatility indices with high precision",
      marketName: "Volatility 100 (1s) Index",
      contractType: "Rise/Fall",
      strategyName: "Momentum Reversal",
      startedAt: new Date(),
      netProfit: 1250.50,
      baseStake: 25.00,
      numberOfWins: 45,
      numberOfLosses: 12,
      state: "PLAY" as const,
      botMetadata: {
        version: "2.1.0",
        algorithm: "neural_network",
        riskLevel: "medium"
      },
      isActive: true,
      totalTrades: 57,
      winRate: 78.9,
      averageProfit: 21.93,
      maxDrawdown: 150.00,
      lastRunAt: new Date(),
      settings: {
        maxConcurrentTrades: 3,
        stopLoss: 15,
        takeProfit: 30,
        riskPerTrade: 5
      },
      performance: {
        dailyProfit: 85.20,
        weeklyProfit: 425.00,
        monthlyProfit: 1250.50,
        allTimeHigh: 1450.00,
        allTimeLow: -200.00
      },
      params: [
        { key: "repeat_trade", label: "Repeat trade", value: 10 },
        { key: "initial_stake", label: "Initial stake", value: 25 },
        { key: "risk_level", label: "Risk level", value: 5 }
      ]
    },
    {
      id: 'bot2',
      botName: "Forex Scalper Pro",
      botDescription: "High-frequency forex trading bot for quick profits",
      marketName: "EUR/USD",
      contractType: "Higher/Lower",
      strategyName: "Scalping Strategy",
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      netProfit: 890.25,
      baseStake: 15.00,
      numberOfWins: 38,
      numberOfLosses: 18,
      state: "PAUSE" as const,
      botMetadata: {
        version: "1.8.5",
        algorithm: "technical_analysis",
        riskLevel: "low"
      },
      isActive: true,
      totalTrades: 56,
      winRate: 67.9,
      averageProfit: 15.90,
      maxDrawdown: 95.00,
      lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      settings: {
        maxConcurrentTrades: 2,
        stopLoss: 10,
        takeProfit: 20,
        riskPerTrade: 3
      },
      performance: {
        dailyProfit: 45.50,
        weeklyProfit: 320.00,
        monthlyProfit: 890.25,
        allTimeHigh: 950.00,
        allTimeLow: -120.00
      },
      params: [
        { key: "repeat_trade", label: "Repeat trade", value: 15 },
        { key: "initial_stake", label: "Initial stake", value: 15 },
        { key: "timeframe", label: "Timeframe", value: 1 }
      ]
    },
    {
      id: 'bot3',
      botName: "Crypto Hunter",
      botDescription: "Cryptocurrency trading bot optimized for BTC and ETH pairs",
      marketName: "BTC/USD",
      contractType: "Touch/No Touch",
      strategyName: "Breakout Hunter",
      startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      netProfit: 2340.75,
      baseStake: 50.00,
      numberOfWins: 62,
      numberOfLosses: 23,
      state: "PLAY" as const,
      botMetadata: {
        version: "3.0.1",
        algorithm: "sentiment_analysis",
        riskLevel: "high"
      },
      isActive: true,
      totalTrades: 85,
      winRate: 72.9,
      averageProfit: 27.54,
      maxDrawdown: 280.00,
      lastRunAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      settings: {
        maxConcurrentTrades: 5,
        stopLoss: 20,
        takeProfit: 40,
        riskPerTrade: 8
      },
      performance: {
        dailyProfit: 125.30,
        weeklyProfit: 875.00,
        monthlyProfit: 2340.75,
        allTimeHigh: 2500.00,
        allTimeLow: -350.00
      },
      params: [
        { key: "repeat_trade", label: "Repeat trade", value: 20 },
        { key: "initial_stake", label: "Initial stake", value: 50 },
        { key: "leverage", label: "Leverage", value: 10 }
      ]
    }];

export function Bots2() {

  const { publish } = useEventPublisher();
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [updatingStats, setUpdatingStats] = useState<Set<string>>(new Set());

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const [botsLoading, setBotsLoading] = useState(false);

  const [bots, setBots] = useLocalStorage<Bot[]>('my_bots', {
    defaultValue: staticBots
  });

  const reloadBots = async () => {
    setBotsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setBots(staticBots);
      setBotsLoading(false);
      message.success('Bots updated successfully');
    }, 1500);
  }

  const closeActionSheet = () => {

    setIsActionSheetOpen(false);

  }

  const onSelectedStrategyHandler = (strategy: StrategyItem) => {
    closeActionSheet();
    publish('CREATE_BOT', {
      strategy
    });
    console.log("Bots create bot", strategy)
  }

  useEffect(() => {
    const heartbeat = setInterval(() => {
      setBots((prevBots: Bot[]) => {
        if (!Array.isArray(prevBots)) return prevBots;
        
        return prevBots.map(bot => {
          if (bot.state !== 'PLAY') return bot;

          // Trigger animation for this bot
          setUpdatingStats(prev => new Set(prev).add(bot.id));
          setTimeout(() => {
            setUpdatingStats(prev => {
              const newSet = new Set(prev);
              newSet.delete(bot.id);
              return newSet;
            });
          }, 400);

          // Random profit fluctuation (-0.5 to +0.8)
          const fluctuation = (Math.random() * 1.3) - 0.5;
          const newProfit = bot.netProfit + fluctuation;
          
          // Increment running time
          const newRunningTime = (bot.runningTime || 0) + 1;

          // Occasionally update trades (1 in 30 chance per heartbeat)
          let newWins = bot.numberOfWins;
          let newLosses = bot.numberOfLosses;
          let newTotal = bot.totalTrades;
          
          if (Math.random() < 0.033) {
            newTotal += 1;
            if (Math.random() > 0.3) { // 70% win chance for mock
              newWins += 1;
            } else {
              newLosses += 1;
            }
          }

          const newWinRate = newTotal > 0 ? Math.round((newWins / newTotal) * 100) : 0;

          return {
            ...bot,
            netProfit: newProfit,
            runningTime: newRunningTime,
            numberOfWins: newWins,
            numberOfLosses: newLosses,
            totalTrades: newTotal,
            winRate: newWinRate,
            lastRunAt: new Date()
          };
        });
      });
    }, 1000); // Update every second

    return () => clearInterval(heartbeat);
  }, [setBots]);

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
  const botList = Array.isArray(bots) ? bots : [];
  
  const filteredBots = botList.filter((bot: Bot) => 
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
  const getNetProfit = (bot: Bot): number => {
    return bot.netProfit || 0;
  };

  // Calculate win rate
  const getWinRate = (bot: Bot): number => {
    if (bot.totalTrades === 0) return 0;
    return Math.round((bot.numberOfWins / bot.totalTrades) * 100);
  };

  // Get status configuration
  const getStatusConfig = (state: string) => {
    switch (state) {
      case 'PLAY':
        return { color: '#52c41a', label: 'Running', icon: '🟢' };
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      message.error(`Failed to ${action} bot: ${errorMessage}`);
    }
  };

  return (
    <div className="bots2-container">
      {/* Fixed Search Header */}
      <div className={`bots2-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={4}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" justify="space-between">
              <h2 className="page-title">Bots <Badge count={botList.length} showZero /></h2>
              <Space>
                <Button
                  size="large"
                  type="text"
                  className="action-btn add-btn"
                  icon={<PlusOutlined />}
                  onClick={() => setIsActionSheetOpen(true)}
                />
                <Button
                  size="large"
                  type="text"
                  className="action-btn"
                  icon={<SyncOutlined />}
                  onClick={() => reloadBots()}
                />
              </Space>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Input
              placeholder="Search bots by name, market, or strategy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchIcon />}
              className="search-input"
              allowClear
            />
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <div className="bots2-main-content">
        {botsLoading ? (
          <div className="loading-state">
            <Spin size="large" />
            <Text type="secondary">Updating your bot status...</Text>
          </div>
        ) : filteredBots.length > 0 ? (
          <div className="bots2-list">
            <Row gutter={[24, 24]}>
              {filteredBots.map((bot) => {
                const statusConfig = getStatusConfig(bot.state);
                const netProfit = getNetProfit(bot);
                const winRate = getWinRate(bot);
                const isProfit = netProfit >= 0;

                return (
                  <Col xs={24} sm={24} md={12} lg={12} xl={8} key={bot.id} className="bot-card-wrapper">
                    <Card
                      className={`bot-card ${bot.state === 'PLAY' ? 'running' : ''}`}
                      hoverable
                      size="small"
                    >
                      {/* Card Header */}
                      <Space className="bot-card-header" vertical>
                        <Flex className="bot-info" align="center" justify="space-between">
                          <Title level={5} className="bot-name">
                            {bot.botName}
                          </Title>
                          <Tag color={statusConfig.color} className="status-tag">
                          {statusConfig.icon} <span>{statusConfig.label}</span>
                        </Tag>
                        </Flex><Text type="secondary" className="bot-market">
                            {bot.marketName} • {bot.strategyName}
                          </Text>
                        
                      </Space>

                      {/* Bot Stats */}
                      <div className="bot-stats">
                        <div className="stat-item">
                          <div className="stat-icon">
                            <ClockCircleOutlined />
                            <span className="stat-label">Runtime</span>
                          </div>
                          <div className="stat-content">
                            <span className={`stat-value ${updatingStats.has(bot.id) ? 'updating' : ''}`}>
                              {formatTime(bot.runningTime || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <DollarOutlined />
                            <span className="stat-label">
                              Profit {bot.state === 'PLAY' && <span className="live-indicator" />}
                            </span>
                          </div>
                          <div className="stat-content">
                            <span className={`stat-value ${isProfit ? 'profit' : 'loss'} ${updatingStats.has(bot.id) ? 'updating' : ''}`}>
                              {isProfit ? '+' : ''}{netProfit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <ThunderboltOutlined />
                            <span className="stat-label">Stake</span>
                          </div>
                          <div className="stat-content">
                            <span className="stat-value">{bot.baseStake}.05 <br/><small>tUSDT</small></span>
                          </div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-icon">
                            <TrophyOutlined />
                            <span className="stat-label">Win Rate</span>
                          </div>
                          <div className="stat-content">
                            <span className={`stat-value ${updatingStats.has(bot.id) ? 'updating' : ''}`}>{winRate}% <br/><small>835/7,899</small></span>
                          </div>
                        </div>
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
                          <Tooltip title={bot.state === 'PLAY' ? 'Running' : 'Start'}>
                            <Button
                              className={`control-btn start-btn ${bot.state === 'PLAY' ? 'current-state' : ''}`}
                              onClick={() => handleBotAction(bot.id, 'start')}
                              disabled={bot.state === 'PLAY'}
                            >
                              <PlayCircleOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip title={bot.state === 'PAUSE' ? 'Paused' : 'Pause'}>
                            <Button
                              className={`control-btn pause-btn ${bot.state === 'PAUSE' ? 'current-state' : ''}`}
                              onClick={() => handleBotAction(bot.id, 'pause')}
                              disabled={bot.state !== 'PLAY'}
                            >
                              <PauseCircleOutlined />
                            </Button>
                          </Tooltip>
                          <Tooltip title={bot.state === 'STOP' ? 'Stopped' : 'Stop'}>
                            <Button
                              className={`control-btn stop-btn ${bot.state === 'STOP' ? 'current-state' : ''}`}
                              onClick={() => handleBotAction(bot.id, 'stop')}
                              disabled={bot.state === 'STOP'}
                            >
                              <StopOutlined />
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
        ) : (
          <div className="empty-state">
            <img src={botIcon} width="200" alt="No bots" />
            <span className="empty-text">
              {searchQuery ? 'No bots found matching your search.' : 'No bots yet. Create your first trading bot!'}
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="create-first-btn"
              onClick={() => setIsActionSheetOpen(true)}
            >
              Create Your First Bot
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Action Sheet */}
      <BottomActionSheet
        isOpen={isActionSheetOpen}
        onClose={closeActionSheet}
        height="80vh"
      >
        <StrategiesList strategies={strategyList} onSelectedStrategy={onSelectedStrategyHandler} />
      </BottomActionSheet>

    </div>
  );
}
