import { useState, useEffect, useCallback } from 'react';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';
import { envConfig } from '../config/env.config';
import { messaging } from '../firebase/config';

interface MessagingState {
  token: string | null;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
}

export const useFirebaseMessaging = () => {
  const [state, setState] = useState<MessagingState>({
    token: null,
    permission: 'default',
    isLoading: false,
    error: null,
  });

  // Request notification permission
  const requestPermission = useCallback(async () => {
    console.log('Requesting notification permission...');
    
    if (!('Notification' in window)) {
      setState(prev => ({
        ...prev,
        error: 'This browser does not support notifications'
      }));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      setState(prev => ({
        ...prev,
        permission
      }));

      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Get token after permission is granted
        //const messaging = getMessaging();
        const currentToken = await getToken(messaging, { 
            vapidKey: envConfig.VITE_FIREBASE_VAPID_PUBLIC_KEY 
        });
        console.log({currentToken})
      } else {
        console.log('Notification permission denied.');
        setState(prev => ({
          ...prev,
          error: 'Notification permission was denied. Please enable notifications in your browser settings.'
        }));
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request notification permission'
      }));
    }
  }, []);

  // Get registration token
  const getFirebaseToken = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      //const messaging = getMessaging();
      
      if (!messaging) {
        throw new Error('Firebase messaging is not initialized');
      }

      console.log('Getting FCM token with VAPID key...');
      
      const currentToken = await getToken(messaging, { 
        vapidKey: envConfig.VITE_FIREBASE_VAPID_PUBLIC_KEY 
      });

      if (currentToken) {
        console.log('FCM Token retrieved successfully:', currentToken.substring(0, 20) + '...');
        setState(prev => ({
          ...prev,
          token: currentToken,
          isLoading: false
        }));
        
        // Send token to server and update UI if necessary
        // TODO: Implement your server logic here
        console.log('Send this token to your server:', currentToken);
      } else {
        console.log('No registration token available. Request permission to generate one.');
        setState(prev => ({
          ...prev,
          error: 'No registration token available. Please request notification permission.',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error retrieving FCM token:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to retrieve FCM token',
        isLoading: false
      }));
    }
  }, []);

  // Delete current token
  const deleteCurrentToken = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      //const messaging = getMessaging();
      
      if (!messaging) {
        throw new Error('Firebase messaging is not initialized');
      }

      await deleteToken(messaging);
      console.log('FCM token deleted successfully');
      
      setState(prev => ({
        ...prev,
        token: null,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete FCM token',
        isLoading: false
      }));
    }
  }, []);

  // Check current permission status
  const checkPermissionStatus = useCallback(() => {
    if (!('Notification' in window)) {
      setState(prev => ({
        ...prev,
        permission: 'denied',
        error: 'This browser does not support notifications'
      }));
      return 'denied';
    }

    const permission = Notification.permission;
    console.log('Current notification permission:', permission);
    
    setState(prev => ({
      ...prev,
      permission
    }));
    
    return permission;
  }, []);

  // Initialize messaging and check permission
  useEffect(() => {
    //const messaging = getMessaging();
    
    if (messaging) {
      // Check initial permission status
      checkPermissionStatus();

      // Listen for incoming messages
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Received FCM message:', payload);
        
        // Handle different types of messages
        if (payload.notification) {
          // Show notification if app is in background
          if (document.hidden) {
            const { title, body, icon, image, click_action } = payload.notification;
            
            const notificationOptions: NotificationOptions = {
              body,
              icon: icon || '/logo.png',
              badge: '/logo.png',
              tag: payload.collapse_key || 'default',
              requireInteraction: false,
            };

            if (image) {
              notificationOptions.image = image;
            }

            const notification = new Notification(title, notificationOptions);
            
            // Handle notification click
            notification.onclick = () => {
              console.log('Notification clicked:', click_action);
              if (click_action) {
                window.open(click_action, '_blank');
              }
              notification.close();
            };

            // Auto-close notification after 5 seconds
            setTimeout(() => {
              notification.close();
            }, 5000);
          }
        }

        // Handle data messages (silent notifications)
        if (payload.data) {
          console.log('FCM Data message:', payload.data);
          // TODO: Handle data messages based on your app logic
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [checkPermissionStatus]);

  return {
    ...state,
    requestPermission,
    getFirebaseToken,
    deleteCurrentToken,
    checkPermissionStatus,
  };
};

type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  image?: string;
}
