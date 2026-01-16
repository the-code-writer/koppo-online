// Give the service worker access to Firebase messaging.
// Note: This needs to be a full URL if you are using an older version of the Firebase SDK
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
// Replace with your Firebase configuration.
const firebaseConfig = {
  apiKey: "AIzaSyAIkC9pqJFCE0FPVJBeQqyMkM2MjB7xXOI",
  authDomain: "koppo-ai.firebaseapp.com",
  databaseURL: "https://koppo-ai-default-rtdb.firebaseio.com",
  projectId: "koppo-ai",
  storageBucket: "koppo-ai.firebasestorage.app",
  messagingSenderId: "163810851712",
  appId: "1:163810851712:web:eebdc1db4305d345eb1f65",
  measurementId: "G-JY2Y637FHF"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'koppo-notification',
    requireInteraction: false,
  };

  // Show the notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});