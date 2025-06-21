// Content script for browser extension

// Only run on localhost:5173 to avoid interfering with other websites
if (window.location.origin === "http://localhost:5173") {
  // Store extension ID in localStorage for web app communication
  localStorage.setItem("extension_id", chrome.runtime.id);

  // Forward messages from extension to web page
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "STORAGE_CHANGED") {
      window.postMessage(
        {
          type: "STORAGE_CHANGED",
          key: message.key,
          value: message.value,
        },
        "http://localhost:5173",
      );
    }
  });

  // Forward messages from web page to extension
  window.addEventListener("message", (event) => {
    if (
      event.origin === "http://localhost:5173" &&
      event.data?.type === "NOTIFY_EXTENSION"
    ) {
      chrome.runtime.sendMessage({
        type: "STORAGE_CHANGED",
        key: event.data.key,
        value: event.data.value,
      });
    }
  });
}
