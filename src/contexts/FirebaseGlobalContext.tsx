import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged
} from 'firebase/auth';

// Types for global context data

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// Global state interface
interface FirebaseGlobalState {
  user: User | null;
  userLoading: boolean;
  userError: string | null;
  
  bots: Bot[];
  botsLoading: boolean;
  botsError: string | null;
  
  strategies: Strategy[];
  strategiesLoading: boolean;
  strategiesError: string | null;
  
  tradeHistory: TradeHistory[];
  tradeHistoryLoading: boolean;
  tradeHistoryError: string | null;
  
  globalLoading: boolean;
  globalError: string | null;
}

// Context type interface
export interface FirebaseGlobalContextType {
  // Direct access to state properties
  user: User | null;
  userLoading: boolean;
  userError: string | null;
  
  globalLoading: boolean;
  globalError: string | null;
  
  // Actions

  updateUser: (data: Partial<User>) => Promise<void>;
  uploadFile: (file: File, path: string) => Promise<string>;
  downloadFile: (path: string) => Promise<string>;
}

// Create context
const FirebaseGlobalContext = createContext<FirebaseGlobalContextType | undefined>(undefined);

// Mock user for development
const getMockUser = (): User => ({
  uid: 'mock_user_123',
  email: 'mock@example.com',
  displayName: 'Mock User',
  createdAt: new Date(),
  lastLoginAt: new Date(),
});

// Provider component
export function FirebaseGlobalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FirebaseGlobalState>({
    user: null,
    userLoading: false,
    userError: null,
    
    globalLoading: false,
    globalError: null,
  });

  // Initialize Firebase
  const db = getFirestore();
  const auth = getAuth();

  // Initialize Firebase listeners
  useEffect(() => {
    // Get current user (either Firebase user or mock user)
    const currentUser = auth.currentUser || getMockUser();
    
    if (!currentUser) {
      console.log('No user available, skipping Firebase listeners');
      return;
    }

    console.log('Setting up Firebase listeners for user:', currentUser.uid);

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setState(prev => ({ ...prev, userLoading: true }));
      
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime) : new Date(),
          lastLoginAt: new Date(),
        };
        
        // Save user to Firestore
        await setDoc(doc(db, 'users', firebaseUser.uid), user);
        setState(prev => ({ 
          ...prev, 
          user, 
          userLoading: false,
          userError: null 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          user: null, 
          userLoading: false,
          userError: null 
        }));
      }
    });

    // Listen for bots changes - USER SCOPED
    const unsubscribeBots = onSnapshot(
      query(collection(db, 'bots'), where('userId', '==', currentUser.uid)),
      (snapshot) => {
        setState(prev => ({ ...prev, botsLoading: true }));
        
        const bots: any[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data) {
            // Transform TradingBot data to match Bots2 component expectations
            const transformedBot = {
              _id: doc.id,
              id: doc.id,
              userId: data.userId,
              // Top-level properties expected by Bots2 component
              botName: data.configuration?.general?.botName || 'Unnamed Bot',
              marketName: data.configuration?.general?.market || 'Unknown Market',
              contractType: data.configuration?.general?.tradeType || 'Unknown',
              strategyName: data.configuration?.strategy?.name || 'Default Strategy',
              startedAt: data.createdAt?.toDate() || new Date(),
              netProfit: data.performance?.currentProfit || 0,
              baseStake: data.configuration?.amounts?.amount?.value || 0,
              numberOfWins: data.stats?.numberOfWins || 0,
              numberOfLosses: data.stats?.numberOfLosses || 0,
              state: data.status === 'ACTIVE' ? 'PLAY' : 
                     data.status === 'PAUSED' ? 'PAUSE' : 
                     data.status === 'STOPPED' ? 'STOP' : 'STOP',
              botMetadata: data.metadata || {},
              isActive: data.isActive || false,
              totalTrades: data.stats?.totalTrades || 0,
              winRate: data.stats?.winRate || 0,
              averageProfit: data.stats?.averageProfit || 0,
              maxDrawdown: data.performance?.maxDrawdown || 0,
              lastRunAt: data.timing?.lastRunAt?.toDate() || new Date(),
              runningTime: data.timing?.runningTime || 0,
              // Keep original structure for reference
              configuration: data.configuration,
              performance: data.performance,
              session: data.session,
              stats: data.stats,
              timing: data.timing,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              version: data.version,
              metadata: data.metadata
            };
            bots.push(transformedBot);
          }
        });
        
        setState(prev => ({ 
          ...prev, 
          bots, 
          botsLoading: false,
          botsError: null 
        }));
        console.log(`Fetched ${bots.length} bots for user ${currentUser.uid}`);
      },
      (error) => {
        console.error('Error fetching bots for user', currentUser.uid, ':', error);
        setState(prev => ({ 
          ...prev, 
          botsLoading: false, 
          botsError: error.message 
        }));
      }
    );

    // Cleanup listeners
    return () => {
      unsubscribeAuth();
      unsubscribeBots();
    };
  }, [auth, db]); // Include auth and db dependencies

  // Create a new bot
  const createBot = useCallback(async (botData: any) => {
    try {
      setState(prev => ({ ...prev, botsLoading: true }));
      
      // Get current user (either Firebase user or mock user)
      const currentUser = auth.currentUser || getMockUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Generate bot ID
      const botId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create bot in the format expected by Bots2 component
      let newBot;
      
      if (botData.configuration) {
        // If using TradingBot structure, create using utility function
        newBot = createTradingBot(currentUser.uid, botId, botData.configuration);
      } else {
        // If using simplified structure (from Bots2 component), create full TradingBot structure
        const config: any = {
          general: {
            botName: botData.botName || 'New Bot',
            botDescription: botData.botDescription || '',
            tradeType: botData.contractType === 'Rise/Fall' ? TradeType.RISE : TradeType.FALL,
            market: botData.marketName || MarketType.VOLATILITY_100_1S
          },
          basicSettings: {
            number_of_trades: 30,
            maximum_stake: 1000,
            compound_stake: false
          },
          amounts: {
            amount: { type: AmountType.FIXED, value: botData.baseStake || 10 },
            profit_threshold: { type: AmountType.FIXED, value: 50 },
            loss_threshold: { type: AmountType.FIXED, value: 25 }
          },
          strategy: {
            name: botData.strategyName || 'Default Strategy',
            id: `strategy_${Date.now()}`,
            parameters: {},
            version: '1.0.0'
          },
          recovery: {
            risk_steps: createDefaultRiskSteps()
          },
          schedules: {
            bot_schedules: []
          },
          execution: {
            recovery_type: RecoveryType.OFF,
            maxConcurrentTrades: 3,
            riskLevel: RiskLevel.MEDIUM,
            cooldown_period: '0',
            stop_on_loss_streak: false,
            auto_restart: false,
            maxDrawdown: 150
          }
        };
        
        newBot = createTradingBot(currentUser.uid, botId, config);
      }

      // Save to Firestore
      const botDoc = doc(collection(db, 'bots'), botId);
      await setDoc(botDoc, {
        ...newBot,
        createdAt: Timestamp.fromDate(newBot.createdAt),
        updatedAt: Timestamp.fromDate(newBot.updatedAt),
        userId: currentUser.uid
      });

      console.log('Bot created successfully:', botId);
      return botId;
    } catch (error: any) {
      console.error('Error creating bot:', error);
      setState(prev => ({ ...prev, botsError: error.message }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, botsLoading: false }));
    }
  }, [db, auth]);

  // Context value with all actions
  const contextValue: FirebaseGlobalContextType = {
    // Direct access to state properties
    user: state.user,
    userLoading: state.userLoading,
    userError: state.userError,
    
    globalLoading: state.globalLoading,
    globalError: state.globalError,
    
    // Actions
    createBot,
    updateBot: async (id: string, updates: Partial<Bot>) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      await updateDoc(doc(db, 'bots', id), updates);
    },
    deleteBot: async (id: string) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      await deleteDoc(doc(db, 'bots', id));
    },
    getBots: async () => {
      return state.bots;
    },
    
    createStrategy: async (strategyData: Partial<Strategy>) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const docRef = await setDoc(doc(db, 'strategies', `strategy_${Date.now()}`), {
        ...strategyData,
        userId: auth.currentUser.uid,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      });
      return docRef.toString();
    },
    updateStrategy: async (id: string, updates: Partial<Strategy>) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      await updateDoc(doc(db, 'strategies', id), updates);
    },
    deleteStrategy: async (id: string) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      await deleteDoc(doc(db, 'strategies', id));
    },
    getStrategies: async () => {
      return state.strategies;
    },
    
    addTradeToHistory: async (tradeData: Omit<TradeHistory, 'id'>) => {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const docRef = await setDoc(doc(db, 'tradeHistory', `trade_${Date.now()}`), {
        ...tradeData,
        userId: auth.currentUser.uid,
        timestamp: Timestamp.fromDate(tradeData.timestamp)
      });
      return docRef.toString();
    },
    getTradeHistory: async () => {
      return state.tradeHistory;
    },
    
    updateUser: async (data: Partial<User>) => {
      if (!auth.currentUser) return;
      await updateDoc(doc(db, 'users', auth.currentUser.uid), data);
    },
    uploadFile: async (_file: File, _path: string) => {
      // TODO: Implement file upload
      return '';
    },
    downloadFile: async (_path: string) => {
      // TODO: Implement file download
      return '';
    }
  };

  return (
    <FirebaseGlobalContext.Provider value={contextValue}>
      {children}
    </FirebaseGlobalContext.Provider>
  );
}

// Hook to use the context
export function useFirebaseGlobal() {
  const context = useContext(FirebaseGlobalContext);
  if (context === undefined) {
    throw new Error('useFirebaseGlobal must be used within a FirebaseGlobalProvider');
  }
  return context;
}