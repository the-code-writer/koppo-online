import React from 'react';
import { useEventSubscription, useEventPublisher } from '../../hooks/useEventManager';

// Example component that publishes events
export const EventPublisher: React.FC = () => {
  const { publish } = useEventPublisher();

  const handlePublishUserAction = () => {
    publish('USER_ACTION', {
      type: 'BUTTON_CLICK',
      timestamp: Date.now(),
      userId: 'user123',
      metadata: { source: 'EventPublisher' }
    });
  };

  const handlePublishNotification = () => {
    publish('NOTIFICATION', {
      message: 'Hello from EventPublisher!',
      level: 'info',
      timestamp: Date.now()
    });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Event Publisher</h3>
      <button onClick={handlePublishUserAction}>Publish User Action</button>
      <button onClick={handlePublishNotification} style={{ marginLeft: '10px' }}>
        Publish Notification
      </button>
    </div>
  );
};

// Example component that subscribes to events
export const EventListener: React.FC<{ eventName: string }> = ({ eventName }) => {
  const [events, setEvents] = React.useState<any[]>([]);

  useEventSubscription(eventName, (data) => {
    console.log(`Received event "${eventName}":`, data);
    setEvents(prev => [...prev.slice(-4), { ...data, receivedAt: Date.now() }]);
  });

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h3>Event Listener: {eventName}</h3>
      <div>
        <strong>Recent Events:</strong>
        {events.length === 0 ? (
          <p>No events received yet</p>
        ) : (
          <ul>
            {events.map((event, index) => (
              <li key={index}>
                <pre>{JSON.stringify(event, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Example component that demonstrates both publishing and subscribing
export const EventManagerDemo: React.FC = () => {
  const { publish, getListenerCount } = useEventPublisher();
  const [listenerCounts, setListenerCounts] = React.useState<Record<string, number>>({});

  // Update listener counts periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setListenerCounts({
        'USER_ACTION': getListenerCount('USER_ACTION'),
        'NOTIFICATION': getListenerCount('NOTIFICATION')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [getListenerCount]);

  const handlePublishCustomEvent = () => {
    publish('CUSTOM_EVENT', {
      message: 'Custom event triggered!',
      data: { value: Math.random() },
      timestamp: Date.now()
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Event Manager Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Current Listener Counts:</h4>
        <pre>{JSON.stringify(listenerCounts, null, 2)}</pre>
      </div>

      <EventPublisher />
      
      <button onClick={handlePublishCustomEvent} style={{ margin: '10px' }}>
        Publish Custom Event
      </button>

      <EventListener eventName="USER_ACTION" />
      <EventListener eventName="NOTIFICATION" />
      <EventListener eventName="CUSTOM_EVENT" />
    </div>
  );
};
