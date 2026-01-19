import { cleanEnv, str, url, testOnly } from "envalid";

// Use Vite's import.meta.env instead of process.env for browser compatibility
const env = import.meta.env;

export const envConfig = cleanEnv(env, {
  // ========================
  // Core Application Configuration
  // ========================
  VITE_APP_URL: str({ devDefault: testOnly("http://localhost:3000") }),
  VITE_APP_DOMAIN: str({ devDefault: testOnly("localhost.example.com") }),
  VITE_APP_DOMAINS: str({ devDefault: testOnly("localhost.example.com") }),
  VITE_API_BASE_URL: str({ devDefault: testOnly("http://localhost:3051/v1") }),
  VITE_NODE_ENV: str({ devDefault: testOnly("development") }),
  VITE_SECURE_LOGIN: str({ devDefault: testOnly("ENHANCED") }),

  // ========================
  // External API Configuration
  // ========================
  VITE_DERIV_WS_APP_ID: str({ devDefault: testOnly("12345") }),
  VITE_DERIV_OAUTH_BASE_URL: url({ devDefault: testOnly("https://oauth.deriv.com/oauth2/authorize?app_id=") }),
  VITE_DERIV_WS_ENDPOINT: str({ devDefault: testOnly("wss://ws.derivws.com/websockets/v3?app_id=") }),
  VITE_DERIV_WS_ENDPOINT_DOMAIN: str({ devDefault: testOnly("ws.derivws.com") }),
  VITE_DERIV_WS_ENDPOINT_PATH: str({ devDefault: testOnly("/websockets/v3?app_id=") }),
  VITE_DERIV_APP_ENDPOINT_LANG: str({ devDefault: testOnly("EN") }),

  // ========================
  // Authentication Configuration
  // ========================
  VITE_GOOGLE_OAUTH_CLIENT_ID: str({ devDefault: testOnly("test-google-client-id.apps.googleusercontent.com") }),
  VITE_GOOGLE_OAUTH_CLIENT_SECRET: str({ devDefault: testOnly("test-google-client-secret") }),

  // ========================
  // Firebase Configuration
  // ========================
  VITE_FIREBASE_API_KEY: str({ devDefault: testOnly("AIzaSyTestKey1234567890ABCDEFghijklmnop") }),
  VITE_FIREBASE_AUTH_DOMAIN: str({ devDefault: testOnly("test-project.firebaseapp.com") }),
  VITE_FIREBASE_PROJECT_ID: str({ devDefault: testOnly("test-project-id") }),
  VITE_FIREBASE_STORAGE_BUCKET: str({ devDefault: testOnly("test-project.appspot.com") }),
  VITE_FIREBASE_MESSAGING_SENDER_ID: str({ devDefault: testOnly("123456789012") }),
  VITE_FIREBASE_APP_ID: str({ devDefault: testOnly("1:123456789012:web:abcdef1234567890abcdef12") }),
  VITE_FIREBASE_MEASUREMENT_ID: str({ devDefault: testOnly("G-TEST1234567") }),
  VITE_FIREBASE_DATABASE_URL: url({ devDefault: testOnly("https://test-project-default-rtdb.firebaseio.com") }),

  // ========================
  // Real-time Communication Configuration
  // ========================
  VITE_PUSHER_APP_ID: str({ devDefault: testOnly("1234567") }),
  VITE_PUSHER_KEY: str({ devDefault: testOnly("test_pusher_key_abcdef") }),
  VITE_PUSHER_SECRET: str({ devDefault: testOnly("test_pusher_secret_123456") }),
  VITE_PUSHER_CLUSTER: str({ devDefault: testOnly("eu") }),
  VITE_PUSHER_INSTANCE_ID: str({ devDefault: testOnly("test-instance-id-12345-abcd") }),
  VITE_PUSHER_PRIMARY_KEY: str({ devDefault: testOnly("TEST_PUSH_PRIMARY_KEY_ABC123DEF456") }),

  // ========================
  // Trading Bot Configuration
  // ========================
  VITE_KOPPO_VRTC: str({ devDefault: testOnly("test_vrtc_token_12345") }),
  VITE_KOPPO_USD: str({ devDefault: testOnly("test_usd_token_67890") }),
  VITE_KOPPO_tUSDT: str({ devDefault: testOnly("test_tusdt_token_abcde") }),

  // ========================
  // Social Integration Configuration
  // ========================
  VITE_TELEGRAM_BOT_USERNAME: str({ devDefault: testOnly("test_bot_username") }),

  // ========================
  // Security Configuration
  // ========================
  VITE_ENCRYPTION_SECRET: str({ devDefault: testOnly("test_encryption_secret") }),
  VITE_ENCRYPTION_SALT: str({ devDefault: testOnly("test_encryption_salt") }),
  VITE_FIREBASE_VAPID_PUBLIC_KEY: str({ devDefault: testOnly("BNk9XhT2yL7fG8wQ3vR6mP4sD1aJ5cZbN8eY0pF7gH3iK2jM4oV6qR8tW1xY5z") }),
  VITE_FIREBASE_VAPID_PRIVATE_KEY: str({ devDefault: testOnly("K7xM3pQ9vR2nJ5fH8wZ4bN1cY6tG0sL8iO5eA3dF7gP2jK9mX4qR6tW1yZ5") }),
});