import { useState } from 'react';
import { Typography, Button, Tooltip, Badge, Flex, Avatar, FloatButton } from 'antd';
import { NotificationsDrawer } from '../NotificationsDrawer';
import { 
  RobotOutlined, 
  FireOutlined, 
  ThunderboltOutlined,
  WalletOutlined,
  CrownOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  BellOutlined,
  PlusOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined,
  RiseOutlined,
  DollarOutlined,
  DollarCircleFilled,
  CopyOutlined
} from '@ant-design/icons';
import './styles.scss';
import { useOAuth } from '../../contexts/OAuthContext';
import { useEventPublisher } from '../../hooks/useEventManager';

const { Title, Text } = Typography;

// Mock data
interface WeeklyPerformance {
  day: string;
  profit: number;
}

const mockData = {
  user: {
    name: 'Trader',
    avatar: null,
    level: 'Pro',
    memberSince: '2024'
  },
  portfolio: {
    totalValue: 2048.35,
    dailyChange: 2847.50,
    dailyChangePercent: 0.62,
    weeklyChange: 12450.80,
    weeklyChangePercent: 2.79,
    weeklyPerformance: [
      { day: 'Mon', profit: 2340.50 },
      { day: 'Tue', profit: 1890.25 },
      { day: 'Wed', profit: -520.15 },
      { day: 'Thu', profit: 3450.80 },
      { day: 'Fri', profit: 2890.40 },
      { day: 'Sat', profit: 1560.20 }
    ] as WeeklyPerformance[]
  },
  quickStats: {
    activeBots: 8,
    totalBots: 12,
    winRate: 73.4,
    totalTrades: 1,
    profitToday: 246.17,
    profitThisMonth: 12562.12,
    commissionsThisMonth: 2332.50,
    streak: 7
  },
  topPerformers: [
    { id: 1, name: 'Alpha Momentum', profit: 12450.20, change: 8.5, status: 'running', icon: '🚀' },
    { id: 2, name: 'Beta Scalper', profit: 8920.15, change: 5.2, status: 'running', icon: '⚡' },
    { id: 3, name: 'Gamma Swing', profit: 6540.80, change: 3.8, status: 'paused', icon: '🎯' }
  ],
  recentActivity: [
    { id: 1, type: 'win', bot: 'Alpha Momentum', amount: 245.50, time: '2 min ago' },
    { id: 2, type: 'win', bot: 'Beta Scalper', amount: 180.25, time: '5 min ago' },
    { id: 3, type: 'loss', bot: 'Gamma Swing', amount: -85.15, time: '12 min ago' },
    { id: 4, type: 'win', bot: 'Alpha Momentum', amount: 320.80, time: '18 min ago' }
  ],
  marketSentiment: 'bullish',
  notifications: 3,
  notificationsList: [
    {
      id: '1',
      type: 'profit' as const,
      title: 'Profit Alert',
      message: 'Alpha Momentum bot generated profit',
      time: '2 min ago',
      read: false,
      amount: 245.50
    },
    {
      id: '2',
      type: 'achievement' as const,
      title: 'New Achievement',
      message: 'You\'ve reached 7-day win streak!',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'bot' as const,
      title: 'Bot Status',
      message: 'Gamma Swing bot has been paused',
      time: '3 hours ago',
      read: true
    }
  ]
};

export function HomeScreen2() {
  const [data] = useState(mockData);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  const { user } = useOAuth();
  const { publish } = useEventPublisher();
  const [notifications, setNotifications] = useState(mockData.notificationsList);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCompact = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getProfitColor = (value: number) => {
    return value >= 0 ? '#52c41a' : '#ff4d4f';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="home-screen-2">
      {/* Header Section */}
      <header className="hs2-header">
        <div className="header-content">
          <Flex align="center" justify="space-between" gap={8}>
            <Avatar style={{ backgroundColor: '#4d2b84ff', borderRadius: '35%' }} size={48} src={user?.accounts?.firebase?.photoURL || undefined} />
          <div className="greeting-section">
            <Text className="greeting-text">{greeting},</Text>
            <Title level={3} className="user-name">{user?.displayName} 👋</Title>
          </div>
          </Flex>
          <div className="header-actions">
            <Badge count={unreadCount} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                className="header-btn" 
                size="large"
                onClick={() => publish('OPEN_NOTIFICATION_DRAWER', {})}
              />
            </Badge>
          </div>
        </div>
      </header>

      {/* Portfolio Card - Hero Section */}
      <section className="hs2-portfolio-section">
        <div className="portfolio-card">
          <div className="portfolio-glow"></div>
          <div className="portfolio-content">
            <div className="portfolio-label">
              <WalletOutlined /> Total Portfolio Value
            </div>
            <div className="portfolio-value">
              {formatCurrency(data.portfolio.totalValue)}
            </div>
            <div className="portfolio-changes">
              <div className={`change-badge ${data.portfolio.dailyChange >= 0 ? 'positive' : 'negative'}`}>
                {data.portfolio.dailyChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                <span>{formatCompact(Math.abs(data.portfolio.dailyChange))}</span>
                <span className="change-percent">({data.portfolio.dailyChangePercent}%)</span>
                <span className="change-label">today</span>
              </div>
            </div>
          </div>
          <div className="portfolio-decoration">
            <div className="deco-circle c1"></div>
            <div className="deco-circle c2"></div>
            <div className="deco-circle c3"></div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="hs2-quick-stats">
        <div className="stats-grid">
          <div className="stat-card glass">
            <div className="stat-icon session">
              <DollarOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(data.quickStats.profitToday)}</span>
              <span className="stat-label">Session profits</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon commissions">
              <DollarCircleFilled />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(data.quickStats.commissionsThisMonth)}</span>
              <span className="stat-label">Commissions</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon bots">
              <RobotOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.quickStats.activeBots}<span className="stat-suffix">/{data.quickStats.totalBots}</span></span>
              <span className="stat-label">Active Bots</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon winrate">
              <TrophyOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.quickStats.winRate}<span className="stat-suffix">%</span></span>
              <span className="stat-label">Win Rate</span>
            </div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-icon trades">
              <LineChartOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.quickStats.totalTrades.toLocaleString()}</span>
              <span className="stat-label">Total Trades</span>
            </div>
          </div>
          
          <div className="stat-card glass streak">
            <div className="stat-icon fire">
              <FireOutlined />
            </div>
            <div className="stat-info">
              <span className="stat-value">{data.quickStats.streak}<span className="stat-suffix"> days</span></span>
              <span className="stat-label">Win Streak 🔥</span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Performers Section */}
      <section className="hs2-performers">
        <div className="section-header">
          <Title level={4} className="section-title">
            <CrownOutlined /> Top Performers
          </Title>
          <Button type="link" className="see-all-btn" size="large">See All</Button>
        </div>
        
        <div className="performers-list">
          {data.topPerformers.map((bot, index) => (
            <div key={bot.id} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div className="performer-icon">{bot.icon}</div>
              <div className="performer-info">
                <span className="performer-name">{bot.name}</span>
                <span className="performer-profit">
                  <RiseOutlined /> {formatCompact(bot.profit)}
                </span>
              </div>
              <div className="performer-change">
                <span className={`change-value ${bot.change >= 0 ? 'positive' : 'negative'}`}>
                  +{bot.change}%
                </span>
              </div>
              <div className="performer-status">
                {bot.status === 'running' ? (
                  <Tooltip title="Running">
                    <PlayCircleOutlined className="status-icon running" />
                  </Tooltip>
                ) : (
                  <Tooltip title="Paused">
                    <PauseCircleOutlined className="status-icon paused" />
                  </Tooltip>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Performers Section */}
      <section className="hs2-performers">
        <div className="section-header">
          <Title level={4} className="section-title">
            <TrophyOutlined /> Leaderboard
          </Title>
          <Button type="link" className="see-all-btn" size="large">See All</Button>
        </div>
        
        <div className="performers-list">
          {data.topPerformers.map((bot, index) => (
            <div key={bot.id} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </div>
              <div className="performer-icon" style={{backgroundImage: `url(${bot.icon})`, backgroundSize: 'cover'}} ></div>
              <div className="performer-info">
                <span className="performer-name">{bot.name}</span>
                <span className="performer-profit">
                  <RiseOutlined /> {formatCompact(bot.profit)}
                </span>
              </div>
              <div className="performer-change">
                <span className={`change-value ${bot.change >= 0 ? 'positive' : 'negative'}`}>
                  +{bot.change}%
                </span>
              </div>
              <div className="performer-status">
                <Tooltip title="Copy Trading">
                    <CopyOutlined className="status-icon paused" />
                  </Tooltip>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="hs2-activity">
        <div className="section-header">
          <Title level={4} className="section-title">
            <ThunderboltOutlined /> Live Activity
          </Title>
          <div className="live-indicator">
            <span className="pulse"></span>
            <span>Live</span>
          </div>
        </div>
        
        <div className="activity-feed">
          {data.recentActivity.map((activity) => (
            <div key={activity.id} className={`activity-item ${activity.type}`}>
              <div className="activity-icon">
                {activity.type === 'win' ? (
                  <ArrowUpOutlined className="win-icon" />
                ) : (
                  <ArrowDownOutlined className="loss-icon" />
                )}
              </div>
              <div className="activity-details">
                <span className="activity-bot">{activity.bot}</span>
                <span className="activity-time">{activity.time}</span>
              </div>
              <div className={`activity-amount ${activity.type}`}>
                {activity.type === 'win' ? '+' : ''}{formatCurrency(activity.amount)}
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Market Sentiment Indicator */}
      <section className="hs2-sentiment">
        <div className={`sentiment-card ${data.marketSentiment}`}>
          <div className="sentiment-icon">
            {data.marketSentiment === 'bullish' ? '📈' : data.marketSentiment === 'bearish' ? '📉' : '➡️'}
          </div>
          <div className="sentiment-info">
            <span className="sentiment-label">Market Sentiment</span>
            <span className="sentiment-value">{data.marketSentiment.charAt(0).toUpperCase() + data.marketSentiment.slice(1)}</span>
          </div>
          <SafetyCertificateOutlined className="sentiment-badge" />
        </div>
      </section>

<section className="hs2-weekly-performance hs2-activity">
        <div className="section-header">
          <Title level={4} className="section-title">
            <TrophyOutlined /> Weekly Performance
          </Title>
          <div className="live-indicator">
            <span className="pulse"></span>
            <span>+{formatCompact(2748)}</span>
          </div>
        </div>
        
        <div className="weekly-performance-grid">
          {data.portfolio.weeklyPerformance.map((day: WeeklyPerformance) => (
            <div key={day.day} className="day-performance-card">
              <div className="day-header">
                <span className="day-name">{day.day}</span>
                <div className="day-indicator" />
              </div>
              <div className="day-profit">
                <span className="profit-amount" style={{ color: getProfitColor(day.profit) }}>
                  {day.profit > 0 ? '+' : ''}{formatCompact(day.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="hs2-actions">
        <Button type="primary" icon={<PlusOutlined />} className="action-btn primary" block size="large">
          Create New Bot
        </Button>
        <div className="secondary-actions">
          <Button icon={<RobotOutlined />} className="action-btn secondary" size="large">
            Manage Bots
          </Button>
          <Button icon={<LineChartOutlined />} className="action-btn secondary" size="large">
            Analytics
          </Button>
        </div>
      </section>
    </div>
  );
}
