import { useState, useEffect, useRef } from "react";
import { useUrl } from "../context/useUrl";
import { chatWithWebpage } from "../services/openai";
import { saveMessage, getMessagesForUrl, type Message } from "../storage";

export function ChatInterface() {
  const { currentMarkdown, currentTitle, currentUrl } = useUrl();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showRetryOption, setShowRetryOption] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load existing messages when URL changes
  useEffect(() => {
    const loadMessages = async () => {
      // Clear error message when URL changes
      setErrorMessage("");
      setShowRetryOption(false);

      if (!currentUrl) {
        setMessages([]);
        return;
      }

      try {
        const loadedMessages = await getMessagesForUrl(currentUrl);
        setMessages(loadedMessages);

        // Check if last message was from user and show retry option
        if (loadedMessages.length > 0) {
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          if (lastMessage.role === "user") {
            setShowRetryOption(true);
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [currentUrl]);

  // Auto-expand textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 4 * 24); // 4 rows max (24px per row)
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSendMessage = async (retryLastMessage = false) => {
    let messageToSend = input.trim();

    if (!currentMarkdown || !currentUrl) {
      return;
    }

    if (!retryLastMessage) {
      // Regular message send
      if (!messageToSend) {
        return;
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageToSend,
        role: "user",
        timestamp: new Date(),
      };

      // Save user message to storage
      await saveMessage(userMessage, currentUrl);

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
    } else {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === "user");
      if (!lastUserMessage) return;
      messageToSend = lastUserMessage.content;
    }

    setIsLoading(true);
    setErrorMessage("");
    setShowRetryOption(false);

    try {
      let streamingContent = "";
      setStreamingMessage("");

      const responseContent = await chatWithWebpage(
        messageToSend,
        currentMarkdown,
        currentTitle || "Unknown Page",
        currentUrl,
        (chunk: string) => {
          streamingContent += chunk;
          setStreamingMessage(streamingContent);
        },
      );

      // Clear streaming message when done
      setStreamingMessage("");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: "assistant",
        timestamp: new Date(),
      };

      // Save assistant message to storage
      await saveMessage(assistantMessage, currentUrl);

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error generating response:", error);

      // Clear streaming message on error
      setStreamingMessage("");

      // Set error message for retry UI (don't save to storage)
      setErrorMessage(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
      setShowRetryOption(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    handleSendMessage(true);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamingMessage, errorMessage, showRetryOption]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Only render chat interface when we have URL and markdown content
  if (!currentUrl || !currentMarkdown) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Chat messages */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="text-center text-sm text-gray-500">
              Ask me anything about this webpage
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`mt-1 text-xs ${
                      message.role === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-900">
                <div className="whitespace-pre-wrap">{streamingMessage}</div>
                <div className="mt-1 flex items-center space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          {isLoading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-200 px-3 py-2 text-sm text-gray-900">
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          {errorMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-800">
                <div className="mb-2">
                  <strong>Error:</strong> {errorMessage}
                </div>
                <button
                  onClick={handleRetry}
                  className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
          {showRetryOption && !errorMessage && !isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <div className="mb-2">
                  Continue the conversation from your last message?
                </div>
                <button
                  onClick={handleRetry}
                  className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat input */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this webpage..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
