// NotificationTokenManager.js
import React, { useEffect, useState } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from './firebaseConfig'; // Adjust the path as needed

function NotificationTokenManager() {
  const [token, setToken] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);

  // IMPORTANT: Replace with your actual VAPID key
  // You can find this in Firebase Console -> Project settings -> Cloud Messaging -> Web configuration
  const VAPID_KEY = "YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE";

  useEffect(() => {
    async function requestPermissionAndGetToken() {
      try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          setPermissionGranted(true);

          // Get the FCM registration token
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (currentToken) {
            console.log('FCM Registration Token:', currentToken);
            setToken(currentToken);
            setError(null);
            // TODO: Send this token to your backend server
            // For example: sendTokenToServer(currentToken);
          } else {
            console.log('No registration token available. Request permission to generate one.');
            setError('No registration token available.');
          }
        } else {
          console.log('Notification permission denied.');
          setPermissionGranted(false);
          setToken(null);
          setError('Notification permission denied.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token or requesting permission: ', err);
        setError(`Error: ${err.message}`);
      }
    }

    // Call the function to request permission and get token
    requestPermissionAndGetToken();

    // Set up a listener for when the token is refreshed (e.g., due to browser/app changes)
    // You would typically re-send the new token to your server here.
    // Note: onTokenRefresh is deprecated in v9. Use getToken() periodically or on app startup.
    // However, for completeness, I'll show how you might handle token changes.
    // The current `getToken` call handles initial token retrieval and refresh implicitly.
    // The most robust way is to call `getToken` every time your app loads and check if it's new.

    // Also, set up a listener for incoming messages while the app is in the foreground
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      // You can display a notification or update UI based on the message
    });

    // Cleanup function
    return () => {
      unsubscribe(); // Unsubscribe from onMessage listener
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div>
      <h2>Firebase Cloud Messaging (FCM) Status</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {permissionGranted ? (
        <p>Notification permission: <span style={{ color: 'green' }}>Granted</span></p>
      ) : (
        <p>Notification permission: <span style={{ color: 'orange' }}>Denied or Not Requested</span></p>
      )}
      {token ? (
        <div>
          <p>FCM Token: <code style={{ wordBreak: 'break-all' }}>{token}</code></p>
          <p>Remember to send this token to your backend to send targeted messages.</p>
        </div>
      ) : (
        <p>Attempting to get FCM token...</p>
      )}
      <p>
        **Important:** For FCM to work, you need a `firebase-messaging-sw.js` file
        in the root of your public directory.
      </p>
    </div>
  );
}

export default NotificationTokenManager;





























// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID", // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Firebase Messaging service
export const messaging = getMessaging(app);