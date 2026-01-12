import { cleanEnv, num, str, url, bool, testOnly } from "envalid";

// Use Vite's import.meta.env instead of process.env for browser compatibility
const env = import.meta.env;

console.log("ENV", env)

export const envConfig = cleanEnv(env, {
  // ========================
  // Application Core
  // ========================
  VITE_APP_DOMAIN: str({ devDefault: testOnly("nduta.x") }),
  VITE_NODE_ENV: str({ devDefault: testOnly("development") }),
  VITE_HOST: str({ devDefault: testOnly("localhost") }),
  VITE_PORT: num({ devDefault: testOnly(8080) }),
  VITE_CORS_ORIGIN: str({ devDefault: testOnly("http://localhost:*") }),
  VITE_IMAGE_BANNER: url({ devDefault: testOnly("https://cdn.prod.website-files.com/66585fe0e1dc7e70cc75d440/66a3154b6213d328633433d5_Deriv%20Bot.webp") }),
  VITE_SPACE_CHARACTER: str({ devDefault: testOnly("‎") }),

  // ========================
  // Connection & Network
  // ========================
  VITE_CONNECTION_MAXIMUM_ATTEMPTS: num({ devDefault: testOnly(5) }),
  VITE_CONNECTION_ATTEMPTS_TIMEOUT: num({ devDefault: testOnly(3000) }),
  VITE_CONNECTION_ATTEMPTS_TIMEOUT_INCREMENT: num({ devDefault: testOnly(3) }),
  VITE_CONNECTION_PING_TIMEOUT: num({ devDefault: testOnly(30000) }),
  VITE_CONNECTION_CONTRACT_CREATION_TIMEOUT: num({ devDefault: testOnly(60000) }),
  VITE_CONNECTION_RETRY_DELAY: num({ devDefault: testOnly(3000) }),
  VITE_COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  VITE_COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(3600) }),

  // ========================
  // Security & Cryptography
  // ========================
  VITE_ENCRYPTION_SECRET: str({ devDefault: testOnly("mX$4!Kp@9Lz^7Wn&Qr2Yb") }),
  VITE_ENCRYPTION_SALT: str({ devDefault: testOnly("c4d8e2f1a7b3905612ef") }),
  VITE_APP_CRYPTOGRAPHIC_KEY: str({ devDefault: testOnly("") }),
  VITE_SESSION_SECRET: str({ devDefault: testOnly("pass123") }),
  VITE_SESSION_NAME: str({ devDefault: testOnly("nduta.sid") }),
  VITE_SESSION_COOKIE_DOMAIN: str({ devDefault: testOnly("nduta.x") }),
  VITE_SESSION_COOKIE_SECURE: bool({ devDefault: testOnly(false) }),
  VITE_SESSION_COOKIE_HTTPONLY: bool({ devDefault: testOnly(true) }),
  VITE_SESSION_COOKIE_SAMESITE: str({ devDefault: testOnly("Lax") }),
  VITE_SESSION_COOKIE_MAX_AGE: num({ devDefault: testOnly(86400000) }),
  VITE_SESSION_RESAVE: bool({ devDefault: testOnly(false) }),
  VITE_SESSION_SAVE_UNINITIALIZED: bool({ devDefault: testOnly(false) }),

  // ========================
  // Database (MongoDB)
  // ========================
  VITE_MONGODB_CONNECTION_STRING: str({ devDefault: testOnly("mongodb://localhost:27017") }),
  VITE_MONGODB_CONNECTION_STRINGX: str({ devDefault: testOnly("") }),
  VITE_MONGODB_DATABASE_NAME: str({ devDefault: testOnly("ndutax_db") }),
  VITE_MONGODB_BACKUP_PATH: str({ devDefault: testOnly("./files/databases/mongodb/backups/") }),
  VITE_MONGODB_MAX_RETRIES: num({ devDefault: testOnly(5) }),
  VITE_MONGODB_RETRY_DELAY: num({ devDefault: testOnly(3000) }),
  VITE_DB_SERVER_SESSIONS_DATABASE_COLLECTION: str({ devDefault: testOnly("ndtx_sessions") }),
  VITE_DB_USER_ACCOUNT_DATABASE_COLLECTION: str({ devDefault: testOnly("ndtx_users") }),
  VITE_DB_DERIV_TRADE_RESULT_DATABASE_COLLECTION: str({ devDefault: testOnly("dv_trade_results") }),
  VITE_DB_SERVER_SESSIONS_DATABASE_TTL: str({ devDefault: testOnly("1 week") }),

  // ========================
  // Deriv API & Trading
  // ========================
  VITE_DERIV_APP_ID: num({ devDefault: testOnly(1089) }),
  VITE_DERIV_APP_TOKEN: str({ devDefault: testOnly("") }),
  VITE_DERIV_APP_URL: url({ devDefault: testOnly("http://localhost:8080/") }),
  VITE_DERIV_APP_TG_URL: url({ devDefault: testOnly("https://t.me/koppo_ai_bot") }),
  VITE_DERIV_APP_LOGIN_URL: url({ devDefault: testOnly("https://localhost:3000/oauth") }),
  VITE_DERIV_APP_OAUTH_URL: str({ devDefault: testOnly("https://oauth.deriv.com/oauth2/authorize?app_id=111480") }),
  VITE_DERIV_APP_OAUTH_CHANNEL: str({ devDefault: testOnly("telegram-bot-oauth") }),
  VITE_DERIV_APP_OAUTH_LOGIN_URL: str({ devDefault: testOnly("/oauth/login") }),
  VITE_DERIV_APP_OAUTH_CALLBACK_INIT_URL: str({ devDefault: testOnly("/oauth/callback-init") }),
  VITE_DERIV_APP_OAUTH_CALLBACK_URL: str({ devDefault: testOnly("/oauth/callback") }),
  VITE_DERIV_APP_ENDPOINT: str({ devDefault: testOnly("wss://ws.derivws.com/websockets/v3?app_id=") }),
  VITE_DERIV_APP_ENDPOINT_DOMAIN: str({ devDefault: testOnly("ws.derivws.com") }),
  VITE_DERIV_APP_ENDPOINT_APP_ID: str({ devDefault: testOnly("68182") }),
  VITE_DERIV_APP_ENDPOINT_LANG: str({ devDefault: testOnly("EN") }),
  VITE_MAX_STAKE: num({ devDefault: testOnly(5000) }),
  VITE_MIN_STAKE: num({ devDefault: testOnly(0.35) }),
  VITE_MAX_RECOVERY_TRADES: num({ devDefault: testOnly(4) }),

  // ========================
  // Circuit Breaker (Risk Management)
  // ========================
  // Loss Limits
  VITE_MAX_ABSOLUTE_LOSS: num({ devDefault: testOnly(1000) }),
  VITE_MAX_DAILY_LOSS: num({ devDefault: testOnly(500) }),
  VITE_MAX_CONSECUTIVE_LOSSES: num({ devDefault: testOnly(5) }),
  VITE_MAX_BALANCE_PERCENTAGE_LOSS: num({ devDefault: testOnly(0.5) }),

  // Rapid Loss Protection
  VITE_RAPID_LOSS_TIME_WINDOW_MS: num({ devDefault: testOnly(30000) }),
  VITE_RAPID_LOSS_THRESHOLD: num({ devDefault: testOnly(2) }),
  VITE_RAPID_LOSS_INITIAL_COOLDOWN_MS: num({ devDefault: testOnly(30000) }),
  VITE_RAPID_LOSS_MAX_COOLDOWN_MS: num({ devDefault: testOnly(300000) }),
  VITE_RAPID_LOSS_COOLDOWN_MULTIPLIER: num({ devDefault: testOnly(2) }),

  // General Cooldown
  VITE_COOLDOWN_PERIOD_MS: num({ devDefault: testOnly(60000) }),

  // ========================
  // Third-Party Integrations
  // ========================
  VITE_TELEGRAM_BOT_TOKEN: str({ devDefault: testOnly("") }),
  VITE_PUSHER_TOKEN: str({ devDefault: testOnly("") }),
  VITE_PUSHER_CLUSTER: str({ devDefault: testOnly("ap2") }),
  VITE_PUSHER_APP_ID: str({ devDefault: testOnly("") }),
  VITE_PUSHER_APP_SECRET: str({ devDefault: testOnly("") }),
});