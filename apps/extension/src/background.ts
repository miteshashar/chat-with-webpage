// Store current page data
let currentPageData: {
  url: string;
  title: string;
  html: string;
  timestamp: number;
} | null = null;

// Handle messages from web app
function handleStorageMessage(
  message: unknown,
  _sender: unknown,
  sendResponse: (response?: unknown) => void,
) {
  const msg = message as {
    type: string;
    key: string;
    value?: unknown;
    data?: unknown;
  };

  if (msg.type === "PING") {
    sendResponse({ success: true });
    return;
  }

  if (msg.type === "PAGE_DATA") {
    // Store page data from content script
    currentPageData = msg.data as {
      url: string;
      title: string;
      html: string;
      timestamp: number;
    };

    // Notify side panel about page data update
    chrome.runtime
      .sendMessage({
        type: "PAGE_DATA_UPDATED",
        data: currentPageData,
      })
      .catch(() => {
        // Side panel might not be open, ignore error
      });

    sendResponse({ success: true });
    return;
  }

  if (msg.type === "GET_PAGE_DATA") {
    // Side panel requesting current page data - get it from active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => ({
              url: window.location.href,
              title: document.title,
              html: document.documentElement.outerHTML,
              timestamp: Date.now(),
            }),
          });

          if (results[0]?.result) {
            currentPageData = results[0].result;
            sendResponse({ data: currentPageData });
          } else {
            sendResponse({ data: null });
          }
        } catch {
          sendResponse({ data: currentPageData });
        }
      } else {
        sendResponse({ data: currentPageData });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (msg.type === "STORAGE_CHANGED") {
    // Forward notification to web tabs
    chrome.tabs.query({ url: "http://localhost:5173/*" }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "STORAGE_CHANGED",
            key: msg.key,
            value: msg.value,
          });
        }
      });
    });
    sendResponse({ success: true });
    return;
  }

  // IndexedDB operations
  const request = indexedDB.open("AppStorage", 1);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("storage")) {
      db.createObjectStore("storage");
    }
  };

  request.onsuccess = () => {
    const db = request.result;

    if (msg.type === "GET") {
      if (!db.objectStoreNames.contains("storage")) {
        sendResponse({ value: null });
        return;
      }
      const transaction = db.transaction(["storage"], "readonly");
      const store = transaction.objectStore("storage");
      const getRequest = store.get(msg.key);
      getRequest.onsuccess = () =>
        sendResponse({ value: getRequest.result || null });
      getRequest.onerror = () => sendResponse({ value: null });
    } else if (msg.type === "SET") {
      const transaction = db.transaction(["storage"], "readwrite");
      const store = transaction.objectStore("storage");
      const setRequest = store.put(msg.value, msg.key);
      setRequest.onsuccess = () => sendResponse({ success: true });
      setRequest.onerror = () => sendResponse({ success: false });
    } else if (msg.type === "REMOVE") {
      if (!db.objectStoreNames.contains("storage")) {
        sendResponse({ success: true });
        return;
      }
      const transaction = db.transaction(["storage"], "readwrite");
      const store = transaction.objectStore("storage");
      const deleteRequest = store.delete(msg.key);
      deleteRequest.onsuccess = () => sendResponse({ success: true });
      deleteRequest.onerror = () => sendResponse({ success: false });
    } else if (msg.type === "GET_ALL_KEYS") {
      if (!db.objectStoreNames.contains("storage")) {
        sendResponse({ keys: [] });
        return;
      }
      const transaction = db.transaction(["storage"], "readonly");
      const store = transaction.objectStore("storage");
      const keysRequest = store.getAllKeys();
      keysRequest.onsuccess = () => sendResponse({ keys: keysRequest.result });
      keysRequest.onerror = () => sendResponse({ keys: [] });
    }
  };

  request.onerror = () => {
    sendResponse(msg.type === "GET" ? { value: null } : { success: false });
  };

  return true; // Keep message channel open for async response
}

// Handle external messages from web app
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    const allowedOrigins = ["http://localhost:5173"];
    if (!sender.origin || !allowedOrigins.includes(sender.origin)) {
      sendResponse({ error: "UNAUTHORIZED" });
      return;
    }
    return handleStorageMessage(message, sender, sendResponse);
  },
);

// Handle internal messages (from content scripts, etc.)
chrome.runtime.onMessage.addListener(handleStorageMessage);

// Listen for tab changes to ensure UI stays updated
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Send fresh page data when switching tabs
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: activeInfo.tabId },
      func: () => ({
        url: window.location.href,
        title: document.title,
        html: document.documentElement.outerHTML,
        timestamp: Date.now(),
      }),
    });

    if (results[0]?.result) {
      currentPageData = results[0].result;
      // Notify side panel immediately
      chrome.runtime
        .sendMessage({
          type: "PAGE_DATA_UPDATED",
          data: currentPageData,
        })
        .catch(() => {});
    }
  } catch {
    // Ignore errors for restricted pages
  }
});

// Listen for tab updates (navigation within a tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => ({
          url: window.location.href,
          title: document.title,
          html: document.documentElement.outerHTML,
          timestamp: Date.now(),
        }),
      });

      if (results[0]?.result) {
        currentPageData = results[0].result;
        // Notify side panel immediately
        chrome.runtime
          .sendMessage({
            type: "PAGE_DATA_UPDATED",
            data: currentPageData,
          })
          .catch(() => {});
      }
    } catch {
      // Ignore errors for restricted pages
    }
  }
});

// Background script for opening side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    // Open side panel first (must be in direct response to user gesture)
    chrome.sidePanel.open({ windowId: tab.windowId });

    // Then try to inject content script and get page data from current tab
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Send page data immediately
          const pageData = {
            url: window.location.href,
            title: document.title,
            html: document.documentElement.outerHTML,
            timestamp: Date.now(),
          };

          chrome.runtime.sendMessage({
            type: "PAGE_DATA",
            data: pageData,
          });
        },
      });
    } catch {
      // Silently ignore errors (restricted pages)
    }
  }
});
