import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { strategyApi, Strategy } from "../services/strategiesAPIService";
import {
  tradingBotAPIService,
  ITradingBot,
  CreateTradingBotDTO,
  BotStatus,
  SortField,
  SortOrder,
} from "../services/tradingBotAPIService";
import {
  botContractTradesAPI,
  BotContractTrade,
  ListTradesParams,
} from "../services/botContractTradesAPIService";
import { pusherService, PusherChannelConfig } from "../services/pusherService";
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
import { useNotificationPopup } from "../components/NotificationPopup";
import { useNotification } from "../contexts/NotificationContext";
import { useOAuth } from "./OAuthContext";
import useSounds from '../hooks/useSounds';
// ==================== TYPES & INTERFACES ====================

interface DiscoveryState {
  myBots: ITradingBot[];
  freeBots: ITradingBot[];
  premiumBots: ITradingBot[];
  strategies: Strategy[];
  activityHistoryItems: BotContractTrade[];
  notifications: Notification[];
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
}

type DiscoveryAction =
  | {
      type: "SET_LOADING";
      payload: { key: keyof DiscoveryState["loading"]; value: boolean };
    }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_MY_BOTS"; payload: ITradingBot[] }
  | { type: "SET_FREE_BOTS"; payload: ITradingBot[] }
  | { type: "SET_PREMIUM_BOTS"; payload: ITradingBot[] }
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
  | { type: "ADD_TRADE_TO_HISTORY"; payload: BotContractTrade }
  | { type: "UPDATE_BOT_IN_LIST"; payload: ITradingBot }
  | { type: "REFRESH_ALL" };

interface DiscoveryContextType extends DiscoveryState {
  createBot: (botData: CreateTradingBotDTO) => Promise<ITradingBot>;
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
  clearAllNotifications: () => Promise<void>;
  // Individual loading states for better UI control
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

    case "ADD_TRADE_TO_HISTORY":
      return {
        ...state,
        activityHistoryItems: [action.payload, ...state.activityHistoryItems],
        lastUpdated: {
          ...state.lastUpdated,
          activityHistory: new Date(),
        },
      };

    case "UPDATE_BOT_IN_LIST":
      const updateBotInList = (bots: ITradingBot[]) =>
        bots.map((bot) =>
          bot.botUUID === action.payload.botUUID ? action.payload : bot,
        );
      return {
        ...state,
        myBots: updateBotInList(state.myBots),
        freeBots: updateBotInList(state.freeBots),
        premiumBots: updateBotInList(state.premiumBots),
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
  const { playInfo } = useSounds({ volume: 0.5 });
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
  ): Promise<ITradingBot> => {
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
      dispatch({
        type: "SET_LOADING",
        payload: { key: "notifications", value: true },
      });
      dispatch({ type: "SET_ERROR", payload: null });

      const query: ListNotificationsQuery = {
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

    // Initialize Pusher with simple configuration
    const pusher = new (window as any).Pusher(envConfig.VITE_PUSHER_KEY, {
      cluster: envConfig.VITE_PUSHER_CLUSTER,
    });

    console.warn("Pusher channels being subscribed to:");

    // Subscribe to channels
    const channels = [
      { name: "global-notifications", description: "Global Notifications Channel" },
      { name: "system-notifications", description: "System Notifications Channel" },
      {
        name: `bot-notifications-${sanitizeId(getCurrentUserId())}`,
        description: "User Updates Channel",
      },
      {
        name: `device-notifications-${sanitizeId(getDeviceId())}`,
        description: "Device Notifications Channel",
      },
      {
        name: `user-notifications-${sanitizeId(getCurrentUserId())}`,
        description: "User ID Notifications Channel",
      },
    ];

    console.warn({ channels });

    channels.forEach((channelConfig, index) => {
      const channel = pusher.subscribe(channelConfig.name);

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
          if (eventName === "notification" || eventName.includes("created")) {
            dispatch({ type: "ADD_NOTIFICATION", payload: data });

            playInfo();

            openNotification(data.title, data.message, {
              type: "emoji-info",
            });

          } else if (eventName.includes("updated")) {
            dispatch({
              type: "UPDATE_NOTIFICATION",
              payload: {
                id: data._id,
                updates: { read: data.read, updatedAt: data.updatedAt },
              } as any,
            });
          } else if (eventName.includes("deleted")) {
            dispatch({ type: "REMOVE_NOTIFICATION", payload: data.id });
          }
        }

        // Handle trade events
        if (eventName.includes("trade")) {
          dispatch({ type: "ADD_TRADE_TO_HISTORY", payload: data });
        }

        // Handle bot events
        if (eventName.includes("bot")) {
          dispatch({ type: "UPDATE_BOT_IN_LIST", payload: data });
        }
      });
    });

    console.warn("Pusher listeners set up for DiscoveryContext");

    // Cleanup function
    return () => {
      channels.forEach((channelConfig) => {
        pusher.unsubscribe(channelConfig.name);
      });
      console.warn("Pusher listeners cleaned up");
    };
  }, []); // Empty dependency array means this runs once on mount

  // ==================== INITIAL DATA FETCH ====================

  useEffect(() => {
    // Fetch initial data when component mounts
    refreshAll();
  }, []);

  // ==================== CONTEXT VALUE ====================

  const contextValue: DiscoveryContextType = {
    ...state,
    createBot,
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
    clearAllNotifications,
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
