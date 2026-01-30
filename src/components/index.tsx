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
  Badge,
  Input,
  Divider,
  Tabs,
  Avatar
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  RobotOutlined,
  GiftOutlined,
  CrownOutlined,
  UserOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { BotInstance } from '../../types/bot';
import './styles.scss';
import { useLocalStorage } from '../../utils/use-local-storage/useLocalStorage';

const { Title, Text } = Typography;

// Mock data for demonstration
const mockBots: BotInstance[] = [
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

export function StrategyList2() {
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);

  const [botsLoading, setBotsLoading] = useState(false);

  const [bots, setBots] = useLocalStorage<BotInstance>('bot_strategies', {
    defaultValue: []
  });

  const reloadBots = async () => {

    setBotsLoading(true);
    setBots([]);
    setTimeout(() => {
      setBots(mockBots);
      setBotsLoading(false);
    }, 5000)

  }

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
  const filteredBots = (bots || []).filter(bot =>
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

  // Get comprehensive strategy description
  const getStrategyDescription = (botName: string, market: string, tradeType: string): string => {
    const descriptions: { [key: string]: string } = {
      'Classic Martingale': 'Classic Martingale progressive betting system that doubles position size after each loss while resetting to initial stake after wins. Designed for forex markets with high liquidity and tight spreads. Implements risk management through maximum drawdown limits and session profit targets to protect capital during extended losing streaks.',
      'Martingale Reset': 'Martingale strategy with statistical reset functionality that resets progression after reaching predefined loss thresholds or profit targets. Utilizes advanced statistical analysis to determine optimal reset points based on market volatility and historical performance data. Provides enhanced capital protection while maintaining aggressive growth potential.',
      'D\'Alembert System': 'D\'Alembert progressive betting system that increases stake by one unit after losses and decreases by one unit after wins. More conservative than Martingale with slower progression and reduced risk exposure. Ideal for cryptocurrency markets with moderate volatility and sufficient liquidity for consistent trade execution.',
      'D\'Alembert Reset': 'D\'Alembert system enhanced with statistical reset mechanisms that monitor performance metrics and trigger progression resets based on predefined criteria. Combines conservative progression with intelligent reset logic to optimize risk-reward ratios. Adapts to changing market conditions through dynamic parameter adjustments.',
      'Reverse Martingale': 'Reverse Martingale (Anti-Martingale) system that doubles position size after wins and resets to minimum stake after losses. Designed to capitalize on winning streaks while limiting exposure during losing periods. Best suited for stock markets with trending characteristics and momentum-based trading opportunities.',
      'Reverse Martingale Reset': 'Anti-Martingale strategy with intelligent reset functionality that protects accumulated profits through systematic profit taking and progression resets. Implements trailing stop mechanisms and dynamic progression adjustments based on market volatility and performance metrics. Optimized for equity markets with strong trend characteristics.',
      'Reverse D\'Alembert': 'Reverse D\'Alembert system that increases stakes after wins and decreases after losses, opposite of traditional D\'Alembert. Designed to ride winning streaks while minimizing risk during drawdowns. Particularly effective in gold markets with seasonal trends and safe-haven flow patterns.',
      'Reverse D\'Alembert Reset': 'Anti-D\'Alembert system enhanced with statistical reset capabilities that monitor winning streaks and trigger optimal reset points. Combines aggressive profit maximization with intelligent risk management through dynamic progression adjustments. Adapts to market conditions through real-time performance analysis.',
      'Options Martingale': 'Specialized Martingale system optimized for options trading with adjusted progression rates based on option Greeks and time decay. Accounts for option premium erosion and volatility changes in progression calculations. Designed for options markets with specific focus on expiration cycles and implied volatility dynamics.',
      'Oscar\'s Grind': 'Oscar\'s Grind conservative progression system that aims for small, consistent profits with minimal risk exposure. Increases stake by one unit after each win until achieving target profit, then resets to base stake. Ideal for forex markets with range-bound characteristics and predictable price patterns.',
      '1-3-2-6 System': 'Fixed sequence betting system following 1-3-2-6 progression pattern that maximizes returns during winning streaks while limiting losses. Completes full sequence only after four consecutive wins, otherwise resets to beginning. Suitable for cryptocurrency markets with high volatility and frequent trend reversals.'
    };

    return descriptions[botName] || `Advanced ${tradeType} strategy for ${market} markets. This automated trading system utilizes technical indicators and risk management principles to identify high-probability trading opportunities. Features customizable parameters, real-time market analysis, and automated execution with comprehensive risk controls.`;
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

  return (
    <div className="strategy-list2-container">
      {/* Fixed Search Header */}
      <div className={`strategy-list2-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" justify="space-between">
              <h1 style={{ fontSize: 32 }}>Strategies <Badge count={bots.length} /></h1>
              <Space size={16}>
                <Button
                  size="large"
                  type="text"
                  icon={<SyncOutlined style={{ fontSize: 24 }} />}
                  onClick={() => reloadBots()} />
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

      {/* Main Content with Tabs */}
      <div className={`strategy-list2-main-content ${isHeaderFixed ? 'with-fixed-header' : ''}`}>
        <Tabs
          defaultActiveKey="strategies"
          className="strategy-tabs"
          items={[
            {
              key: 'strategies',
              label: 'Strategies',
              icon: <RobotOutlined />,
              children: (
                <div className="strategy-list2-list">
                  {botsLoading ? (
                    <div className="loading-state">
                      <Spin size="large" />
                      <Text type="secondary">Loading your strategies...</Text>
                    </div>
                  ) : filteredBots.length > 0 ? (
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
                              {/* Card Image */}
                              <div className="strategy-card-image">
                                <img
                                  src={bot.coverPhoto}
                                  alt={bot.configuration.general.botName}
                                />
                              </div>

                              {/* Card Content */}
                              <div className="strategy-card-content">
                                {/* Title and Description */}
                                <div className="strategy-info">
                                  <Title level={5} className="strategy-name" style={{ margin: 0 }}>
                                    {bot.configuration.general.botName}
                                  </Title>
                                  <Text type="secondary" className="strategy-description">
                                    {bot.description}
                                  </Text>
                                </div>
                                <Divider />
                                {/* Tags */}
                                <div className="strategy-tags">
                                  <Text type="secondary" className="strategy-description">
                                    TAGS:
                                  </Text>
                                  <Badge color="blue" text={bot.configuration.general.market} />
                                  <Badge color="blue" text={bot.configuration.general.tradeType} />
                                  {bot.tags.map((tag) => (
                                    <Badge key={tag} color="blue" text={tag} />
                                  ))}
                                </div>
                                <Divider />
                                <Flex justify="space-between" align="center" gap={8}>
                                  <Flex><Avatar icon={<UserOutlined />} size={42} style={{ marginRight: 16 }} src={bot.author.photoURL} /><span><strong>{bot.author.displayName}</strong><br />{bot.author.date}</span></Flex>
                                  <Button type="primary">Create Bot</Button>
                                </Flex>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    <div className="empty-state">
                      <Empty
                        description={
                          <span className="empty-text">
                            {searchQuery ? 'No strategies found matching your search.' : 'No strategies yet. Create your first trading strategy!'}
                          </span>
                        }
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="large"
                          className="create-first-btn"
                        >
                          Create Your First Strategy
                        </Button>
                      </Empty>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'free-bots',
              label: 'Free Bots',
              icon: <GiftOutlined />,
              children: (
                <div className="free-bots-content">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Free bots coming soon"
                  />
                </div>
              ),
            },
            {
              key: 'premium-bots',
              label: 'Premium Bots',
              icon: <CrownOutlined />,
              children: (
                <div className="premium-bots-content">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Premium bots coming soon"
                  />
                </div>
              ),
            },
          ]}
        />
       </div>
    </div>
  );
}
