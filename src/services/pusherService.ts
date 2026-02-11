import Pusher from 'pusher-js';
import { envConfig } from '../config/env.config';

// ==================== TYPES & INTERFACES ====================

export interface PusherConfig {
  key: string;
  cluster: string;
  forceTLS?: boolean;
  appId?: string;
  secret?: string;
  instanceId?: string;
  primaryKey?: string;
}

export interface PusherEvent {
  channelName: string;
  eventName: string;
  data: any;
  timestamp: Date;
}

export interface PusherListener {
  id: string;
  channelName: string;
  eventName: string;
  callback: (event: PusherEvent) => void;
  priority?: number; // Higher priority listeners are called first
  once?: boolean; // If true, listener is removed after first call
}

export interface PusherChannelConfig {
  channelName: string;
  events: {
    [eventName: string]: (data: any) => void;
  };
}

// ==================== PUSHER SERVICE ====================

class PusherService {
  private pusher: Pusher | null = null;
  private channels: Map<string, any> = new Map();
  private config: PusherConfig | null = null;
  private listeners: Map<string, PusherListener[]> = new Map(); // Global listeners
  private eventHistory: PusherEvent[] = []; // Event history for debugging
  private maxEventHistory = 100; // Keep last 100 events

  /**
   * Initialize Pusher with configuration from envConfig
   */
  initialize(): void {
    const config: PusherConfig = {
      key: envConfig.VITE_PUSHER_KEY,
      cluster: envConfig.VITE_PUSHER_CLUSTER,
      forceTLS: true,
      appId: envConfig.VITE_PUSHER_APP_ID,
      secret: envConfig.VITE_PUSHER_SECRET,
      instanceId: envConfig.VITE_PUSHER_INSTANCE_ID,
      primaryKey: envConfig.VITE_PUSHER_PRIMARY_KEY,
    };

    this.config = config;
    
    if (this.pusher) {
      this.pusher.disconnect();
    }

    this.pusher = new Pusher(config.key, {
      cluster: config.cluster,
      forceTLS: config.forceTLS,
    });

    // Enable logging in development
    if (import.meta.env.DEV) {
      Pusher.logToConsole = true;
      console.log('Pusher initialized with config:', {
        key: config.key,
        cluster: config.cluster,
        appId: config.appId,
        instanceId: config.instanceId,
      });
    }
  }

  /**
   * Add a global listener for specific events across all channels
   */
  addListener(listener: PusherListener): void {
    const key = `${listener.channelName}:${listener.eventName}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    const listeners = this.listeners.get(key)!;
    
    // Insert listener based on priority (higher priority first)
    const insertIndex = listeners.findIndex(
      l => (l.priority || 0) < (listener.priority || 0)
    );
    
    if (insertIndex === -1) {
      listeners.push(listener);
    } else {
      listeners.splice(insertIndex, 0, listener);
    }
    
    console.log(`Added listener for ${key} (ID: ${listener.id}, Priority: ${listener.priority || 0})`);
  }

  /**
   * Remove a specific listener
   */
  removeListener(listenerId: string): void {
    for (const [key, listeners] of this.listeners.entries()) {
      const index = listeners.findIndex(l => l.id === listenerId);
      if (index !== -1) {
        listeners.splice(index, 1);
        console.log(`Removed listener ${listenerId} from ${key}`);
        
        if (listeners.length === 0) {
          this.listeners.delete(key);
        }
        break;
      }
    }
  }

  /**
   * Remove all listeners for a specific channel and event
   */
  removeListeners(channelName: string, eventName: string): void {
    const key = `${channelName}:${eventName}`;
    this.listeners.delete(key);
    console.log(`Removed all listeners for ${key}`);
  }

  /**
   * Get all listeners for debugging
   */
  getListeners(): Map<string, PusherListener[]> {
    return new Map(this.listeners);
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(): PusherEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Trigger event to all registered listeners
   */
  private triggerEvent(channelName: string, eventName: string, data: any): void {
    const event: PusherEvent = {
      channelName,
      eventName,
      data,
      timestamp: new Date(),
    };

    // Add to event history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxEventHistory) {
      this.eventHistory.shift();
    }

    // Trigger global listeners
    const key = `${channelName}:${eventName}`;
    const listeners = this.listeners.get(key) || [];
    
    const listenersToRemove: string[] = [];
    
    listeners.forEach(listener => {
      try {
        listener.callback(event);
        
        if (listener.once) {
          listenersToRemove.push(listener.id);
        }
      } catch (error) {
        console.error(`Error in listener ${listener.id}:`, error);
      }
    });

    // Remove one-time listeners
    listenersToRemove.forEach(id => this.removeListener(id));
  }

  /**
   * Subscribe to a channel and bind events
   */
  subscribeToChannel(config: PusherChannelConfig): void {
    if (!this.pusher) {
      console.warn('Pusher not initialized. Call initialize() first.');
      return;
    }

    const { channelName, events } = config;

    // Unsubscribe from existing channel if already subscribed
    if (this.channels.has(channelName)) {
      const existingChannel = this.channels.get(channelName);
      existingChannel.unbind_all();
      this.pusher.unsubscribe(channelName);
    }

    // Subscribe to new channel
    const channel = this.pusher.subscribe(channelName);

    // Bind events and integrate with global listener system
    Object.entries(events).forEach(([eventName, originalCallback]) => {
      channel.bind(eventName, (data: any) => {
        // Call the original callback
        try {
          originalCallback(data);
        } catch (error) {
          console.error(`Error in original callback for ${eventName}:`, error);
        }
        
        // Trigger global listeners
        this.triggerEvent(channelName, eventName, data);
      });
    });

    this.channels.set(channelName, channel);

    console.log(`Subscribed to Pusher channel: ${channelName}`);
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribeFromChannel(channelName: string): void {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName);
      channel.unbind_all();
      this.pusher?.unsubscribe(channelName);
      this.channels.delete(channelName);
      console.log(`Unsubscribed from Pusher channel: ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels and disconnect
   */
  disconnect(): void {
    this.channels.forEach((channel, channelName) => {
      channel.unbind_all();
      this.pusher?.unsubscribe(channelName);
    });
    this.channels.clear();
    
    if (this.pusher) {
      this.pusher.disconnect();
      this.pusher = null;
    }
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.pusher?.connection.state || 'disconnected';
  }

  /**
   * Check if Pusher is connected
   */
  isConnected(): boolean {
    return this.getConnectionState() === 'connected';
  }

  /**
   * Get subscribed channels
   */
  getSubscribedChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// ==================== SINGLETON INSTANCE ====================

export const pusherService = new PusherService();

// ==================== AUTO-INITIALIZATION ====================

// Initialize Pusher with environment configuration
if (typeof window !== 'undefined') {
  pusherService.initialize();
}

// ==================== EXPORTS ====================

export default pusherService;
