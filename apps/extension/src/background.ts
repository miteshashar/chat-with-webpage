// Handle storage messages from web app
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // Security: Only allow messages from your web app domain
    const allowedOrigins = ["http://localhost:5173"];

    if (!sender.origin || !allowedOrigins.includes(sender.origin)) {
      console.warn(
        "Blocked storage request from unauthorized origin:",
        sender.origin,
      );
      sendResponse({ error: "UNAUTORIZED", message: "Unauthorized origin" });
      return;
    }

    if (message.type === "GET") {
      chrome.storage.local.get([message.key]).then((result) => {
        sendResponse({ value: result[message.key] || null });
      });
    } else if (message.type === "SET") {
      chrome.storage.local.set({ [message.key]: message.value }).then(() => {
        sendResponse({ success: true });
      });
    } else if (message.type === "REMOVE") {
      chrome.storage.local.remove([message.key]).then(() => {
        sendResponse({ success: true });
      });
    }
    return true; // Keep message channel open for async response
  },
);

// Background script for opening side panel
chrome.action.onClicked.addListener(function (tab) {
  if (tab.id) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});
