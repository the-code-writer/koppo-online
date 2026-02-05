import { BotManager, BotStatus } from './BotManager';

// Example usage of BotManager
export class BotManagerExample {
  private botManager = BotManager.getInstance();

  // Example: Create a bot with the provided data structure
  public createExampleBot() {
    const botData = {
      strategyId: "1",
      contract: {
        id: "default-step",
        tradeType: "CALLE|PUTE",
        contractType: "ALTERNATE",
        prediction: "8",
        predictionRandomize: false,
        market: {
          symbol: "R_100",
          displayName: "Volatility 100 (1s) Index",
          shortName: "Volatility 100",
          market_name: "synthetic_index",
          type: "volatility"
        },
        marketRandomize: false,
        multiplier: 1,
        delay: 1,
        duration: 1,
        durationUnits: "minutes",
        allowEquals: false,
        alternateAfter: 19
      },
      amounts: {
        base_stake: {
          type: "fixed" as const,
          value: 235235
        },
        maximum_stake: {
          type: "fixed" as const,
          value: 253523
        },
        take_profit: {
          type: "fixed" as const,
          value: 234
        },
        stop_loss: {
          type: "fixed" as const,
          value: 2352352
        }
      },
      "recovery-steps": {
        risk_steps: [
          {
            id: "step-1770164960641",
            tradeType: "DIGITS",
            contractType: "DIGITUNDER",
            prediction: "8",
            predictionRandomize: false,
            market: {
              symbol: "R_100",
              displayName: "Volatility 100 (1s) Index",
              shortName: "Volatility 100",
              market_name: "synthetic_index",
              type: "volatility"
            },
            marketRandomize: false,
            multiplier: 3.125,
            delay: 1,
            duration: 1,
            durationUnits: "ticks",
            allowEquals: false,
            alternateAfter: 1
          }
        ]
      },
      "advanced-settings": {
        general_settings_section: {
          bot_schedules: [
            {
              id: "1770165049798",
              name: "Schedule 1",
              type: "daily",
              startDate: "2026-02-04T00:30:49.799Z",
              startTime: "2026-02-04T07:00:49.800Z",
              isEnabled: true,
              exclusions: [],
              endDate: "2026-02-17T22:00:00.000Z",
              endTime: "2026-02-04T04:06:00.000Z"
            }
          ],
          maximum_stake: {
            type: "fixed" as const,
            value: 253523
          },
          compound_stake: false,
          stop_on_loss_streak: false,
          auto_restart: false
        },
        telegram_notifications_section: {
          enable_telegram_notifications: true,
          notification_frequency: "immediate",
          notification_timing: ["business_hours"],
          trade_notifications: {
            trade_executed: true,
            trade_completed: true,
            trade_profit: true,
            trade_loss: true
          },
          performance_notifications: {
            daily_summary: false,
            weekly_summary: false,
            milestone_reached: true,
            drawdown_alert: true
          },
          system_notifications: {
            bot_started: true,
            bot_stopped: true,
            bot_error: true,
            cooldown_triggered: false
          },
          custom_message_threshold: 100,
          quiet_hours: {
            enabled: false,
            start_time: "22:00",
            end_time: "08:00"
          }
        },
        advanced_bot_interaction: {
          bot_commands: {
            enable_commands: false,
            command_prefix: "/",
            allowed_commands: ["status", "help"]
          },
          interactive_notifications: {
            enable_quick_actions: false,
            quick_actions: [],
            confirmation_required: true
          },
          voice_commands: {
            enable_voice: false,
            voice_language: "en",
            voice_sensitivity: 80
          },
          message_formatting: {
            use_emoji: true,
            message_style: "formatted",
            include_charts: false,
            chart_type: "line"
          },
          security_settings: {
            require_authentication: true,
            allowed_users: "",
            admin_users: "",
            rate_limiting: true,
            max_commands_per_minute: 10
          },
          analytics_and_reporting: {
            enable_analytics: false,
            report_frequency: "daily",
            include_predictions: false,
            sentiment_analysis: false,
            risk_metrics: true
          },
          automation_features: {
            auto_restart_on_error: false,
            auto_adjust_risk: false,
            auto_optimize_parameters: false,
            machine_learning: false,
            learning_rate: 0.01
          }
        },
        risk_management_section: {},
        profit_targets_section: {},
        market_filters_section: {
          economic_calendar_filter: false,
          geopolitical_risk_filter: false
        },
        technical_indicators_section: {},
        advanced_analysis_section: {
          price_action_confirmation: false,
          multi_timeframe_analysis: false,
          pattern_recognition: false,
          support_resistance_levels: false,
          fibonacci_retracement: false,
          order_book_analysis: false,
          market_microstructure: false,
          regime_detection: false,
          seasonal_adjustments: false
        },
        execution_control_section: {
          liquidity_hunting_protection: false
        },
        position_sizing_section: {
          adaptive_sizing: false,
          quantile_based_sizing: false,
          kelly_criterion_sizing: false,
          volatility_normalized_sizing: false
        },
        ai_machine_learning_section: {
          machine_learning_signals: false,
          reinforcement_learning: false,
          neural_network_signals: false,
          ensemble_predictions: false,
          regime_switching_model: false
        },
        market_intelligence_section: {
          social_sentiment_integration: false,
          whale_activity_monitoring: false,
          dark_pool_analysis: false,
          cross_market_correlation: false
        },
        advanced_strategies_section: {
          dynamic_hedging: false,
          arbitrage_detection: false,
          strategy_rotation: false,
          auto_parameter_tuning: false
        },
        optimization_section: {
          gas_fee_optimization: false,
          tax_optimization: false,
          quantum_computing_optimization: false
        },
        monitoring_control_section: {
          time_restriction: false,
          performance_monitoring: false,
          backtesting_mode: false,
          performance_degradation_detection: false,
          emergency_stop: false
        }
      }
    };

    const bot = this.botManager.createBot(botData, "Example Strategy Bot");
    console.log("Created bot:", bot);
    return bot;
  }

  // Example: CRUD operations
  public demonstrateCRUD() {
    // CREATE
    const bot = this.createExampleBot();
    if (!bot) return;

    // READ
    const retrievedBot = this.botManager.getBot(bot.id);
    console.log("Retrieved bot:", retrievedBot);

    const allBots = this.botManager.getAllBots();
    console.log("All bots:", allBots);

    // UPDATE
    const updatedBot = this.botManager.updateBot(bot.id, {
      amounts: {
        ...bot.amounts,
        base_stake: { type: "fixed" as const, value: 300000 }
      }
    });
    console.log("Updated bot:", updatedBot);

    // STATUS OPERATIONS
    this.botManager.startBot(bot.id);
    this.botManager.pauseBot(bot.id);
    this.botManager.resumeBot(bot.id);
    this.botManager.stopBot(bot.id);

    // DUPLICATE
    const duplicatedBot = this.botManager.duplicateBot(bot.id, "Duplicated Bot");
    console.log("Duplicated bot:", duplicatedBot);

    // EXPORT
    const exportedJson = this.botManager.exportBot(bot.id);
    console.log("Exported JSON:", exportedJson);

    // IMPORT
    if (exportedJson) {
      const importedBot = this.botManager.importBot(exportedJson);
      console.log("Imported bot:", importedBot);
    }

    // DELETE
    const deleted = this.botManager.deleteBot(bot.id);
    console.log("Bot deleted:", deleted);
  }

  // Example: Filter operations
  public demonstrateFilters() {
    const allBots = this.botManager.getAllBots();
    
    // Get bots by status
    const runningBots = this.botManager.getBotsByStatus(BotStatus.START);
    const stoppedBots = this.botManager.getBotsByStatus(BotStatus.STOP);
    
    // Get bots by strategy
    const strategyBots = this.botManager.getBotsByStrategy("1");
    
    console.log("Running bots:", runningBots);
    console.log("Stopped bots:", stoppedBots);
    console.log("Strategy 1 bots:", strategyBots);
  }
}

// Usage in React component
export const useBotManager = () => {
  const botManager = BotManager.getInstance();
  
  return {
    // CRUD operations
    createBot: botManager.createBot.bind(botManager),
    getBot: botManager.getBot.bind(botManager),
    getAllBots: botManager.getAllBots.bind(botManager),
    updateBot: botManager.updateBot.bind(botManager),
    deleteBot: botManager.deleteBot.bind(botManager),
    
    // Status operations
    startBot: botManager.startBot.bind(botManager),
    stopBot: botManager.stopBot.bind(botManager),
    pauseBot: botManager.pauseBot.bind(botManager),
    resumeBot: botManager.resumeBot.bind(botManager),
    
    // Utility operations
    duplicateBot: botManager.duplicateBot.bind(botManager),
    exportBot: botManager.exportBot.bind(botManager),
    importBot: botManager.importBot.bind(botManager),
    
    // Filter operations
    getBotsByStatus: botManager.getBotsByStatus.bind(botManager),
    getBotsByStrategy: botManager.getBotsByStrategy.bind(botManager),
    
    // Storage operations
    clearStorage: botManager.clearStorage.bind(botManager)
  };
};
