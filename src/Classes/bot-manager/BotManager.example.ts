/**
 * @file: BotManager.example.ts
 * @description: Usage examples and integration guide for BotManager class
 * 
 * @examples:
 *   - Basic bot creation and management
 *   - Event-driven architecture usage
 *   - Form data integration
 *   - Error handling patterns
 */

import BotManager, { BotEventListener, BotEvent } from './BotManager';

// Define the StrategyFormData interface locally since it's not exported from StrategyForm
interface StrategyFormData {
  strategyId: string;
  contract: any;
  status: 'STOP' | 'START' | 'PAUSE' | 'RESUME' | 'ERROR' | 'IDLE';
  botId: string;
  botName: string;
  botDescription: string;
  botIcon: string;
  botThumbnail: string;
  botBanner: string;
  botTags: string[];
  botCurrency: string;
  isActive: boolean;
  isPremium: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: {
    current: string;
    notes: string;
    date: string;
  };
  amounts: {
    base_stake: unknown;
    maximum_stake: unknown;
    take_profit: unknown;
    stop_loss: unknown;
  };
  recovery_steps: {
    risk_steps: Array<{
      id: string;
      lossStreak: number;
      multiplier: number;
      action: string;
    }>;
  };
  advanced_settings: any;
}

// Example 1: Basic Bot Manager Usage
export async function basicBotManagerExample() {
  // Initialize bot manager
  const botManager = new BotManager('https://api.yourapp.com', 'your-auth-token');

  try {
    // Create a new bot
    const botData = {
      botName: 'My Martingale Bot',
      botDescription: 'A martingale strategy bot for EUR/USD',
      botTags: ['martingale', 'forex', 'automated'],
      createdBy: 'user123',
      strategyId: 'martingale',
      contract: {
        id: 'contract_1',
        tradeType: 'MULTIPLIER',
        contractType: 'CALL',
        prediction: 'CALL',
        predictionRandomize: false,
        market: {
          symbol: 'frxEURUSD',
          displayName: 'EUR/USD',
          shortName: 'EUR',
          market_name: 'forex',
          type: 'volatility' as const
        },
        marketRandomize: false,
        multiplier: 2,
        delay: 0,
        duration: 5,
        durationUnits: 't',
        allowEquals: false,
        alternateAfter: 0
      },
      amounts: {
        base_stake: 10,
        maximum_stake: 100,
        take_profit: 50,
        stop_loss: 20
      }
    };

    const createResult = await botManager.createBot(botData);
    
    if (createResult.success) {
      console.log('Bot created successfully:', createResult.data);
      
      // Start the bot
      const startResult = await botManager.startBot();
      if (startResult.success) {
        console.log('Bot started successfully');
      }
    } else {
      console.error('Failed to create bot:', createResult.error);
    }
  } catch (error) {
    console.error('Error in bot management:', error);
  }
}

// Example 2: Event-Driven Architecture
export function eventDrivenExample() {
  const botManager = new BotManager('https://api.yourapp.com');

  // Set up event listeners
  const statusListener: BotEventListener = (event: BotEvent) => {
    console.log(`Bot ${event.botId} status changed:`, event.data);
    // Update UI based on status change
    updateBotStatusUI(event.botId, event.data?.status);
  };

  const performanceListener: BotEventListener = (event: BotEvent) => {
    console.log(`Performance updated for bot ${event.botId}:`, event.data);
    // Update performance dashboard
    updatePerformanceDashboard(event.botId, event.data);
  };

  const errorListener: BotEventListener = (event: BotEvent) => {
    console.error(`Error occurred in bot ${event.botId}:`, event.data);
    // Show error notification
    showErrorNotification(event.data?.error);
  };

  // Add listeners
  botManager.addEventListener('status_changed', statusListener);
  botManager.addEventListener('performance_updated', performanceListener);
  botManager.addEventListener('error_occurred', errorListener);

  // Load a bot to start monitoring
  botManager.loadBot('bot_123').then(result => {
    if (result.success) {
      console.log('Bot loaded and monitoring started');
    }
  });

  // Cleanup function
  return () => {
    botManager.removeEventListener('status_changed', statusListener);
    botManager.removeEventListener('performance_updated', performanceListener);
    botManager.removeEventListener('error_occurred', errorListener);
    botManager.cleanup();
  };
}

// Example 3: Form Data Integration
export async function formDataIntegrationExample(formData: StrategyFormData) {
  const botManager = new BotManager('https://api.yourapp.com');

  // Map form data to bot configuration
  const botConfig = botManager.mapFormDataToBotConfig(formData, {
    botName: formData.botName || 'Untitled Bot',
    botDescription: formData.botDescription || '',
    botTags: formData.botTags || [],
    createdBy: 'current-user-id',
    botCurrency: 'USD'
  });

  // Validate configuration
  const validation = botManager.validateConfiguration(botConfig);
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    return { success: false, errors: validation.errors };
  }

  // Create the bot
  const result = await botManager.createBot(botConfig);
  
  if (result.success) {
    console.log('Bot created from form data:', result.data);
    return result;
  } else {
    console.error('Failed to create bot:', result.error);
    return result;
  }
}

// Example 4: Advanced Bot Control
export async function advancedBotControlExample() {
  const botManager = new BotManager('https://api.yourapp.com');

  // Load existing bot
  const loadResult = await botManager.loadBot('bot_123');
  
  if (!loadResult.success) {
    console.error('Failed to load bot:', loadResult.error);
    return;
  }

  const bot = loadResult.data!;
  
  // Update bot configuration
  const updateResult = await botManager.updateBot(bot.botId, {
    botName: 'Updated Bot Name',
    amounts: {
      ...bot.amounts,
      base_stake: 15, // Increase base stake
    },
    advanced_settings: {
      ...bot.advanced_settings,
      general_settings_section: {
        ...bot.advanced_settings.general_settings_section,
        maximum_number_of_trades: 100, // Set max trades limit
      }
    }
  });

  if (updateResult.success) {
    console.log('Bot configuration updated');
  }

  // Start bot with monitoring
  await botManager.startBot();

  // Pause after 10 trades (this would typically be triggered by some condition)
  setTimeout(async () => {
    const pauseResult = await botManager.pauseBot();
    if (pauseResult.success) {
      console.log('Bot paused');
    }
  }, 60000); // 1 minute for demo

  // Resume after 30 seconds
  setTimeout(async () => {
    const resumeResult = await botManager.resumeBot();
    if (resumeResult.success) {
      console.log('Bot resumed');
    }
  }, 90000); // 1.5 minutes for demo
}

// Example 5: React Hook Integration (conceptual - would need React imports)
/*
export function createBotManagerHook() {
  // This would be in a separate hooks file with React imports
  const useBotManager = (apiUrl: string, authToken?: string) => {
    // React hook implementation would go here
    // Requires: import { useState, useEffect } from 'react';
  };
  return useBotManager;
}
*/

// Example 6: Error Handling Patterns
export async function errorHandlingExample() {
  const botManager = new BotManager('https://api.yourapp.com');

  // Set up error handling
  botManager.addEventListener('error_occurred', (event: BotEvent) => {
    const error = event.data?.error;
    
    // Handle different types of errors
    if (error?.includes('authentication')) {
      // Redirect to login
      redirectToLogin();
    } else if (error?.includes('network')) {
      // Show network error message
      showNetworkError();
    } else if (error?.includes('validation')) {
      // Show validation errors
      showValidationErrors(error);
    } else {
      // Generic error handling
      showGenericError(error);
    }
  });

  // Wrapper function with error handling
  const safeBotOperation = async <T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error) {
      console.error(errorMessage, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Usage examples
  const createResult = await safeBotOperation(
    () => botManager.createBot({ /* bot data */ }),
    'Failed to create bot'
  );

  const startResult = await safeBotOperation(
    () => botManager.startBot(),
    'Failed to start bot'
  );

  return { createResult, startResult };
}

// Example 7: Batch Operations
export async function batchOperationsExample() {
  const botManager = new BotManager('https://api.yourapp.com');

  // Get all bots
  const botsResponse = await botManager.getBots(1, 50);
  
  if (!botsResponse.success) {
    console.error('Failed to fetch bots:', botsResponse.error);
    return;
  }

  const bots = botsResponse.data!.bots;

  // Stop all running bots
  const stopPromises = bots
    .filter(bot => bot.status === 'START')
    .map(bot => botManager.stopBot(bot.botId));

  const stopResults = await Promise.allSettled(stopPromises);
  
  // Process results
  const successfulStops = stopResults.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;

  const failedStops = stopResults.filter(result => 
    result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
  ).length;

  console.log(`Stopped ${successfulStops} bots, ${failedStops} failures`);

  // Start specific bots based on criteria
  const premiumBots = bots.filter(bot => bot.isPremium && bot.status === 'STOP');
  const startPromises = premiumBots.map(bot => botManager.startBot(bot.botId));

  const startResults = await Promise.allSettled(startPromises);
  const successfulStarts = startResults.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length;

  console.log(`Started ${successfulStarts} premium bots`);
}

// Helper functions for examples
function updateBotStatusUI(botId: string, status: string) {
  // Update UI implementation
  console.log(`Updating UI for bot ${botId} with status ${status}`);
}

function updatePerformanceDashboard(botId: string, performance: any) {
  // Update dashboard implementation
  console.log(`Updating dashboard for bot ${botId}`, performance);
}

function showErrorNotification(error: string) {
  // Show error notification implementation
  console.log(`Error notification: ${error}`);
}

function redirectToLogin() {
  // Redirect to login implementation
  console.log('Redirecting to login...');
}

function showNetworkError() {
  // Show network error implementation
  console.log('Network error occurred');
}

function showValidationErrors(error: string) {
  // Show validation errors implementation
  console.log('Validation errors:', error);
}

function showGenericError(error: string) {
  // Show generic error implementation
  console.log('Generic error:', error);
}
