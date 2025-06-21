// Simple storage API - auto-detects environment (extension vs web)
export { get, set, remove, onChange } from "./storage";

// Token-specific helpers
export { getToken, setToken, removeToken, isValidToken } from "./token";

// Chat-specific helpers
export {
  saveMessage,
  getMessagesForUrl,
  getAllChatHistory,
  type Message,
  type ChatHistoryEntry,
} from "./chat";

// Markdown cache helpers
export {
  saveMarkdownCache,
  getMarkdownCache,
  type CachedMarkdown,
} from "./markdown";
