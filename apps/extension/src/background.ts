// Handle messages from web app
function handleStorageMessage(
  message: unknown,
  _sender: unknown,
  sendResponse: (response?: unknown) => void,
) {
  const msg = message as { type: string; key: string; value?: unknown };

  if (msg.type === "PING") {
    sendResponse({ success: true });
    return;
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

// Background script for opening side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});
