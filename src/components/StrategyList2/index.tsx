import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Empty,
  Spin,
  Badge,
  Input,
  Tabs,
  Avatar,
  Flex,
  Space
} from 'antd';
import {
  TrophyOutlined,
  PlusOutlined,
  RobotOutlined,
  GiftOutlined,
  CrownOutlined,
  UserOutlined,
  SyncOutlined,
  GlobalOutlined,
  SwapOutlined,
  TagOutlined
} from '@ant-design/icons';
import { BotInstance } from '../../types/bot';
import './styles.scss';
import { useLocalStorage } from '../../utils/use-local-storage/useLocalStorage';
import { useEventPublisher } from '../../hooks/useEventManager';

interface StrategyAuthor {
  photoURL: string;
  displayName: string;
  date: string;
}

interface StrategyItem extends BotInstance {
  botName: string;
  tradeType: string;
  market: string;
  tags: string[];
  description: string;
  author: StrategyAuthor;
  coverPhoto: string;
}

const { Title, Text } = Typography;

// Mock data for demonstration
const mockBots: StrategyItem[] = [
  {
    _id: 'martingale',
    userId: 'user1',
    botName: 'Classic Martingale',
    tradeType: 'Progressive Betting',
    market: 'Forex',
    configuration: {},
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
    _id: 'martingale_on_stat_reset',
    userId: 'user1',
    botName: 'Martingale Reset',
    tradeType: 'Progressive Betting',
    market: 'Forex',
    configuration: {},
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
    _id: 'dalembert',
    userId: 'user1',
    botName: 'D\'Alembert System',
    tradeType: 'Progressive Betting',
    market: 'Crypto',
    configuration: {},
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
    _id: 'dalembert_on_stat_reset',
    userId: 'user1',
    botName: 'D\'Alembert Reset',
    tradeType: 'Progressive Betting',
    market: 'Crypto',
    configuration: {},
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
    _id: 'reverse_martingale',
    userId: 'user1',
    botName: 'Reverse Martingale',
    tradeType: 'Anti-Martingale',
    market: 'Stocks',
    configuration: {},
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
    _id: 'reverse_martingale_on_stat_reset',
    userId: 'user1',
    botName: 'Reverse Martingale Reset',
    tradeType: 'Anti-Martingale',
    market: 'Stocks',
    configuration: {},
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
    _id: 'reverse_dalembert',
    userId: 'user1',
    botName: 'Reverse D\'Alembert',
    tradeType: 'Anti-D\'Alembert',
    market: 'Gold',
    configuration: {},
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
    _id: 'reverse_dalembert_on_stat_reset',
    userId: 'user1',
    botName: 'Reverse D\'Alembert Reset',
    tradeType: 'Anti-D\'Alembert',
    market: 'Gold',
    configuration: {},
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
    _id: 'options_martingale',
    userId: 'user1',
    botName: 'Options Martingale',
    tradeType: 'Options Trading',
    market: 'Options',
    configuration: {},
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
    _id: 'oscars_grind',
    userId: 'user1',
    botName: 'Oscar\'s Grind',
    tradeType: 'Conservative Progression',
    market: 'Forex',
    configuration: {},
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
    _id: 'system_1326',
    userId: 'user1',
    botName: '1-3-2-6 System',
    tradeType: 'Fixed Sequence',
    market: 'Crypto',
    configuration: {},
    tags: ['Fibonacci Sequence', 'Fixed Progression', 'Cryptocurrency', 'Pattern Trading', 'Disciplined Execution'],
    description: 'Fibonacci-inspired fixed sequence progression for cryptocurrency volatility. Executes predetermined position size patterns (1-3-2-6 units) regardless of market outcome, creating mathematical edge through disciplined mechanical execution in digital asset markets.',
    author: {
      photoURL: 'https://example.com/photos/trader11.jpg',
      displayName: 'Crypto Sequence',
      date: '2024-01-10'
    },
    coverPhoto: '/strategies/1326-system-banner.jpg'
  },
  {
    _id: 'options_dalembert',
    userId: 'user1',
    botName: 'Options D\'Alembert',
    tradeType: 'Options Trading',
    market: 'Options',
    configuration: {},
    tags: ['Options Strategies', 'Linear Progression', 'Derivatives', 'Conservative Options', 'Premium Management'],
    description: 'D\'Alembert\'s arithmetic progression adapted for options markets. Systematically increases position sizes by fixed units after losses while decreasing after wins, creating controlled exposure in derivatives trading with reduced volatility compared to exponential systems.',
    author: {
      photoURL: 'https://example.com/photos/trader12.jpg',
      displayName: 'Options Quant',
      date: '2024-01-11'
    },
    coverPhoto: '/strategies/options-dalembert-banner.jpg'
  },
  {
    _id: 'options_reverse_martingale',
    userId: 'user1',
    botName: 'Options Reverse Martingale',
    tradeType: 'Options Trading',
    market: 'Options',
    configuration: {},
    tags: ['Options Strategies', 'Positive Progression', 'Paroli Options', 'Momentum Trading', 'Premium Growth'],
    description: 'Anti-martingale system engineered for options premium capture. Doubles winning positions while maintaining constant loss exposure, exploiting options momentum through compound growth during trending volatility periods with asymmetric upside potential.',
    author: {
      photoURL: 'https://example.com/photos/trader13.jpg',
      displayName: 'Volatility Master',
      date: '2024-01-12'
    },
    coverPhoto: '/strategies/options-reverse-martingale-banner.jpg'
  },
  {
    _id: 'options_oscars_grind',
    userId: 'user1',
    botName: 'Options Oscar\'s Grind',
    tradeType: 'Options Trading',
    market: 'Options',
    configuration: {},
    tags: ['Options Strategies', 'Conservative Trading', 'Premium Collection', 'Low Risk Options', 'Theta Harvest'],
    description: 'Patient options grinding system designed for steady premium accumulation. Implements minimal progression with disciplined risk management, prioritizing capital preservation while harvesting theta decay in options markets through consistent, controlled position sizing.',
    author: {
      photoURL: 'https://example.com/photos/trader14.jpg',
      displayName: 'Options Grinder',
      date: '2024-01-13'
    },
    coverPhoto: '/strategies/options-oscars-grind-banner.jpg'
  },
  {
    _id: 'options_1326_system',
    userId: 'user1',
    botName: 'Options 1-3-2-6 System',
    tradeType: 'Options Trading',
    market: 'Options',
    configuration: {},
    tags: ['Options Strategies', 'Fixed Sequence', 'Derivatives', 'Pattern Trading', 'Systematic Options'],
    description: 'Fixed sequence progression adapted for options volatility trading. Executes predetermined position patterns (1-3-2-6 units) in options markets, creating mathematical edge through disciplined mechanical execution while managing gamma exposure and time decay systematically.',
    author: {
      photoURL: 'https://example.com/photos/trader15.jpg',
      displayName: 'Options Sequence',
      date: '2024-01-14'
    },
    coverPhoto: '/strategies/options-1326-system-banner.jpg'
  }
];

export function StrategyList2() {

  const { publish } = useEventPublisher();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);

  const [botsLoading, setBotsLoading] = useState(false);

  const [bots, setBots] = useLocalStorage<StrategyItem[]>('bot_strategies', {
    defaultValue: mockBots
  });

  const reloadBots = async () => {
    setBotsLoading(true);
    setBots([]);
    setTimeout(() => {
      setBots(mockBots);
      setBotsLoading(false);
    }, 2000)
  }

  // Handle scroll events for header positioning
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderFixed(scrollY > 57);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter bots based on search query
  const botList = Array.isArray(bots) ? bots : [];
  
  const searchResults = botList.filter(bot =>
    (bot.botName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot.market?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot.tradeType?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const handleCreateBot = (bot: StrategyItem) => {
    publish('CREATE_BOT', {
      strategy: bot
    });
    console.log("StrategyList create bot", bot)
  };

  return (
    <div className="strategy-list2-container">
      {/* Fixed Search Header */}
      <div className={`strategy-list2-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" justify="space-between">
              <h1 className="screen-title">Strategies <Badge count={botList.length} showZero /></h1>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  className="action-btn"
                />
              </Space>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" gap={16}>
              <Input
                placeholder="Search strategies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<TrophyOutlined />}
                className="text-input"
                allowClear
              />
              <Button
                size="large"
                type="text"
                className="action-btn"
                icon={<SyncOutlined />}
                onClick={() => reloadBots()}
              />
            </Flex>
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
                  ) : searchResults.length > 0 ? (
                    <Row gutter={[24, 24]}>
                      {searchResults.map((bot: StrategyItem) => {
                        return (
                          <Col xs={24} sm={24} md={12} lg={12} xl={8} key={bot._id} className="strategy-card-wrapper">
                            <Card
                              className={`strategy-card ${bot.status === 'running' ? 'running' : ''}`}
                              hoverable
                              size="small"
                            >
                              {/* Card Image */}
                              <div className="strategy-card-image">
                                <img
                                  src={bot.coverPhoto}
                                  alt={bot.botName || 'Strategy'}
                                />
                              </div>

                              {/* Card Content */}
                              <div className="strategy-card-content">
                                {/* Title and Description */}
                                <div className="strategy-info">
                                  <Title level={5} className="strategy-name">
                                    {bot.botName || 'Unknown Strategy'}
                                  </Title>
                                  <Text type="secondary" className="strategy-description">
                                    {bot.description}
                                  </Text>
                                </div>

                                {/* Tags */}
                                <div className="strategy-tags">
                                  <div className="strategy-tag-item">
                                    <GlobalOutlined />
                                    <span>{bot.market || 'Unknown Market'}</span>
                                  </div>
                                  <div className="strategy-tag-item">
                                    <SwapOutlined />
                                    <span>{bot.tradeType || 'Unknown Type'}</span>
                                  </div>
                                  {bot.tags.slice(0, 2).map((tag: string) => (
                                    <div key={tag} className="strategy-tag-item secondary">
                                      <TagOutlined />
                                      <span>{tag}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="strategy-footer">
                                  <div className="author-info">
                                    <Avatar icon={<UserOutlined />} size={40} src={bot.author.photoURL} />
                                    <div className="author-details">
                                      <strong>{bot.author.displayName}</strong>
                                      <span>{bot.author.date}</span>
                                    </div>
                                  </div>
                                  <Button 
                                    type="primary" 
                                    className="create-btn"
                                    onClick={() => handleCreateBot(bot)}
                                  >
                                    Create Bot
                                  </Button>
                                </div>
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
