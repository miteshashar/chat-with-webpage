// Background script for opening side panel
chrome.action.onClicked.addListener(function (tab) {
  if (tab.id) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});
