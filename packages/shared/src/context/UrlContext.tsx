import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import TurndownService from "turndown";
import { UrlContext } from "./UrlContextTypes";
import { saveMarkdownCache, getMarkdownCache } from "../storage";
import { fetchWebpage, WebScrapingError } from "../utils";

interface UrlProviderProps {
  children: ReactNode;
}

// Initialize turndown service outside component to avoid recreation
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

const convertHtmlToMarkdown = (html: string): string => {
  try {
    return turndownService.turndown(html);
  } catch {
    return html; // Fallback to HTML if conversion fails
  }
};

const processPageData = async (
  url: string,
  title: string,
  html: string,
  setters: {
    setCurrentUrlState: (url: string) => void;
    setCurrentTitle: (title: string) => void;
    setCurrentHtml: (html: string) => void;
    setCurrentMarkdown: (markdown: string) => void;
  },
) => {
  // Check cache first
  const cached = await getMarkdownCache(url);

  if (cached && cached.url === url) {
    // Use cached data
    setters.setCurrentUrlState(url);
    setters.setCurrentTitle(cached.title);
    setters.setCurrentHtml(html); // Always use fresh HTML
    setters.setCurrentMarkdown(cached.markdown);
  } else {
    // Process fresh data and cache it
    const markdown = convertHtmlToMarkdown(html);

    setters.setCurrentUrlState(url);
    setters.setCurrentTitle(title);
    setters.setCurrentHtml(html);
    setters.setCurrentMarkdown(markdown);

    // Cache the processed markdown
    try {
      await saveMarkdownCache(url, markdown, title);
    } catch (error) {
      console.error("Error saving markdown cache:", error);
    }
  }
};

const isWebEnvironment = () => {
  return !(
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    chrome.runtime.getManifest
  );
};

const saveToLocalStorage = (key: string, value: unknown) => {
  if (isWebEnvironment()) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  }
};

const getFromLocalStorage = (key: string) => {
  if (isWebEnvironment()) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Failed to read from localStorage:", error);
      return null;
    }
  }
  return null;
};

export function UrlProvider({ children }: UrlProviderProps) {
  const [currentUrl, setCurrentUrlState] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [currentMarkdown, setCurrentMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setCurrentUrl = async (url: string) => {
    // Only allow manual URL setting in web environment, not extension
    const isExtension =
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.getManifest;

    if (isExtension) {
      // In extension, URLs are set automatically by background script
      return;
    }

    setIsLoading(true);
    setError(null);

    // Check cache first
    const cached = await getMarkdownCache(url);

    if (cached && cached.url === url) {
      // Use cached data
      setCurrentUrlState(url);
      setCurrentTitle(cached.title);
      setCurrentHtml(""); // We don't cache HTML
      setCurrentMarkdown(cached.markdown);
      saveToLocalStorage("lastUrl", url);
      setIsLoading(false);
      return;
    }

    // Cache miss - try to fetch the webpage (WEB ONLY)
    try {
      const result = await fetchWebpage(url);
      await processPageData(url, result.title, result.html, {
        setCurrentUrlState,
        setCurrentTitle,
        setCurrentHtml,
        setCurrentMarkdown,
      });
      saveToLocalStorage("lastUrl", url);
    } catch (error) {
      if (error instanceof WebScrapingError) {
        setError(error.message);
      } else {
        setError("An unknown error occurred while fetching the webpage.");
      }

      // Clear state on error
      setCurrentUrlState(null);
      setCurrentTitle(null);
      setCurrentHtml(null);
      setCurrentMarkdown(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load last URL from localStorage (web only)
    if (isWebEnvironment()) {
      const lastUrl = getFromLocalStorage("lastUrl");
      if (lastUrl && typeof lastUrl === "string") {
        setCurrentUrl(lastUrl);
        return;
      }
    }

    // Auto-detect environment
    const isExtension =
      typeof chrome !== "undefined" &&
      chrome.runtime &&
      chrome.runtime.getManifest;

    if (isExtension) {
      // Extension: Get page data from background script
      const getPageData = async () => {
        try {
          const response = await chrome.runtime.sendMessage({
            type: "GET_PAGE_DATA",
          });
          if (response?.data) {
            // Check if we're on the chat web app
            if (
              response.data.url.includes("localhost:5173") ||
              response.data.url.includes("127.0.0.1:5173")
            ) {
              setCurrentUrlState(response.data.url);
              setCurrentTitle(response.data.title);
              setCurrentHtml("");
              setCurrentMarkdown("");
              setError(
                "This extension cannot chat with its own web application. Please navigate to a different webpage to start chatting.",
              );
            } else {
              setError(null); // Clear any previous error
              await processPageData(
                response.data.url,
                response.data.title,
                response.data.html,
                {
                  setCurrentUrlState,
                  setCurrentTitle,
                  setCurrentHtml,
                  setCurrentMarkdown,
                },
              );
            }
          }
        } catch {
          // Silently handle errors
        } finally {
          setIsLoading(false);
        }
      };

      // Listen for page data updates from background script
      const handlePageDataUpdate = async (message: {
        type: string;
        data?: { url: string; title: string; html: string };
      }) => {
        if (message.type === "PAGE_DATA_UPDATED" && message.data) {
          // Check if we're on the chat web app
          if (
            message.data.url.includes("localhost:5173") ||
            message.data.url.includes("127.0.0.1:5173")
          ) {
            setCurrentUrlState(message.data.url);
            setCurrentTitle(message.data.title);
            setCurrentHtml("");
            setCurrentMarkdown("");
            setError(
              "This extension cannot chat with its own web application. Please navigate to a different webpage to start chatting.",
            );
          } else {
            setError(null); // Clear any previous error
            await processPageData(
              message.data.url,
              message.data.title,
              message.data.html,
              {
                setCurrentUrlState,
                setCurrentTitle,
                setCurrentHtml,
                setCurrentMarkdown,
              },
            );
          }
        }
      };

      chrome.runtime.onMessage.addListener(handlePageDataUpdate);

      // Get initial page data
      getPageData();

      // Set a shorter timeout since we have reliable tab listeners now
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        chrome.runtime.onMessage.removeListener(handlePageDataUpdate);
      };
    } else {
      // Web: No auto-detection, wait for user input
      setIsLoading(false);
    }
  }, []);

  return (
    <UrlContext.Provider
      value={{
        currentUrl,
        currentTitle,
        currentHtml,
        currentMarkdown,
        setCurrentUrl,
        isLoading,
        error,
      }}
    >
      {children}
    </UrlContext.Provider>
  );
}

// Hook exported from separate file to avoid fast refresh warning
