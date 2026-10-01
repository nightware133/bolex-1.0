// Bolex AI Extension - Background Service Worker v2.0
// Manages Context Menus, Side Panel routing, and Cross-tab triggers

chrome.runtime.onInstalled.addListener(() => {
  console.log('Bolex AI Extension v2.0 installed successfully.');

  // Set side panel behavior to allow side panel on action click if supported
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch((err) => {
      console.warn('Side panel behavior config notice:', err);
    });
  }

  // Create Context Menus
  if (chrome.contextMenus) {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'bolex_ask_selection',
        title: '⚡ Ask Bolex about "%s"',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'bolex_summarize_selection',
        title: '📝 Summarize with Bolex',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'bolex_explain_code',
        title: '💻 Explain Code with Bolex',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'bolex_summarize_page',
        title: '🌐 Summarize Entire Page with Bolex',
        contexts: ['page']
      });
    });
  }
});

// Handle Context Menu clicks
if (chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    let actionType = 'ask';
    let promptText = '';

    if (info.menuItemId === 'bolex_ask_selection') {
      actionType = 'ask';
      promptText = `Please analyze and explain this selection:\n\n"${info.selectionText}"`;
    } else if (info.menuItemId === 'bolex_summarize_selection') {
      actionType = 'summarize';
      promptText = `Please provide a clear, structured summary with key takeaways of the following text:\n\n"${info.selectionText}"`;
    } else if (info.menuItemId === 'bolex_explain_code') {
      actionType = 'explain_code';
      promptText = `Please analyze this code snippet, explain what it does step by step, and point out any potential bugs, edge cases, or performance improvements:\n\n\`\`\`\n${info.selectionText}\n\`\`\``;
    } else if (info.menuItemId === 'bolex_summarize_page') {
      actionType = 'summarize_page';
      promptText = 'SUMMARIZE_PAGE_TRIGGER';
    }

    if (promptText) {
      // Store pending query for popup / side panel to pick up
      await chrome.storage.local.set({
        bolex_pending_action: {
          type: actionType,
          text: promptText,
          timestamp: Date.now(),
          tabTitle: tab?.title || '',
          tabUrl: tab?.url || ''
        }
      });

      // Try opening side panel if available
      if (tab?.id && chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
        try {
          await chrome.sidePanel.open({ tabId: tab.id });
        } catch (e) {
          console.warn('Side panel open error:', e);
        }
      }
    }
  });
}

// Handle shortcut commands
if (chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (command === 'open_side_panel' && tab?.id && chrome.sidePanel && typeof chrome.sidePanel.open === 'function') {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
      } catch (err) {
        console.warn('Failed to open side panel via shortcut:', err);
      }
    }
  });
}
