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
  TagOutlined,
  SearchOutlined
} from '@ant-design/icons';
import './styles.scss';
import { useLocalStorage } from '../../utils/use-local-storage/useLocalStorage';
import { useEventPublisher } from '../../hooks/useEventManager';
import { Strategy, STORAGE_KEYS } from '../../types/strategy';
import { StrategyCard } from './StrategyCard';
import { useStrategy } from './useStrategy';
const { Title, Text } = Typography;


export function StrategyList2() {

  const { publish } = useEventPublisher();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isHeaderFixed, setIsHeaderFixed] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [premiumBotsLoading, setPremiumBotsLoading] = useState(false);
  const [premiumBots, setPremiumBots] = useLocalStorage<Strategy[]>(STORAGE_KEYS.PREMIUM_BOTS_LIST, {
    defaultValue: []
  });

  
  const [freeBotsLoading, setFreeBotsLoading] = useState(false);
  const [freeBots, setFreeBots] = useLocalStorage<Strategy[]>(STORAGE_KEYS.FREE_BOTS_LIST, {
    defaultValue: []
  });

  
  const [strategiesLoading, setStrategiesLoading] = useState(false);
  const [strategies, setStrategies] = useLocalStorage<Strategy[]>(STORAGE_KEYS.STRATEGIES_LIST, {
    defaultValue: []
  });

  const { getPremiumBots, getFreeBots, getStrategies } = useStrategy;

  const reloadStrategies = async () => {
    setStrategiesLoading(true);
    setStrategies([]);
    setTimeout(async () => {

      const _premiumBots = await getPremiumBots();
      setPremiumBots(_premiumBots);
      
      const _freeBots = await getFreeBots();
      setFreeBots(_freeBots);
      
      const _strategies = await getStrategies();
      setStrategies(_strategies);

      setStrategiesLoading(false);

    }, 2000)
  }

  // Handle scroll events for header positioning
  useEffect(() => {

    reloadStrategies();

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsHeaderFixed(scrollY > 57);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter strategies based on search query
  const premiumBotsList = Array.isArray(premiumBots) ? premiumBots : [];
  const premiumBotsResults = premiumBotsList.filter((bot:Strategy) =>
    (bot?.strategyId?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.strategyUUID?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.tradeType?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.market?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.configuration?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.tags?.includes(searchQuery.toLowerCase()) || false) ||
    (bot?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const freeBotsList = Array.isArray(freeBots) ? freeBots : [];
  const freeBotsResults = freeBotsList.filter((bot:Strategy) =>
    (bot?.strategyId?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.strategyUUID?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.tradeType?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.market?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.configuration?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (bot?.tags?.includes(searchQuery.toLowerCase()) || false) ||
    (bot?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const strategiesList = Array.isArray(strategies) ? strategies : [];
  const searchResults = strategiesList.filter((strategy:Strategy) =>
    (strategy?.strategyId?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (strategy?.strategyUUID?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (strategy?.tradeType?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (strategy?.market?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (strategy?.configuration?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (strategy?.tags?.includes(searchQuery.toLowerCase()) || false) ||
    (strategy?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const handleCreateBot = (strategy: Strategy) => {
    publish('CREATE_BOT', { strategy });
  };

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const truncateText = (text: string, maxLines: number = 3) => {
    const words = text.split(' ');
    const wordsPerLine = 10; // Approximate words per line
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  };

  return (
    <div className="strategy-list2-container">
      {/* Fixed Search Header */}
      <div className={`strategy-list2-search-header ${isHeaderFixed ? 'fixed' : ''}`}>
        <Row justify="space-between" align="middle" gutter={16}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Flex align="center" justify="space-between" style={{width: "100%"}}>
              <h1 className="screen-title">Discover <Badge count={strategiesList.length} showZero /></h1>
              <Flex align="center" justify="flex-end" style={{width: "100%"}} gap={16}>
              <Button
                size="large"
                type="text"
                className="action-btn"
                icon={<SyncOutlined />}
                onClick={() => reloadStrategies()}
              />
              </Flex>
            </Flex>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Input
                placeholder="Search bots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<SearchOutlined style={{fontSize: 24, marginLeft: 8}} />}
                className="text-input"
                allowClear size="large"
              />
          </Col>
        </Row>
      </div>


      {/* Main Content with Tabs */}
      <div className={`strategy-list2-main-content ${isHeaderFixed ? 'with-fixed-header' : ''}`}>
        <Tabs
          defaultActiveKey="premium-bots"
          items={[

            {
              key: 'premium-bots',
              label: 'Premium Bots',
              icon: <CrownOutlined />,
              children: (
                <div className="strategy-list2-list">
                  {strategiesLoading ? (
                    <div className="loading-state">
                      <Spin size="large" />
                      <Text type="secondary">Loading Premium Bots...</Text>
                    </div>
                  ) : premiumBotsResults.length > 0 ? (
                    <Row gutter={[24, 24]}>
                      {premiumBotsResults.map((strategy: Strategy) => {
                        return (
                          <Col xs={24} sm={24} md={12} lg={12} xl={8} key={strategy?.strategyId} className="strategy-card-wrapper">
                            <StrategyCard title={strategy?.title} description={strategy?.description} />
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    <div className="empty-state">
                      <Empty
                        description={
                          <span className="empty-text">
                            {searchQuery ? 'No premium bots found matching your search.' : 'No premium bots yet. Create your first trading bot!'}
                          </span>
                        }
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="large"
                          className="create-first-btn"
                        >
                          Create Your First Bot
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
                <div className="strategy-list2-list">
                  {strategiesLoading ? (
                    <div className="loading-state">
                      <Spin size="large" />
                      <Text type="secondary">Loading Free Bots...</Text>
                    </div>
                  ) : freeBotsResults.length > 0 ? (
                    <Row gutter={[24, 24]}>
                      {freeBotsResults.map((strategy: Strategy) => {
                        return (
                          <Col xs={24} sm={24} md={12} lg={12} xl={8} key={strategy?.strategyId} className="strategy-card-wrapper">
                            <StrategyCard title={strategy?.title} description={strategy?.description} />
                          </Col>
                        );
                      })}
                    </Row>
                  ) : (
                    <div className="empty-state">
                      <Empty
                        description={
                          <span className="empty-text">
                            {searchQuery ? 'No free bots found matching your search.' : 'No free bots yet. Create your first trading bot!'}
                          </span>
                        }
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="large"
                          className="create-first-btn"
                        >
                          Create Your First Bot
                        </Button>
                      </Empty>
                    </div>
                  )}
                </div>
              ),
            },

            {
              key: 'strategies',
              label: 'Strategies',
              icon: <RobotOutlined />,
              children: (
                <div className="strategy-list2-list">
                  {strategiesLoading ? (
                    <div className="loading-state">
                      <Spin size="large" />
                      <Text type="secondary">Loading your strategies...</Text>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <Row gutter={[24, 24]}>
                      {searchResults.map((strategy: Strategy) => {
                        return (
                          <Col xs={24} sm={24} md={12} lg={12} xl={8} key={strategy?.strategyId} className="strategy-card-wrapper">
                            <Card
                              className={`strategy-card ${strategy?.isActive ? 'active' : ''}`}
                              hoverable
                              size="small"
                            >
                              {/* Card Image */}
                              <div className="strategy-card-image">
                                <img
                                  src={strategy?.coverPhoto}
                                  alt={strategy?.title || 'Strategy'}
                                />
                              </div>

                              {/* Card Content */}
                              <div className="strategy-card-content">
                                {/* Title and Description */}
                                <div className="strategy-info">
                                  <Title level={5} className="strategy-name">
                                    {strategy?.title || 'Unknown Strategy'}
                                  </Title>
                                  <Text type="secondary" className={`strategy-description ${expandedCards.has(strategy?.strategyId) ? 'expanded' : 'collapsed'}`}>
                                    {expandedCards.has(strategy?.strategyId) ? strategy?.description : truncateText(strategy?.description)}
                                  </Text>
                                  {!expandedCards.has(strategy?.strategyId) && strategy?.description.length > 150 && (
                                    <Button 
                                      type="link" 
                                      className="read-more-btn"
                                      onClick={() => toggleCardExpansion(strategy?.strategyId)}
                                    >
                                      Read more
                                    </Button>
                                  )}
                                  {expandedCards.has(strategy?.strategyId) && (
                                    <Button 
                                      type="link" 
                                      className="read-less-btn"
                                      onClick={() => toggleCardExpansion(strategy?.strategyId)}
                                    >
                                      Read less
                                    </Button>
                                  )}
                                </div>

                                {/* Tags and Footer - Only show when expanded */}
                                {expandedCards.has(strategy?.strategyId) && (
                                  <>
                                    {/* Performance Metrics */}
                                    <div className="strategy-metrics">
                                      <div className="metric-item">
                                        <span className="metric-value">#{strategy?.statistics?.rank || 'N/A'}</span>
                                        <span className="metric-label">Rank:</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">
                                          {strategy?.statistics?.totalTrades > 0 
                                            ? `${Math.round((strategy?.statistics?.totalWins / strategy?.statistics?.totalTrades) * 100)}%`
                                            : '0%'
                                          }
                                        </span>
                                        <span className="metric-label">Win Rate</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className={`metric-value status-badge ${strategy?.isActive ? 'active' : 'inactive'}`}>
                                          {strategy?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="metric-label">Status</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">${strategy?.statistics?.totalPayout?.toFixed(2) || '0.00'}</span>
                                        <span className="metric-label">Total Payout</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">${strategy?.statistics?.totalStake?.toFixed(2) || '0.00'}</span>
                                        <span className="metric-label">Total Stake</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">${(strategy?.statistics?.totalPayout - strategy?.statistics?.totalStake)?.toFixed(2) || '0.00'}</span>
                                        <span className="metric-label">Total Profit</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">{strategy?.statistics?.totalWins || 0}</span>
                                        <span className="metric-label">No. of wins</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">{strategy?.statistics?.totalLosses || 0}</span>
                                        <span className="metric-label">No. of Losses</span>
                                      </div>
                                      <div className="metric-item">
                                        <span className="metric-value">{strategy?.statistics?.totalRuns || 0}</span>
                                        <span className="metric-label">Runs:</span>
                                      </div>
                                    </div>

                                    {/* Tags */}
                                    <div className="strategy-tags">
                                      <div className="strategy-tag-item">
                                        <GlobalOutlined />
                                        <span>{strategy?.market || 'Unknown Market'}</span>
                                      </div>
                                      <div className="strategy-tag-item">
                                        <SwapOutlined />
                                        <span>{strategy?.tradeType || 'Unknown Type'}</span>
                                      </div>
                                      {strategy?.tags.slice(0, 2).map((tag: string) => (
                                        <div key={tag} className="strategy-tag-item secondary">
                                          <TagOutlined />
                                          <span>{tag}</span>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="strategy-footer">
                                      <div className="author-info">
                                        <Avatar icon={<UserOutlined />} size={40} src={strategy?.author.photoURL} />
                                        <div className="author-details">
                                          <strong>{strategy?.author.displayName}</strong>
                                          <span>{strategy?.author.date}</span>
                                        </div>
                                      </div>
                                      <Button 
                                        type="primary" 
                                        className="create-btn"
                                        onClick={() => handleCreateBot(strategy)}
                                      >
                                        Create Bot
                                      </Button>
                                    </div>
                                  </>
                                )}
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
            
          ]}
        />
       </div>
    </div>
  );
}
