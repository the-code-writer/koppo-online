import { cleanEnv, str, url, testOnly } from "envalid";

// Use Vite's import.meta.env instead of process.env for browser compatibility
const env = import.meta.env;

export const envConfig = cleanEnv(env, {
  // ========================
  // Development Configuration
  // ========================
  VITE_NODE_ENV: str({ devDefault: testOnly("development") }),
  VITE_API_BASE_URL: str({ devDefault: testOnly("http://localhost:3051/v1") }),

  // ========================
  // Deriv API Configuration
  // ========================
  VITE_DERIV_WS_APP_ID: str({ devDefault: testOnly("111480") }),
  VITE_DERIV_OAUTH_BASE_URL: url({ devDefault: testOnly("https://oauth.deriv.com/oauth2/authorize") }),
  VITE_DERIV_WS_ENDPOINT: str({ devDefault: testOnly("wss://ws.derivws.com/websockets/v3") }),

  // ========================
  // Firebase Configuration
  // ========================
  VITE_FIREBASE_API_KEY: str({ devDefault: testOnly("") }),
  VITE_FIREBASE_AUTH_DOMAIN: str({ devDefault: testOnly("koppo-ai.firebaseapp.com") }),
  VITE_FIREBASE_PROJECT_ID: str({ devDefault: testOnly("koppo-ai") }),
  VITE_FIREBASE_STORAGE_BUCKET: str({ devDefault: testOnly("koppo-ai.firebasestorage.app") }),
  VITE_FIREBASE_MESSAGING_SENDER_ID: str({ devDefault: testOnly("163810851712") }),
  VITE_FIREBASE_APP_ID: str({ devDefault: testOnly("1:163810851712:web:eebdc1db4305d345eb1f65") }),
  VITE_FIREBASE_MEASUREMENT_ID: str({ devDefault: testOnly("G-JY2Y637FHF") }),
  VITE_FIREBASE_DATABASE_URL: url({ devDefault: testOnly("https://koppo-ai-default-rtdb.firebaseio.com") }),

  // ========================
  // Trading Bot Configuration
  // ========================
  VITE_KOPPO_VRTC: str({ devDefault: testOnly("") }),
  VITE_KOPPO_USD: str({ devDefault: testOnly("") }),
  VITE_KOPPO_tUSDT: str({ devDefault: testOnly("") }),
});