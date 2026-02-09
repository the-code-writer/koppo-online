/**
 * @file: main.tsx
 * @description: Application entry point that initializes the React application,
 *               sets up providers, and renders the root component.
 *
 * @components: Root application rendering setup
 * @dependencies:
 *   - React/ReactDOM: Core React libraries
 *   - react-router-dom: RouterProvider for routing
 *   - AppProviders: Combined context providers
 *   - router: Application routing configuration
 *   - styles: Global and index styles
 * @usage: This file is the entry point for the application and is not imported elsewhere
 *
 * @architecture: Standard React application entry point
 * @relationships:
 *   - Imports: AppProviders, router configuration
 *   - Renders: The entire application tree
 * @dataFlow: Initializes the application and sets up the provider hierarchy
 *
 * @ai-hints: This is the application's entry point where the React tree is mounted
 *            to the DOM. It wraps the application in StrictMode for development
 *            checks and sets up the provider hierarchy.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { router } from './router';
import './styles/index.scss';
import './styles/global.scss';
import { DerivProvider } from './hooks/useDeriv.tsx';
// import * as PusherPushNotifications from "@pusher/push-notifications-web";
import './utils/devConsole'; // Import devConsole to make it globally available
import { generateDeviceRSAKeys } from './utils/deviceUtils';

const saveDeviceKeys = async () => {

  await generateDeviceRSAKeys(true);

}

saveDeviceKeys();

// Register service worker for Firebase Messaging
const registerServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Register Firebase messaging service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Firebase Messaging Service Worker registered successfully:', { registration });

      // Also register Pusher service worker if needed
      const pusherRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Pusher Service Worker registered successfully:', { pusherRegistration });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', { error });
      throw error;
    }
  } else {
    console.log('Service Workers are not supported in this browser');
    return null;
  }
};

// Initialize Pusher Beams and FCM
const initializeWorkers = async () => {
  try {
    // Check if Pusher is available
    if (typeof window === 'undefined') {
      console.log('Pusher Beams: Not available on server side');
      return;
    }

    // Wait for service worker to be ready
    await registerServiceWorkers();

    console.log('Pusher Beams: Starting initialization...');

    /*
    console.log('Pusher Beams: PusherPushNotifications available:', !!PusherPushNotifications);
    console.log('Pusher Beams: PusherPushNotifications.Client:', !!PusherPushNotifications.Client);

    const beamsClient = new PusherPushNotifications.Client({
      instanceId: envConfig.VITE_PUSHER_INSTANCE_ID || '',
    });

    console.log('Pusher Beams: Client created, starting...');

    await beamsClient.start();
    console.log('Pusher Beams: Started successfully');

    await beamsClient.addDeviceInterest('debug-hello');
    console.log('Pusher Beams: Added interest "debug-hello"');

    // Get device ID for debugging
    const deviceId = await beamsClient.getDeviceId();
    console.log('Pusher Beams: Device ID:', deviceId);

    // List all interests
    const interests = await beamsClient.getDeviceInterests();
    console.log('Pusher Beams: Current interests:', interests);

    */

  } catch (error) {
    console.error('Pusher Beams: Initialization failed:', error);
    // Provide more specific error information
    /*
    if (error instanceof Error) {
      console.error('Pusher Beams: Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
      */
  }
};

// Initialize Pusher Beams
initializeWorkers();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <DerivProvider>
        <RouterProvider router={router} />
      </DerivProvider>
    </AppProviders>
  </React.StrictMode>,
);
