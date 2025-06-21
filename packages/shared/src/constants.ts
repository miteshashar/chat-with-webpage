/**
 * Application constants
 * Centralized configuration values to avoid magic numbers/strings
 */

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  PLAYWRIGHT_FETCH: 30000,
  JS_RENDERING_WAIT: 3000,
  CHAT_HISTORY_REFRESH: 30000,
  URL_CHANGE_DEBOUNCE: 500,
  WINDOW_FOCUS_REFRESH: 0,
} as const;

// UI Constants
export const UI = {
  MAX_URL_DISPLAY_LENGTH: 40,
  SIDEBAR_WIDTH_EXPANDED: 320, // 80 * 4px = 320px (w-80)
  SIDEBAR_WIDTH_COLLAPSED: 48, // 12 * 4px = 48px (w-12)
  MAX_TITLE_LENGTH: 30,
  CHAT_HISTORY_LIMIT: 20,
} as const;

// Content Limits
export const CONTENT_LIMITS = {
  MAX_CONTENT_LENGTH: 40000,
  TRUNCATE_THRESHOLD: 2000,
} as const;

// Development URLs
export const DEV_URLS = {
  CHAT_WEB_APP: ["localhost:5173", "127.0.0.1:5173"],
  BACKEND_PROXY: "http://localhost:3000",
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  LAST_URL: "lastUrl",
  CHAT_HISTORY: "chatHistory",
  EXTENSION_ID: "extension_id",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  CHAT_WEB_APP_BLOCKED:
    "This extension cannot chat with its own web application. Please navigate to a different webpage to start chatting.",
  UNKNOWN_ERROR: "An unknown error occurred while fetching the webpage.",
  PROXY_SERVER_DOWN:
    "Unable to access webpage. Please ensure the backend proxy server is running on port 3000, or use the Chrome extension.",
} as const;

// Content Type Prefixes
export const STORAGE_PREFIXES = {
  MESSAGE: "msg-",
  MARKDOWN: "markdown-",
} as const;
