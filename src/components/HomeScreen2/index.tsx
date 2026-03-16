import { useEffect, useState } from 'react';
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
import { LiveActivityFeed } from './LiveActivityFeed';
import { useDiscoveryContext } from '../../contexts/DiscoveryContext';
import { WeeklyPerformance } from './WeeklyPerformance';
import { MarketSentiment } from './MarketSentiment';
import { LeaderboardTraders } from './LeaderboardTraders';
import { LeaderboardBots } from './LeaderboardBots';
import { QuickStats } from './QuickStats';
import { HomeHeader } from './HomeHeader';

const { Title, Text } = Typography;

// Mock data


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
  const { winRate, sessionProfits, runningBots } = useDiscoveryContext();
  const [notifications, setNotifications] = useState(mockData.notificationsList);

  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <div className="home-screen-2">
      <HomeHeader />
      <QuickStats />
      <QuickStats />
      <LeaderboardBots />
      <LeaderboardTraders />
      <LiveActivityFeed />
      <MarketSentiment />
      <WeeklyPerformance />
    </div>

  );
}
