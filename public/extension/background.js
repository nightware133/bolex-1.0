// Bolex AI Extension Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Bolex AI Extension installed successfully.');
  
  // Configure side panel behavior if supported by the browser
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((err) => {
      console.warn('Side panel behavior not supported in this environment:', err);
    });
  }
});
