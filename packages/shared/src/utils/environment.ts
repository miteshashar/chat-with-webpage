/**
 * Environment detection utilities
 * Centralizes environment detection logic to avoid duplication
 */

export const isExtension = (): boolean => {
  return !!(
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.getManifest
  );
};

export const isWeb = (): boolean => {
  return typeof window !== "undefined" && !isExtension();
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

export const getChatWebAppUrls = (): string[] => {
  return [
    "localhost:5173",
    "127.0.0.1:5173",
    // Add other development URLs as needed
  ];
};

export const isOnChatWebApp = (url: string): boolean => {
  return getChatWebAppUrls().some((chatUrl) => url.includes(chatUrl));
};
