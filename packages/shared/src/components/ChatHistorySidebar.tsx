import { useState, useEffect } from "react";
import { useUrl } from "../context/useUrl";
import { getAllChatHistory, type ChatHistoryEntry } from "../storage";

export function ChatHistorySidebar() {
  const { setCurrentUrl, currentUrl } = useUrl();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryEntry[]>([]);

  // Check if we're in extension environment
  const isExtension =
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.getManifest;

  // Don't show sidebar in extension
  if (isExtension) {
    return null;
  }

  const loadChatHistory = async () => {
    try {
      const history = await getAllChatHistory();
      setChatHistory(history);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // More frequent refresh to catch new messages quickly
  useEffect(() => {
    const interval = setInterval(() => {
      loadChatHistory();
    }, 1000); // Refresh every 1 second for very responsive updates

    return () => clearInterval(interval);
  }, []);

  // Also refresh when window gains focus (user might have used extension)
  useEffect(() => {
    const handleFocus = () => {
      loadChatHistory();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Also refresh when current URL changes (for immediate feedback)
  useEffect(() => {
    if (currentUrl) {
      const timeoutId = setTimeout(loadChatHistory, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [currentUrl]);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`${isCollapsed ? "w-12" : "w-80"} flex-shrink-0 transition-all duration-200`}
    >
      <div className="h-full border-r border-gray-200 bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">
              Chat History
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Chat History List */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto">
            {chatHistory.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No chat history yet</p>
                <p className="mt-1 text-xs">Enter a URL to start chatting</p>
              </div>
            ) : (
              <div className="p-2">
                {chatHistory.map((item: ChatHistoryEntry) => (
                  <button
                    key={`${item.url}-${item.lastMessageTime.getTime()}`}
                    onClick={() => setCurrentUrl(item.url)}
                    className={`mb-2 w-full rounded-lg p-3 text-left transition-colors hover:bg-gray-100 ${
                      currentUrl === item.url
                        ? "border border-blue-200 bg-blue-50"
                        : "border border-gray-200 bg-white"
                    }`}
                  >
                    <div className="space-y-1">
                      <h3
                        className="text-sm font-medium break-words text-gray-900"
                        title={item.title}
                      >
                        {truncateTitle(item.title)}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="break-all">
                          {item.url.startsWith("[Unknown URL")
                            ? "Unknown Source"
                            : (() => {
                                try {
                                  return new URL(item.url).hostname;
                                } catch {
                                  return "Invalid URL";
                                }
                              })()}
                        </span>
                        <span className="font-medium text-blue-600">
                          {item.messageCount} msg
                          {item.messageCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(item.lastMessageTime)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
