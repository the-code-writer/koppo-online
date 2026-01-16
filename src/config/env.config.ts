import { cleanEnv, str, url, testOnly } from "envalid";

// Use Vite's import.meta.env instead of process.env for browser compatibility
const env = import.meta.env;

export const envConfig = cleanEnv(env, {
  // ========================
  // Development Configuration
  // ========================
  VITE_NODE_ENV: str({ devDefault: testOnly("development") }),
  VITE_API_BASE_URL: str({ devDefault: testOnly("http://localhost:3051/v1") }),
  VITE_APP_URL: str({ devDefault: testOnly("http://localhost:3000") }),
  VITE_APP_DOMAINS: str({ devDefault: testOnly("koppo.online, koppo.app") }),

  // ========================
  // Deriv API Configuration
  // ========================
  VITE_DERIV_WS_APP_ID: str({ devDefault: testOnly("111480") }),
  VITE_DERIV_OAUTH_BASE_URL: url({ devDefault: testOnly("https://oauth.deriv.com/oauth2/authorize") }),
  VITE_DERIV_WS_ENDPOINT: str({ devDefault: testOnly("wss://ws.derivws.com/websockets/v3") }),

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
  // Firebase Cloud Messaging VAPID Configuration
  // ========================
  VITE_FIREBASE_VAPID_PUBLIC_KEY: str({ devDefault: testOnly("BLs6CWFuT41tfhhed9wrBWFBs00PCULkRFUYKYXMp5yYrpYLqN8Eb89RI8oMw2vvfyzLuXf5YQcX_dem1bsIo0") }),
  VITE_FIREBASE_VAPID_PRIVATE_KEY: str({ devDefault: testOnly("56hLYRfrYzFoDkzkkrdymu0Hulrfeu4pYbV08trHo4M") }),

  // ========================
  // Telegram Configuration
  // ========================
  VITE_TELEGRAM_BOT_USERNAME: str({ devDefault: testOnly("test_bot_username") }),

  // ========================
  // Trading Bot Configuration
  // ========================
  VITE_KOPPO_VRTC: str({ devDefault: testOnly("test_vrtc_token_12345") }),
  VITE_KOPPO_USD: str({ devDefault: testOnly("test_usd_token_67890") }),
  VITE_KOPPO_tUSDT: str({ devDefault: testOnly("test_tusdt_token_abcde") }),

  // ========================
  // Pusher Configuration
  // ========================
  VITE_PUSHER_APP_ID: str({ devDefault: testOnly("1234567") }),
  VITE_PUSHER_KEY: str({ devDefault: testOnly("test_pusher_key_abcdef") }),
  VITE_PUSHER_SECRET: str({ devDefault: testOnly("test_pusher_secret_123456") }),
  VITE_PUSHER_CLUSTER: str({ devDefault: testOnly("eu") }),
  VITE_PUSHER_INSTANCE_ID: str({ devDefault: testOnly("test-instance-id-12345-abcd") }),
  VITE_PUSHER_PRIMARY_KEY: str({ devDefault: testOnly("TEST_PUSH_PRIMARY_KEY_ABC123DEF456") }),
});