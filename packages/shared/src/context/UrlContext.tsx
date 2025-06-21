import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { UrlContext } from "./UrlContextTypes";

interface UrlProviderProps {
  children: ReactNode;
}

export function UrlProvider({ children }: UrlProviderProps) {
  const [currentUrl, setCurrentUrlState] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [currentHtml, setCurrentHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setCurrentUrl = (url: string) => {
    setCurrentUrlState(url);
  };

  useEffect(() => {
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
            setCurrentUrlState(response.data.url);
            setCurrentTitle(response.data.title);
            setCurrentHtml(response.data.html);
          }
        } catch {
          // Silently handle errors
        } finally {
          setIsLoading(false);
        }
      };

      // Listen for page data updates from background script
      const handlePageDataUpdate = (message: {
        type: string;
        data?: { url: string; title: string; html: string };
      }) => {
        if (message.type === "PAGE_DATA_UPDATED" && message.data) {
          setCurrentUrlState(message.data.url);
          setCurrentTitle(message.data.title);
          setCurrentHtml(message.data.html);
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
        setCurrentUrl,
        isLoading,
      }}
    >
      {children}
    </UrlContext.Provider>
  );
}

// Hook exported from separate file to avoid fast refresh warning
