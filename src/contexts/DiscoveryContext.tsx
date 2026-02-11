import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { strategyApi, Strategy } from '../services/strategiesAPIService';
import { tradingBotAPIService, ITradingBot, CreateTradingBotDTO, BotStatus, SortField, SortOrder } from '../services/tradingBotAPIService';
import { botContractTradesAPI, BotContractTrade, ListTradesParams } from '../services/botContractTradesAPIService';
import { pusherService, PusherChannelConfig } from '../services/pusherService';

// ==================== TYPES & INTERFACES ====================

interface DiscoveryState {
  myBots: ITradingBot[];
  freeBots: ITradingBot[];
  premiumBots: ITradingBot[];
  strategies: Strategy[];
  activityHistoryItems: BotContractTrade[];
  loading: {
    myBots: boolean;
    freeBots: boolean;
    premiumBots: boolean;
    strategies: boolean;
    activityHistory: boolean;
  };
  error: string | null;
  lastUpdated: {
    myBots: Date | null;
    freeBots: Date | null;
    premiumBots: Date | null;
    strategies: Date | null;
    activityHistory: Date | null;
  };
}

type DiscoveryAction =
  | { type: 'SET_LOADING'; payload: { key: keyof DiscoveryState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MY_BOTS'; payload: ITradingBot[] }
  | { type: 'SET_FREE_BOTS'; payload: ITradingBot[] }
  | { type: 'SET_PREMIUM_BOTS'; payload: ITradingBot[] }
  | { type: 'SET_STRATEGIES'; payload: Strategy[] }
  | { type: 'SET_ACTIVITY_HISTORY'; payload: BotContractTrade[] }
  | { type: 'ADD_TRADE_TO_HISTORY'; payload: BotContractTrade }
  | { type: 'UPDATE_BOT_IN_LIST'; payload: ITradingBot }
  | { type: 'REFRESH_ALL' };

interface DiscoveryContextType extends DiscoveryState {
  createBot: (botData: CreateTradingBotDTO) => Promise<ITradingBot>;
  refreshAll: () => Promise<void>;
  refreshPremiumBots: () => Promise<void>;
  refreshFreeBots: () => Promise<void>;
  refreshMyBots: () => Promise<void>;
  refreshStrategies: () => Promise<void>;
  refreshActivityHistory: () => Promise<void>;
  // Individual loading states for better UI control
  premiumBotsLoading: boolean;
  freeBotsLoading: boolean;
  myBotsLoading: boolean;
  strategiesLoading: boolean;
  activityHistoryLoading: boolean;
}

// ==================== INITIAL STATE ====================

const initialState: DiscoveryState = {
  myBots: [],
  freeBots: [],
  premiumBots: [],
  strategies: [],
  activityHistoryItems: [],
  loading: {
    myBots: false,
    freeBots: false,
    premiumBots: false,
    strategies: false,
    activityHistory: false,
  },
  error: null,
  lastUpdated: {
    myBots: null,
    freeBots: null,
    premiumBots: null,
    strategies: null,
    activityHistory: null,
  },
};

// ==================== REDUCER ====================

function discoveryReducer(state: DiscoveryState, action: DiscoveryAction): DiscoveryState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_MY_BOTS':
      return {
        ...state,
        myBots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          myBots: new Date(),
        },
      };

    case 'SET_FREE_BOTS':
      return {
        ...state,
        freeBots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          freeBots: new Date(),
        },
      };

    case 'SET_PREMIUM_BOTS':
      return {
        ...state,
        premiumBots: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          premiumBots: new Date(),
        },
      };

    case 'SET_STRATEGIES':
      return {
        ...state,
        strategies: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          strategies: new Date(),
        },
      };

    case 'SET_ACTIVITY_HISTORY':
      return {
        ...state,
        activityHistoryItems: action.payload,
        lastUpdated: {
          ...state.lastUpdated,
          activityHistory: new Date(),
        },
      };

    case 'ADD_TRADE_TO_HISTORY':
      return {
        ...state,
        activityHistoryItems: [action.payload, ...state.activityHistoryItems],
        lastUpdated: {
          ...state.lastUpdated,
          activityHistory: new Date(),
        },
      };

    case 'UPDATE_BOT_IN_LIST':
      const updateBotInList = (bots: ITradingBot[]) => bots.map(bot => (bot.botUUID === action.payload.botUUID ? action.payload : bot));
      return {
        ...state,
        myBots: updateBotInList(state.myBots),
        freeBots: updateBotInList(state.freeBots),
        premiumBots: updateBotInList(state.premiumBots),
      };

    case 'REFRESH_ALL':
      return {
        ...state,
        lastUpdated: {
          myBots: null,
          freeBots: null,
          premiumBots: null,
          strategies: null,
          activityHistory: null,
        },
      };

    default:
      return state;
  }
}

// ==================== CONTEXT ====================

const DiscoveryContext = createContext<DiscoveryContextType | undefined>(undefined);

// ==================== PROVIDER ====================

interface DiscoveryProviderProps {
  children: ReactNode;
}

export function DiscoveryProvider({ children }: DiscoveryProviderProps) {
  const [state, dispatch] = useReducer(discoveryReducer, initialState);

  // ==================== API FUNCTIONS ====================

  const fetchMyBots = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'myBots', value: true } });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await tradingBotAPIService.listMyBots({
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      if (response.success) {
        dispatch({ type: 'SET_MY_BOTS', payload: response.data.bots });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch my bots';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error fetching my bots:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'myBots', value: false } });
    }
  };

  const fetchFreeBots = async (): Promise<void> => {
    console.log("FETCH_FREE_BOTS");
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'freeBots', value: true } });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await tradingBotAPIService.listBots({
        isPremium: false,
        isPublic: true,
        isActive: true,
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      if (response.success) {
        dispatch({ type: 'SET_FREE_BOTS', payload: response.data.bots });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch free bots';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error fetching free bots:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'freeBots', value: false } });
    }
  };

  const fetchPremiumBots = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'premiumBots', value: true } });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await tradingBotAPIService.listBots({
        isPremium: true,
        isPublic: true,
        isActive: true,
        sortBy: SortField.CREATED_AT,
        sortOrder: SortOrder.DESC,
      });

      if (response.success) {
        dispatch({ type: 'SET_PREMIUM_BOTS', payload: response.data.bots });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch premium bots';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error fetching premium bots:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'premiumBots', value: false } });
    }
  };

  const fetchStrategies = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'strategies', value: true } });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await strategyApi.getStrategies(
        { isPublic: true, isActive: true },
        { page: 1, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }
      );

      if (response.success) {
        dispatch({ type: 'SET_STRATEGIES', payload: response.data.strategies });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch strategies';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error fetching strategies:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'strategies', value: false } });
    }
  };

  const fetchActivityHistory = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'activityHistory', value: true } });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await botContractTradesAPI.listTrades({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50,
      });

      if (response.success) {
        dispatch({ type: 'SET_ACTIVITY_HISTORY', payload: response.data.trades });
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch activity history';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error fetching activity history:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'activityHistory', value: false } });
    }
  };

  // ==================== CREATE BOT ====================

  const createBot = async (botData: CreateTradingBotDTO): Promise<ITradingBot> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await tradingBotAPIService.createBot(botData);

      if (response.success) {
        // Refresh my bots to include the new bot
        await fetchMyBots();
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create bot';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error creating bot:', error);
      throw error;
    }
  };

  // ==================== REFRESH FUNCTIONS ====================

  const refreshAll = async (): Promise<void> => {
    dispatch({ type: 'REFRESH_ALL' });
    await Promise.all([
      fetchMyBots(),
      fetchFreeBots(),
      fetchPremiumBots(),
      fetchStrategies(),
      fetchActivityHistory(),
    ]);
  };

  const refreshPremiumBots = fetchPremiumBots;
  const refreshFreeBots = fetchFreeBots;
  const refreshMyBots = fetchMyBots;
  const refreshStrategies = fetchStrategies;
  const refreshActivityHistory = fetchActivityHistory;

  // ==================== PUSHER INTEGRATION ====================

  useEffect(() => {
    // Only set up Pusher listeners if we're in a browser environment
    if (typeof window === 'undefined') return;

    const setupPusherListeners = () => {
      // Check if Pusher is connected
      if (!pusherService.isConnected()) {
        console.warn('Pusher is not connected. Real-time updates will not be available.');
        return;
      }

      // Channel configuration for bot updates
      const botUpdatesChannel: PusherChannelConfig = {
        channelName: 'bot-updates',
        events: {
          // When a new trade is executed
          'trade-executed': (data: BotContractTrade) => {
            console.log('New trade received:', data);
            dispatch({ type: 'ADD_TRADE_TO_HISTORY', payload: data });
          },
          
          // When a bot is updated (status change, performance update, etc.)
          'bot-updated': (data: ITradingBot) => {
            console.log('Bot updated:', data);
            dispatch({ type: 'UPDATE_BOT_IN_LIST', payload: data });
          },
          
          // When a bot is created
          'bot-created': (data: ITradingBot) => {
            console.log('Bot created:', data);
            // Refresh my bots to include the new bot
            fetchMyBots();
          },
          
          // When a bot is deleted
          'bot-deleted': (data: { botUUID: string }) => {
            console.log('Bot deleted:', data);
            // Refresh my bots to remove the deleted bot
            fetchMyBots();
          },
          
          // When a strategy is updated
          'strategy-updated': (data: Strategy) => {
            console.log('Strategy updated:', data);
            // Refresh strategies to get the latest data
            fetchStrategies();
          },
        },
      };

      // Channel configuration for user-specific updates
      const userUpdatesChannel: PusherChannelConfig = {
        channelName: `user-updates-${getCurrentUserId()}`, // Dynamic user channel
        events: {
          // User-specific trade updates
          'user-trade-executed': (data: BotContractTrade) => {
            console.log('User trade received:', data);
            dispatch({ type: 'ADD_TRADE_TO_HISTORY', payload: data });
          },
          
          // User-specific bot updates
          'user-bot-updated': (data: ITradingBot) => {
            console.log('User bot updated:', data);
            dispatch({ type: 'UPDATE_BOT_IN_LIST', payload: data });
          },
        },
      };

      // Subscribe to channels
      pusherService.subscribeToChannel(botUpdatesChannel);
      pusherService.subscribeToChannel(userUpdatesChannel);

      console.log('Pusher listeners set up for DiscoveryContext');
    };

    // Helper function to get current user ID (this would come from your auth context)
    const getCurrentUserId = (): string => {
      // This is a placeholder - you should get the actual user ID from your auth context
      // For now, return a default or get it from localStorage/auth context
      return localStorage.getItem('userId') || 'anonymous';
    };

    // Set up listeners
    setupPusherListeners();

    // Cleanup function
    return () => {
      // Unsubscribe from channels when component unmounts
      pusherService.unsubscribeFromChannel('bot-updates');
      pusherService.unsubscribeFromChannel(`user-updates-${getCurrentUserId()}`);
      console.log('Pusher listeners cleaned up');
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
    // Individual loading states for better UI control
    premiumBotsLoading: state.loading.premiumBots,
    freeBotsLoading: state.loading.freeBots,
    myBotsLoading: state.loading.myBots,
    strategiesLoading: state.loading.strategies,
    activityHistoryLoading: state.loading.activityHistory,
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
    throw new Error('useDiscoveryContext must be used within a DiscoveryProvider');
  }
  return context;
}

// ==================== EXPORTS ====================

export { DiscoveryContext };
