// Simple storage API - auto-detects environment (extension vs web)
export { get, set, remove } from "./storage";

// Token-specific helpers
export { getToken, setToken, removeToken, isValidToken } from "./token";
