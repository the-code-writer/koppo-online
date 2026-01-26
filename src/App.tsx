/**
 * @file: App.tsx
 * @description: Main application component that orchestrates the application layout,
 *               authentication flow, WebSocket connections, and routing.
 *
 * @components:
 *   - MainApp: Root application component
 *   - MainContent: Content area with routing outlet
 * @dependencies:
 *   - React: useEffect and core functionality
 *   - antd: Layout components
 *   - react-router-dom: Routing (Outlet, useLocation)
 *   - Multiple contexts: AuthContext, NavigationContext, BalanceContext
 *   - Services: oauthService, balanceService
 *   - Components: Navigation, Header
 * @usage:
 *   // In main.tsx or index.tsx
 *   <BrowserRouter>
 *     <AppProviders>
 *       <MainApp />
 *     </AppProviders>
 *   </BrowserRouter>
 *
 * @architecture: Component composition with hooks for state management
 * @relationships:
 *   - Parent: Root of the application tree
 *   - Children: Header, MainContent (which contains Outlet for routes)
 *   - Uses: Multiple contexts and services for auth, navigation, and data
 * @dataFlow:
 *   - Authentication: Manages auth flow with WebSocket and OAuth
 *   - Balance: Retrieves and displays balance data from SSE or context
 *   - Navigation: Syncs URL with active tab state
 *
 * @ai-hints: This component serves as the application shell and coordinates
 *            multiple data sources (WebSocket, SSE, contexts). It handles
 *            authentication state and initializes core connections.
 */
import { useEffect, useState } from "react";
import { FloatButton, Layout } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import { oauthService } from "./services/oauth/oauthService";
import { useAuth } from "./contexts/AuthContext";
import { useNavigation } from "./contexts/NavigationContext";
import { Navigation } from "./components/Navigation";
import { Header } from "./components/Header";
import { ProfileSettingsDrawer } from "./components/ProfileSettingsDrawer";
import { pathToTab } from "./router";
import LoginPage from "./pages/LoginPage";

import "./styles/App.scss";
import { BellOutlined, CommentOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { NotificationsDrawer } from "./components/NotificationsDrawer";

const { Content } = Layout;

/**
 * MainContent: Renders the main content area with routing outlet and navigation.
 * Inputs: None
 * Output: JSX.Element - Content container with Outlet for routes and Navigation component
 */
function MainContent() {
  const location = useLocation();
  const { setActiveTab } = useNavigation();

  // Sync the active tab with the current URL
  useEffect(() => {
    const tab = pathToTab[location.pathname] || pathToTab["/"];
    setActiveTab(tab as "home" |"discover" | "bots" | "positions" | "menu");
  }, [location.pathname, setActiveTab]);

  return (
    <div className="app-content">
      <Outlet />
      <Navigation />
    </div>
  );
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

/**
 * MainApp: Main application component that handles authentication flow and WebSocket connection.
 * Inputs: None
 * Output: JSX.Element - Application layout with AccountHeader and MainContent components
 */
function MainApp() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsDrawerVisible, setNotificationsDrawerVisible] = useState(false);
    const [notifications, setNotifications] = useState(mockData.notificationsList);
  // Show loading while auth is initializing
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  /**
   * handleLogout: Handles user logout action.
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Layout className="app-layout">
      <Content className="app-main">
        <Header
          isLoggedIn={isAuthenticated}
          user={user}
          onLogin={() => navigate('/login')}
          onLogout={handleLogout}
        />
        <MainContent />
      </Content>
      
      {/* Notifications Drawer */}
      <NotificationsDrawer
        visible={notificationsDrawerVisible}
        onClose={() => setNotificationsDrawerVisible(false)}
        notifications={notifications}
        onDismiss={handleDismiss}
        onClearAll={handleClearAll}
      />
      <FloatButton.Group shape="circle">
      <FloatButton badge={{ count: 12 }} icon={<CommentOutlined />} />
      {unreadCount > 0 && (<FloatButton badge={{ count: unreadCount, overflowCount: 999 }} icon={<BellOutlined />} onClick={() => setNotificationsDrawerVisible(true)} />)}
      <FloatButton.BackTop />
    </FloatButton.Group>
    </Layout>
  );
}

export default MainApp;