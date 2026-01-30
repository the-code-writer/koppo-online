import { useCallback, useEffect, useRef } from 'react';

export interface EventData {
  [key: string]: any;
}

export interface EventHandler<T extends EventData = EventData> {
  (data: T): void;
}

export interface EventSubscription {
  eventName: string;
  handler: EventHandler;
  id: string;
}

class EventManager {
  private listeners: Map<string, Map<string, EventHandler>> = new Map();
  private static instance: EventManager;

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  subscribe<T extends EventData>(eventName: string, handler: EventHandler<T>): string {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Map());
    }

    const eventListeners = this.listeners.get(eventName)!;
    const listenerId = this.generateListenerId();

    // Check if handler already exists to prevent duplicates
    for (const [id, existingHandler] of eventListeners) {
      if (existingHandler === handler) {
        console.warn(`Handler for event "${eventName}" already exists with ID: ${id}`);
        return id;
      }
    }

    eventListeners.set(listenerId, handler);
    return listenerId;
  }

  unsubscribe(eventName: string, listenerId: string): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners && eventListeners.has(listenerId)) {
      eventListeners.delete(listenerId);
      
      // Clean up empty event maps
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  publish<T extends EventData>(eventName: string, data: T): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners && eventListeners.size > 0) {
      // Create a copy of listeners to avoid issues with listeners being added/removed during iteration
      const listeners = Array.from(eventListeners.values());
      listeners.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for "${eventName}":`, error);
        }
      });
    }
  }

  getListenerCount(eventName: string): number {
    const eventListeners = this.listeners.get(eventName);
    return eventListeners ? eventListeners.size : 0;
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Global event manager instance
const eventManager = EventManager.getInstance();

/**
 * Custom hook for subscribing to events
 * @param eventName - The name of the event to listen for
 * @param handler - The function to execute when the event is published
 * @param deps - Dependency array for re-subscription (optional)
 * @returns Object with unsubscribe function
 */
export function useEventSubscription<T extends EventData = EventData>(
  eventName: string,
  handler: EventHandler<T>,
  deps: React.DependencyList = []
): { unsubscribe: () => void } {
  const listenerIdRef = useRef<string | null>(null);

  const unsubscribe = useCallback(() => {
    if (listenerIdRef.current) {
      eventManager.unsubscribe(eventName, listenerIdRef.current);
      listenerIdRef.current = null;
    }
  }, [eventName]);

  useEffect(() => {
    // Clean up previous subscription if any
    if (listenerIdRef.current) {
      eventManager.unsubscribe(eventName, listenerIdRef.current);
    }

    // Subscribe to event
    listenerIdRef.current = eventManager.subscribe(eventName, handler as EventHandler);

    return unsubscribe;
  }, [eventName, handler, unsubscribe]);

  return { unsubscribe };
}

/**
 * Custom hook for publishing events
 * @returns Object with publish function
 */
export function useEventPublisher(): {
  publish: <T extends EventData>(eventName: string, data: T) => void;
  getListenerCount: (eventName: string) => number;
} {
  const publish = useCallback(<T extends EventData>(eventName: string, data: T) => {
    eventManager.publish(eventName, data);
  }, []);

  const getListenerCount = useCallback((eventName: string) => {
    return eventManager.getListenerCount(eventName);
  }, []);

  return { publish, getListenerCount };
}

/**
 * Combined hook that provides both publishing and subscribing capabilities
 * @returns Object with publish, subscribe, unsubscribe, and utility functions
 */
export function useEventManager(): {
  publish: <T extends EventData>(eventName: string, data: T) => void;
  subscribe: <T extends EventData>(eventName: string, handler: EventHandler<T>) => string;
  unsubscribe: (eventName: string, listenerId: string) => void;
  getListenerCount: (eventName: string) => number;
  clear: () => void;
} {
  const publish = useCallback(<T extends EventData>(eventName: string, data: T) => {
    eventManager.publish(eventName, data);
  }, []);

  const subscribe = useCallback(<T extends EventData>(eventName: string, handler: EventHandler<T>) => {
    return eventManager.subscribe(eventName, handler);
  }, []);

  const unsubscribe = useCallback((eventName: string, listenerId: string) => {
    eventManager.unsubscribe(eventName, listenerId);
  }, []);

  const getListenerCount = useCallback((eventName: string) => {
    return eventManager.getListenerCount(eventName);
  }, []);

  const clear = useCallback(() => {
    eventManager.clear();
  }, []);

  return { publish, subscribe, unsubscribe, getListenerCount, clear };
}

// Export the event manager instance for advanced usage
export { eventManager };
