// Synapse Chrome Extension - Background Service Worker

// Configuration
const API_BASE_URL = 'http://localhost:3000'; // Change for production

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Synapse extension installed');

  // Create context menu items
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save to Synapse',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save selection to Synapse',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save link to Synapse',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'save-image',
    title: 'Save image to Synapse',
    contexts: ['image'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    showNotification('Authentication Required', 'Please log in to Synapse first', 'error');
    chrome.action.openPopup();
    return;
  }

  try {
    switch (info.menuItemId) {
      case 'save-page':
        await saveCurrentPage(tab);
        break;
      case 'save-selection':
        await saveSelection(info.selectionText, tab);
        break;
      case 'save-link':
        await saveLink(info.linkUrl, tab);
        break;
      case 'save-image':
        await saveImage(info.srcUrl, tab);
        break;
    }
  } catch (error) {
    console.error('Error saving:', error);
    showNotification('Error', 'Failed to save bookmark', 'error');
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    showNotification('Authentication Required', 'Please log in to Synapse first', 'error');
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (command === 'save-bookmark') {
      await saveCurrentPage(tab);
    } else if (command === 'save-selection') {
      // Get selected text from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      if (response && response.text) {
        await saveSelection(response.text, tab);
      } else {
        showNotification('No Selection', 'Please select some text first', 'error');
      }
    }
  } catch (error) {
    console.error('Error handling command:', error);
    showNotification('Error', 'Failed to save bookmark', 'error');
  }
});

// Messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveCurrentTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      const isAuthenticated = await checkAuth();

      if (!isAuthenticated) {
        sendResponse({ success: false, error: 'Not authenticated' });
        return;
      }

      try {
        await saveCurrentPage(tab);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; // Keep message channel open
  }

  if (message.action === 'saveSelection') {
    (async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        sendResponse({ success: false, error: 'Not authenticated' });
        return;
      }

      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        await saveSelection(message.text, tab);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.action === 'saveClipboard') {
    (async () => {
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        sendResponse({ success: false, error: 'Not authenticated' });
        return;
      }

      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText) {
          await saveSelection(clipboardText, tab);
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, error: 'Clipboard is empty' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});

// Core functions

async function checkAuth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include',
    });
    
    if (response.ok) {
      await chrome.storage.local.set({ authenticated: true });
      return true;
    } else {
      await chrome.storage.local.remove('authenticated');
      return false;
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

async function saveCurrentPage(tab) {
  if (!tab || !tab.url) {
    throw new Error('Invalid tab');
  }

  // Skip chrome:// and edge:// URLs
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    showNotification('Cannot Save', 'Cannot save browser internal pages', 'error');
    return;
  }

  // Try to get page content from content script
  let pageContent = null;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
    if (response && response.content) {
      pageContent = response.content;
    }
  } catch (error) {
    console.log('Could not get page content:', error);
  }

  const bookmark = {
    title: tab.title || 'Untitled',
    url: tab.url,
    rawContent: pageContent,
  };

  await saveBookmark(bookmark);
}

async function saveSelection(text, tab) {
  if (!text) return;

  const bookmark = {
    title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    rawContent: text,
    url: tab?.url,
  };

  await saveBookmark(bookmark);
}

async function saveLink(url, tab) {
  const bookmark = {
    title: url,
    url: url,
  };

  await saveBookmark(bookmark);
}

async function saveImage(url, tab) {
  const bookmark = {
    title: 'Image from ' + (tab?.title || 'webpage'),
    url: url,
  };

  await saveBookmark(bookmark);
}

async function saveBookmark(bookmark) {
  const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send cookies
    body: JSON.stringify(bookmark),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save bookmark');
  }

  showNotification('Saved!', 'Bookmark saved successfully ✨', 'success');
  return await response.json();
}

function showNotification(title, message, type = 'info') {
  const iconPath = type === 'success' ? 'icons/icon48.png' : 'icons/icon48.png';

  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconPath,
    title: title,
    message: message,
    priority: 2,
  });
}
