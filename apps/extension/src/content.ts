// Content script for browser extension

// Function to send page data to extension
function sendPageData() {
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
}

// Send initial page data
sendPageData();

// Listen for title changes
const titleObserver = new MutationObserver(() => {
  sendPageData();
});

titleObserver.observe(document.querySelector("title") || document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});

// Listen for URL changes (for SPAs)
let lastUrl = window.location.href;
new MutationObserver(() => {
  const currentUrl = window.location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setTimeout(sendPageData, 100); // Small delay for page to update
  }
}).observe(document, { subtree: true, childList: true });

// Only run localhost-specific code on localhost:5173
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
