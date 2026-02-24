/**
 * Utility functions for version management
 */

interface BotVersion {
  current: string;
  notes: string;
  date: string;
}

interface TradingBotConfig {
  botName?: string;
  botDescription?: string;
  botTags?: string[];
  isPublic?: boolean;
  isActive?: boolean;
  amounts?: {
    base_stake?: unknown;
    maximum_stake?: unknown;
    take_profit?: unknown;
    stop_loss?: unknown;
  };
  recovery_steps?: {
    risk_steps?: Array<{
      id: string;
      lossStreak: number;
      multiplier: number;
      action: string;
    }>;
  };
  advanced_settings?: {
    general_settings_section?: {
      maximum_number_of_trades?: number | null;
      maximum_running_time?: number | null;
      cooldown_period?: { duration: number; unit: string } | null;
      recovery_type?: string | null;
      compound_stake?: boolean;
      auto_restart?: boolean;
    };
    bot_schedule?: {
      bot_schedule?: {
        id: string;
        name: string;
        type: "hourly" | "daily" | "weekly" | "monthly" | "custom";
        startDate: any;
        endDate?: any;
        startTime: any;
        endTime?: any;
        daysOfWeek?: number[];
        dayOfMonth?: number;
        isEnabled: boolean;
      };
    };
    risk_management_section?: {
      max_daily_loss?: unknown;
      max_daily_profit?: unknown;
      max_consecutive_losses?: number | null;
      max_drawdown_percentage?: number | null;
      risk_per_trade?: number | null;
    };
  };
  version?: BotVersion;
  [key: string]: any;
}

/**
 * Increments the patch version of a semantic version string
 * @param version - Current version string in format "x.y.z"
 * @returns Next version with incremented patch number
 */
export function incrementVersion(version: string): string {
  // Split version into parts
  const parts = version.split('.');
  
  // Validate version format
  if (parts.length !== 3) {
    console.warn('Invalid version format, defaulting to 1.0.0');
    return '1.0.1';
  }
  
  const [major, minor, patch] = parts.map(part => {
    const num = parseInt(part, 10);
    return isNaN(num) ? 0 : num;
  });
  
  // Increment patch version
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Compares two objects and returns the changed fields
 * @param oldBot - Original bot configuration
 * @param newBot - Updated bot configuration
 * @returns Array of changed field descriptions
 */
function detectChanges(oldBot: TradingBotConfig, newBot: TradingBotConfig): string[] {
  const changes: string[] = [];
  
  // Check basic fields
  if (oldBot.botName !== newBot.botName && newBot.botName) {
    changes.push('name');
  }
  
  if (oldBot.botDescription !== newBot.botDescription && newBot.botDescription) {
    changes.push('description');
  }
  
  if (JSON.stringify(oldBot.botTags) !== JSON.stringify(newBot.botTags)) {
    changes.push('tags');
  }
  
  if (oldBot.isPublic !== newBot.isPublic) {
    changes.push(newBot.isPublic ? 'made public' : 'made private');
  }
  
  // Check amounts
  if (JSON.stringify(oldBot.amounts) !== JSON.stringify(newBot.amounts)) {
    changes.push('amounts');
  }
  
  // Check recovery steps
  if (JSON.stringify(oldBot.recovery_steps) !== JSON.stringify(newBot.recovery_steps)) {
    changes.push('recovery settings');
  }
  
  // Check advanced settings
  if (JSON.stringify(oldBot.advanced_settings) !== JSON.stringify(newBot.advanced_settings)) {
    changes.push('advanced settings');
  }
  
  // Check for any other significant changes (excluding status changes)
  const excludedFields = ['status', 'updatedAt', 'version', 'realtimePerformance'];
  for (const key in newBot) {
    if (!excludedFields.includes(key) && 
        JSON.stringify(oldBot[key]) !== JSON.stringify(newBot[key])) {
      if (!changes.includes(key) && !changes.includes('configuration')) {
        changes.push('configuration');
        break;
      }
    }
  }
  
  return changes;
}

/**
 * Updates bot version with current date and incremented version
 * @param currentVersion - Current bot version object
 * @param oldBot - Original bot configuration (optional)
 * @param newBot - Updated bot configuration (optional)
 * @returns Updated version object
 */
export function updateBotVersion(
  currentVersion: BotVersion | undefined, 
  oldBot?: TradingBotConfig, 
  newBot?: TradingBotConfig
): BotVersion {
  let notes = 'Auto-incremented version';
  
  // If we have both old and new bot data, detect changes
  if (oldBot && newBot) {
    const changes = detectChanges(oldBot, newBot);
    if (changes.length > 0) {
      notes = `Updated: ${changes.join(', ')}`;
    } else {
      notes = 'Minor update';
    }
  }
  
  return {
    current: incrementVersion(currentVersion?.current || '1.0.0'),
    notes,
    date: new Date().toISOString()
  };
}
