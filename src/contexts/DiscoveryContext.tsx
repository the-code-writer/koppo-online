import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useState,
} from "react";
import { Strategy } from "../types/strategy";
import { strategyApi } from "../services/strategiesAPIService";
import {
  tradingBotAPIService,
  ITradingBot,
  CreateTradingBotDTO,
  BotStatus,
  SortField,
  SortOrder,
  TradingBotConfig as ApiTradingBotConfig,
  BotRealtimePerformance,
  BotStatistics,
} from "../services/tradingBotAPIService";
import {
  botContractTradesAPI,
  BotContractTrade,
  ListTradesParams,
} from "../services/botContractTradesAPIService";
import {
  Notification,
  NotificationState,
  NotificationListParams,
  NotificationContextType,
  PusherNotificationData,
  ListNotificationsQuery,
  MarkAsReadRequest,
  BulkMarkAsReadRequest,
} from "../types/notifications";
import { NotificationAPIService } from "../services/notificationAPIService";
import { useDeviceUtils } from "../utils/deviceUtils";
import { envConfig } from "../config/env.config";
import { useNotification } from "../contexts/NotificationContext";
import { useOAuth } from "./OAuthContext";
import useSounds from "../hooks/useSounds";
import { useEventPublisher, useEventSubscription } from "../hooks/useEventManager";
// ==================== TYPES & INTERFACES ====================


// Types for activity feed items
interface ActivityItem {
  id: string;
  type: "win" | "loss";
  bot: string;
  amount: number;
  time: string;
  botUUID: string;
  heartbeat: {
    status: string;
    uptime: number;
    lastTradeAt: string;
    currentStake: number;
    botStatus: string;
    tradeCount: number;
    profit: number;
    memoryUsage: number;
    balance: number;
    winRate: number;
    consecutiveLosses: number;
    consecutiveWins: number;
  };
  timestamp: string;
}

// Types for event data
interface BotHeartbeatEvent {
  botUUID: string;
  heartbeat: {
    botName: string;
    status: string;
    uptime: number;
    lastTradeAt: string;
    currentStake: number;
    botStatus: string;
    tradeCount: number;
    profit: number;
    memoryUsage: number;
    balance: number;
    winRate: number;
    consecutiveLosses: number;
    consecutiveWins: number;
  };
  timestamp: string;
}

interface DiscoveryState {
  myBots: ApiTradingBotConfig[];
  freeBots: ApiTradingBotConfig[];
  premiumBots: ApiTradingBotConfig[];
  strategies: Strategy[];
  activityHistoryItems: BotContractTrade[];
  notifications: Notification[];
  livePerformance: any;
  loading: {
    myBots: boolean;
    freeBots: boolean;
    premiumBots: boolean;
    strategies: boolean;
    activityHistory: boolean;
    notifications: boolean;
  };
  error: string | null;
  lastUpdated: {
    myBots: Date | null;
    freeBots: Date | null;
    premiumBots: Date | null;
    strategies: Date | null;
    activityHistory: Date | null;
    notifications: Date | null;
  };
  botHeartbeat: any[];
  runningBots: number;
  sessionProfits: number;
  winRate: number;
  highestStreak: number;
  commissionsThisMonth: number;
  totalBots: number;
  totalStrategies: number;
}

type DiscoveryAction =
  | {
    type: "SET_LOADING";
    payload: { key: keyof DiscoveryState["loading"]; value: boolean };
  }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_MY_BOTS"; payload: ApiTradingBotConfig[] }
  | { type: "SET_FREE_BOTS"; payload: ApiTradingBotConfig[] }
  | { type: "SET_PREMIUM_BOTS"; payload: ApiTradingBotConfig[] }
  | { type: "SET_STRATEGIES"; payload: Strategy[] }
  | { type: "SET_ACTIVITY_HISTORY"; payload: BotContractTrade[] }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | {
    type: "UPDATE_NOTIFICATION";
    payload: { id: string; updates: Partial<Notification> };
  }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "MARK_NOTIFICATION_AS_READ"; payload: string }
  | { type: "MARK_ALL_NOTIFICATIONS_AS_READ" }
  | { type: "SHOW_BOT_SUMMARY"; payload: any }
  | { type: "UPDATE_BOT_REALTIME_STATS"; payload: any }
  | { type: "BOT_HEARTBEAT"; payload: any }
  | { type: "UPDATE_LIVE_PERFORMANCE"; payload: any }
  | { type: "REFRESH_ALL" };

interface DiscoveryContextType extends DiscoveryState {
  createBot: (botData: CreateTradingBotDTO) => Promise<ApiTradingBotConfig>;
  updateLivePerformance: (data: any) => void;
  refreshAll: () => Promise<void>;
  refreshPremiumBots: () => Promise<void>;
  refreshFreeBots: () => Promise<void>;
  refreshMyBots: () => Promise<void>;
  refreshStrategies: () => Promise<void>;
  refreshActivityHistory: () => Promise<void>;
  refreshNotifications: (params?: NotificationListParams) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  // Individual loading states for better UI control
  botHeartbeat: any[];
  runningBots: number;
  sessionProfits: number;
  winRate: number;
  highestStreak: number;
  commissionsThisMonth: number;
  totalBots: number;
  totalStrategies: number;

  premiumBotsLoading: boolean;
  freeBotsLoading: boolean;
  myBotsLoading: boolean;
  strategiesLoading: boolean;
  activityHistoryLoading: boolean;
  notificationsLoading: boolean;
  // Computed values
  unreadNotifications: Notification[];
  unreadCount: number;
}

// ==================== INITIAL STATE ====================

const initialState: DiscoveryState = {
  myBots: [],
  freeBots: [],
  premiumBots: [],
  strategies: [],
  activityHistoryItems: [],
  notifications: [],
  livePerformance: {},
  loading: {
    myBots: false,
    freeBots: false,
    premiumBots: false,
    strategies: false,
    activityHistory: false,
    notifications: false,
  },
  error: null,
  lastUpdated: {
    myBots: null,
    freeBots: null,
    premiumBots: null,
    strategies: null,
    activityHistory: null,
    notifications: null,
  },
  botHeartbeat: [],
  runningBots: 0,
  sessionProfits: 0,
  winRate: 0,
  highestStreak: 0, commissionsThisMonth: 0, totalBots: 3, totalStrategies: 12,
};

// ==================== REDUCER ====================

function discoveryReducer(
  state: DiscoveryState,
  action: DiscoveryAction,
): DiscoveryState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };

    case "SET_MY_BOTS":
      return {
        ...state,
        myBots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          myBots: new Date(),
        },
      };

    case "SET_FREE_BOTS":
      return {
        ...state,
        freeBots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          freeBots: new Date(),
        },
      };

    case "SET_PREMIUM_BOTS":
      return {
        ...state,
        premiumBots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          premiumBots: new Date(),
        },
      };

    case "SET_STRATEGIES":
      return {
        ...state,
        strategies: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          strategies: new Date(),
        },
      };

    case "SET_ACTIVITY_HISTORY":
      return {
        ...state,
        activityHistoryItems: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          activityHistory: new Date(),
        },
      };

    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          notifications: new Date(),
        },
      };

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        lastUpdated: {
          ...state.lastUpdated,
          notifications: new Date(),
        },
      };

    case "UPDATE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification._id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification,
        ),
        lastUpdated: {
          ...state.lastUpdated,
          notifications: new Date(),
        },
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification._id !== action.payload,
        ),
        lastUpdated: {
          ...state.lastUpdated,
          notifications: new Date(),
        },
      };

    case "MARK_NOTIFICATION_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification._id === action.payload
            ? { ...notification, read: true }
            : notification,
        ),
        lastUpdated: {
          ...state.lastUpdated,
          notifications: new Date(),
        },
      };

    case "MARK_ALL_NOTIFICATIONS_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
        lastUpdated: {
          ...state.lastUpdated,
          notifications: new Date(),
        },
      };

    case "UPDATE_LIVE_PERFORMANCE":
      return {
        ...state,
        livePerformance: {
          ...state.livePerformance,
          [action.payload.botUUID]: action.payload,
        },
      };

    case "REFRESH_ALL":
      return {
        ...state,
        lastUpdated: {
          myBots: null,
          freeBots: null,
          premiumBots: null,
          strategies: null,
          activityHistory: null,
          notifications: null,
        },
      };

    default:
      return state;
  }
}

// ==================== CONTEXT ====================

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(
  undefined,
);

// ==================== PROVIDER ====================

interface DiscoveryProviderProps {
  children: ReactNode;
}

export function DiscoveryProvider({ children }: DiscoveryProviderProps) {
  const [state, dispatch] = useReducer(discoveryReducer, initialState);
  const { openNotification } = useNotification();
  const { deviceId } = useDeviceUtils();
  const { user } = useOAuth();
  const { publish } = useEventPublisher();
  const { playInfo } = useSounds({ volume: 0.5 });


  // ==================== BOT HEARTBEAT ====================

  const [botHeartbeat, setBotHeartbeat] = useState<ActivityItem[]>([]);

  const [runningBots, setRunningBots] = useState(0);
  const [sessionProfits, setSessionProfits] = useState(0);
  const [winRate, setWinRate] = useState(0);

  const [highestStreak, setHighestStreak] = useState(0);
  const [commissionsThisMonth, setCommissionsThisMonth] = useState(0);
  const [totalBots, setTotalBots] = useState(0);
  const [totalStrategies, setTotalStrategies] = useState(0);

  // Format time relative to now
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  // Subscribe to BOT_HEARTBEAT events
  useEventSubscription("BOT_HEARTBEAT", (data: BotHeartbeatEvent) => {
    console.log("BOT_HEARTBEAT", [data]);

    if (!data.botUUID || !data.heartbeat) return;

    const botName = data.heartbeat.botName || `Bot ${data.botUUID.slice(0, 8)}`;
    const timestamp = new Date(data.timestamp).getTime();

    // Create activity entry if there's profit/loss data
    if (data.heartbeat.profit !== undefined && data.heartbeat.profit !== 0) {
      const activity: ActivityItem = {
        id: `${data.botUUID}-${timestamp}`,
        type: data.heartbeat.profit > 0 ? "win" : "loss",
        bot: botName,
        amount: Math.abs(data.heartbeat.profit),
        time: formatTime(timestamp),
        botUUID: data.botUUID,
        heartbeat: data.heartbeat,
        timestamp: data.timestamp,
      };

      setBotHeartbeat((prev) => {
        // Check if this botUUID already exists in the list
        const existingIndex = prev.findIndex(
          (item) => item.botUUID === data.botUUID,
        );

        if (existingIndex !== -1) {
          // Update existing bot entry
          const updated = [...prev];
          updated[existingIndex] = activity;
          // Move the updated item to the top
          return [
            activity,
            ...updated.filter((_, index) => index !== existingIndex),
          ].slice(0, 10);
        } else {
          // Add new bot entry
          return [activity, ...prev].slice(0, 10);
        }
      });
    }
  });

  // Clean up old activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBotHeartbeat((prev) => {
        const now = Date.now();
        // Remove activities that haven't been updated in 60 seconds
        const filtered = prev.filter((activity) => {
          const lastUpdate = new Date(activity.timestamp).getTime();
          const timeSinceUpdate = now - lastUpdate;
          return timeSinceUpdate < 60000; // Keep only items updated within last 60 seconds
        });

        // Update time displays for remaining activities
        return filtered.map((activity) => ({
          ...activity,
          time: formatTime(
            Date.now() - (parseInt(activity.id.split("-")[1]) || 0),
          ),
        }));
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    setRunningBots(botHeartbeat.length);
    setSessionProfits(botHeartbeat.reduce((sum: number, bot: ActivityItem) => sum + Math.abs(bot.amount), 0));
    setWinRate(botHeartbeat.reduce((sum: number, bot: ActivityItem) => sum + Math.abs(bot.heartbeat.winRate), 0) / botHeartbeat.length);

  }, [botHeartbeat]);

  // ==================== BOT HEARTBEAT ====================

  // ==================== API FUNCTIONS ====================

  const fetchMyBots = async (): Promise<void> => {
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "myBots", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await tradingBotAPIService.listMyBots({
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      if (response.success) {
        dispatch({ type: "SET_MY_BOTS", payload: response.data.bots });
        console.error("NEW BOT REFRESH:", response.data.bots);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch my bots";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error fetching my bots:", error);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "myBots", value: false },
      });
    }
  };

  const fetchFreeBots = async (): Promise<void> => {
    console.log("FETCH_FREE_BOTS");
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "freeBots", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await tradingBotAPIService.listBots({
        isPremium: false,
        isPublic: true,
        isActive: true,
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      if (response.success) {
        dispatch({ type: "SET_FREE_BOTS", payload: response.data.bots });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch free bots";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error fetching free bots:", error);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "freeBots", value: false },
      });
    }
  };

  const fetchPremiumBots = async (): Promise<void> => {
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "premiumBots", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await tradingBotAPIService.listBots({
        isPremium: true,
        isPublic: true,
        isActive: true,
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      if (response.success) {
        dispatch({ type: "SET_PREMIUM_BOTS", payload: response.data.bots });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch premium bots";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error fetching premium bots:", error);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "premiumBots", value: false },
      });
    }
  };

  const fetchStrategies = async (): Promise<void> => {
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "strategies", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await strategyApi.getStrategies(
        { isPublic: true, isActive: true },
        { page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" },
      );

      if (response.success) {
        dispatch({ type: "SET_STRATEGIES", payload: response.data.strategies });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch strategies";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error fetching strategies:", error);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "strategies", value: false },
      });
    }
  };

  const fetchActivityHistory = async (): Promise<void> => {
    try {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "activityHistory", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await botContractTradesAPI.listTrades({
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 50,
      });

      if (response.success) {
        dispatch({
          type: "SET_ACTIVITY_HISTORY",
          payload: response.data.trades,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch activity history";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error fetching activity history:", error);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "activityHistory", value: false },
      });
    }
  };

  // ==================== CREATE BOT ====================

  const createBot = async (
    botData: CreateTradingBotDTO,
  ): Promise<ApiTradingBotConfig> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await tradingBotAPIService.createBot(botData);

      if (response.success) {
        // Refresh my bots to include the new bot
        await fetchMyBots();
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create bot";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error creating bot:", error);
      throw error;
    }
  };

  // ==================== NOTIFICATION API FUNCTIONS ====================

  // Initialize the notification service
  const notificationService = new NotificationAPIService(
    import.meta.env.VITE_API_BASE_URL || "https://api.koppo.app",
  );

  // Helper function to get current user ID
  const getCurrentUserId = (): string | undefined => {
    return user?.uuid;
  };

  // Helper function to get device ID
  const getDeviceId = (): string | undefined => {
    return deviceId?.deviceId;
  };

  // Helper function to convert colons to hyphens and clean device ID
  const sanitizeId = (deviceId: string | undefined): string => {
    if (!deviceId) return "unknown-device";
    // Replace all colons with hyphens and remove trailing colons/hyphens
    return deviceId.replace(/::/g, "-").replace(/:+$/, "").replace(/-$/, "");
  };

  const fetchNotifications = async (
    params: NotificationListParams = {},
  ): Promise<void> => {
    try {
      if (!user?.uuid) {
        throw new Error("Cannot fetch notifications without a logged-in user");
      }
      dispatch({
        type: "SET_LOADING",
        payload: { key: "notifications", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const query: ListNotificationsQuery = {
        userUUID: user.uuid,
        page: params.page || 1,
        limit: params.limit || 50,
        type: params.type,
        category: params.category,
        priority: params.priority,
        read: params.read,
        sortBy: params.sortBy || "createdAt",
        sortOrder: params.sortOrder || "desc",
        startDate: params.startDate,
        endDate: params.endDate,
      };

      const response = await notificationService.listNotifications(query);

      if (response.success && response.data) {
        dispatch({
          type: "SET_NOTIFICATIONS",
          payload: response.data.notifications,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error fetching notifications:", error);
    } finally {
      dispatch({
        type: "SET_LOADING",
        payload: { key: "notifications", value: false },
      });
    }
  };

  const markNotificationAsRead = async (
    notificationId: string,
  ): Promise<void> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });

      const request: MarkAsReadRequest = { deviceId: getDeviceId() };

      const response = await notificationService.markAsRead(
        notificationId,
        request,
      );

      if (response.success && response.data) {
        dispatch({
          type: "UPDATE_NOTIFICATION",
          payload: {
            id: notificationId,
            updates: { read: true },
          } as any,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error marking notification as read:", error);
      throw error;
    }
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await notificationService.markAllAsRead(getDeviceId());

      if (response.success) {
        dispatch({ type: "MARK_ALL_NOTIFICATIONS_AS_READ" });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId: string): Promise<void> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });

      const response =
        await notificationService.deleteNotification(notificationId);

      if (response.success) {
        dispatch({ type: "REMOVE_NOTIFICATION", payload: notificationId });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete notification";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error deleting notification:", error);
      throw error;
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });

      // Get all notifications and delete them one by one
      const { notifications } = state;
      const deletePromises = notifications.map((notification) =>
        deleteNotification(notification._id),
      );

      await Promise.all(deletePromises);

      dispatch({ type: "SET_NOTIFICATIONS", payload: [] });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to clear all notifications";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      console.error("Error clearing all notifications:", error);
      throw error;
    }
  };

  // ==================== LIVE PERFORMANCE FUNCTIONS ====================

  const updateLivePerformance = (data: any) => {
    dispatch({
      type: "UPDATE_LIVE_PERFORMANCE",
      payload: data,
    });
  };

  // ==================== REFRESH FUNCTIONS ====================

  const refreshAll = async (): Promise<void> => {
    dispatch({ type: "REFRESH_ALL" });
    await Promise.all([
      fetchMyBots(),
      fetchFreeBots(),
      fetchPremiumBots(),
      fetchStrategies(),
      fetchActivityHistory(),
      fetchNotifications(),
    ]);
  };

  const refreshPremiumBots = fetchPremiumBots;
  const refreshFreeBots = fetchFreeBots;
  const refreshMyBots = fetchMyBots;
  const refreshStrategies = fetchStrategies;
  const refreshActivityHistory = fetchActivityHistory;
  const refreshNotifications = fetchNotifications;

  // ==================== PUSHER INTEGRATION ====================

  useEffect(() => {
    // Only set up Pusher listeners if we're in a browser environment
    if (typeof window === "undefined") return;

    // Check if Pusher is available
    if (!(window as any).Pusher) {
      console.warn(
        "Pusher library not found. Real-time updates will not be available.",
      );
      return;
    }

    const subscribedChannels: Array<{ name: string; description: string }> = [];

    let pusherInstance: any = null;

    try {
      // Initialize Pusher with simple configuration
      pusherInstance = new (window as any).Pusher(envConfig.VITE_PUSHER_KEY, {
        cluster: envConfig.VITE_PUSHER_CLUSTER,
      });

      if (user) {
        console.warn("Pusher channels being subscribed to:");

        // Subscribe to channels
        subscribedChannels.push(
          {
            name: "global-notifications",
            description: "Global Notifications Channel",
          },
          {
            name: "system-notifications",
            description: "System Notifications Channel",
          },
          {
            name: `bot-notifications-${sanitizeId(getCurrentUserId())}`,
            description: "Bot Updates Channel",
          },
          {
            name: `device-notifications-${sanitizeId(getDeviceId())}`,
            description: "Device Notifications Channel",
          },
          {
            name: `user-notifications-${sanitizeId(getCurrentUserId())}`,
            description: "User ID Notifications Channel",
          },
        );

        console.warn({ channels: subscribedChannels, user });

        subscribedChannels.forEach((channelConfig, index) => {
          const channel = pusherInstance.subscribe(channelConfig.name);

          console.warn(
            `${index + 1}. ${channelConfig.description}:`,
            channelConfig.name,
          );

          // Bind to all events on this channel
          channel.bind_global((eventName: string, data: any) => {
            console.log(
              `Pusher event received on ${channelConfig.name}:`,
              eventName,
              data,
            );

            // Handle notification events
            if (eventName.includes("notification")) {
              if (
                eventName === "notification" ||
                eventName.includes("created")
              ) {
                dispatch({ type: "ADD_NOTIFICATION", payload: data });
                publish("ADD_NOTIFICATION", data);
                playInfo();

                openNotification(data.title, data.message, {
                  type: "emoji-info",
                });
              } else if (eventName.includes("updated")) {
                const payload: any = {
                  id: data._id,
                  updates: { read: data.read, updatedAt: data.updatedAt },
                };
                dispatch({
                  type: "UPDATE_NOTIFICATION",
                  payload,
                });
                publish("UPDATE_NOTIFICATION", payload);
              } else if (eventName.includes("deleted")) {
                dispatch({ type: "REMOVE_NOTIFICATION", payload: data.id });
                publish("REMOVE_NOTIFICATION", data.id);
              }
            }

            // Handle bot events
            if (eventName.includes("bot-session-summary")) {
              publish("SHOW_BOT_SUMMARY", data);
            }

            // Handle bot heartbeat events
            if (eventName.includes("bot-heartbeat")) {
              publish("BOT_HEARTBEAT", data);
            }

            // Handle bot realtime events
            if (eventName.includes("bot-realtime-performance")) {
              publish("UPDATE_BOT_REALTIME_STATS", data);
            }
          });
        });

        console.warn("Pusher listeners set up for DiscoveryContext");
      }
    } catch (error) {
      console.error(error);
    }
    // Cleanup function
    return () => {
      subscribedChannels.forEach((channelConfig) => {
        if (pusherInstance) {
          pusherInstance.unsubscribe(channelConfig.name);
        }
      });
      console.warn("Pusher listeners cleaned up");
    };
  }, [user]); // Empty dependency array means this runs once on mount

  // ==================== INITIAL DATA FETCH ====================

  useEffect(() => {
    // Fetch initial data when component mounts
    refreshAll();
  }, []);

  // ==================== CONTEXT VALUE ====================

  const contextValue: DiscoveryContextType = {
    ...state,
    createBot,
    updateLivePerformance,
    refreshAll,
    refreshPremiumBots,
    refreshFreeBots,
    refreshMyBots,
    refreshStrategies,
    refreshActivityHistory,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    fetchNotifications,
    clearAllNotifications,
    botHeartbeat,
    winRate,
    sessionProfits,
    runningBots,
    highestStreak, commissionsThisMonth, totalBots, totalStrategies,
    // Individual loading states for better UI control
    premiumBotsLoading: state.loading.premiumBots,
    freeBotsLoading: state.loading.freeBots,
    myBotsLoading: state.loading.myBots,
    strategiesLoading: state.loading.strategies,
    activityHistoryLoading: state.loading.activityHistory,
    notificationsLoading: state.loading.notifications,
    // Computed values
    unreadNotifications: state.notifications.filter((n) => !n.read),
    unreadCount: state.notifications.filter((n) => !n.read).length,
  };

  return (
    <DiscoveryContext.Provider value={contextValue}>
      {children}
    </DiscoveryContext.Provider>
  );
}

// ==================== HOOK ====================

export function useDiscoveryContext(): DiscoveryContextType {
  const context = useContext(DiscoveryContext);
  if (context === undefined) {
    throw new Error(
      "useDiscoveryContext must be used within a DiscoveryProvider",
    );
  }
  return context;
}

// ==================== EXPORTS ====================

export { DiscoveryContext };
