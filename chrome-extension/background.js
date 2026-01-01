// Synapse Chrome Extension - Background Service Worker

// Configuration - Production first, then local fallback
const API_ENDPOINTS = [
  'https://synapse-bookmark.vercel.app',  // Production (primary)
  'http://localhost:3000'                 // Local fallback
];

let ACTIVE_API_BASE_URL = API_ENDPOINTS[0];

// Test which endpoint is available
async function detectAvailableEndpoint() {
  for (const endpoint of API_ENDPOINTS) {
    try {
      const response = await fetch(`${endpoint}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      // If we get any response (even 401), the server is alive
      if (response) {
        console.log('✅ API endpoint available:', endpoint);
        ACTIVE_API_BASE_URL = endpoint;
        return endpoint;
      }
    } catch (error) {
      console.log('❌ Endpoint unavailable:', endpoint);
    }
  }
  console.warn('⚠️ No API endpoint available, using:', ACTIVE_API_BASE_URL);
  return ACTIVE_API_BASE_URL;
}

// Detect endpoint on startup
detectAvailableEndpoint();

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

  chrome.contextMenus.create({
    id: 'save-image-with-context',
    title: 'Save image with context to Synapse',
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

  // Show instant notification
  showNotification('Saving...', 'Adding to Synapse', 'info');
  
  // Save in background
  try {
    switch (info.menuItemId) {
      case 'save-page':
        saveCurrentPage(tab).catch(err => showNotification('Failed', err.message, 'error'));
        break;
      case 'save-selection':
        saveSelection(info.selectionText, tab).catch(err => showNotification('Failed', err.message, 'error'));
        break;
      case 'save-link':
        saveLink(info.linkUrl, tab).catch(err => showNotification('Failed', err.message, 'error'));
        break;
      case 'save-image':
        saveImage(info.srcUrl, tab).catch(err => showNotification('Failed', err.message, 'error'));
        break;
      case 'save-image-with-context':
        saveImageWithContext(info.srcUrl, tab).catch(err => showNotification('Failed', err.message, 'error'));
        break;
    }
  } catch (error) {
    console.error('Error saving:', error);
    showNotification('Error', 'Failed to save bookmark', 'error');
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('🎹 Keyboard command received:', command);
  
  const isAuthenticated = await checkAuth();
  console.log('🔐 Authentication status:', isAuthenticated);

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, showing notification');
    showNotification('Authentication Required', 'Please log in to Synapse first', 'error');
    chrome.action.openPopup();
    return;
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    if (!tab) {
      console.error('❌ No active tab found');
      showNotification('Error', 'No active tab found', 'error');
      return;
    }
    
    console.log('📄 Active tab:', { url: tab.url, title: tab.title });

    if (command === 'save-bookmark') {
      console.log('💾 Executing save-bookmark command');
      // Show instant notification FIRST
      showNotification('Saving...', 'Adding bookmark to Synapse', 'info');
      console.log('📢 Notification shown, now calling saveCurrentPage');
      
      // Save in background with proper error handling
      try {
        await saveCurrentPage(tab);
        console.log('✅ Save completed successfully');
      } catch (error) {
        console.error('❌ Save failed:', error);
        showNotification('Failed', error.message || 'Could not save bookmark', 'error');
      }
    } else if (command === 'save-selection') {
      console.log('📝 Executing save-selection command');
      // Get selected text with context from content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
        console.log('📥 Selection response:', response);
        
        if (response && response.text) {
          showNotification('Saving Selection...', 'Adding to Synapse', 'info');
          await saveSelectionWithContext(response.text, response.context, tab);
        } else {
          showNotification('No Selection', 'Please select some text first', 'error');
        }
      } catch (error) {
        console.error('❌ Selection save failed:', error);
        showNotification('Error', 'Could not access page content', 'error');
      }
    } else if (command === 'save-clipboard') {
      console.log('📋 Executing save-clipboard command');
      // Read clipboard and save
      try {
        const clipboardText = await navigator.clipboard.readText();
        console.log('📥 Clipboard content length:', clipboardText?.length || 0);
        
        if (clipboardText) {
          showNotification('Saving Clipboard...', 'Adding to Synapse', 'info');
          await saveClipboardContent(clipboardText, tab);
        } else {
          showNotification('Empty Clipboard', 'Clipboard is empty', 'error');
        }
      } catch (clipError) {
        console.error('❌ Clipboard read failed:', clipError);
        showNotification('Error', 'Cannot read clipboard', 'error');
      }
    }
  } catch (error) {
    console.error('❌ Command handler error:', error);
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
    const result = await chrome.storage.local.get(['authToken']);
    if (!result.authToken) {
      return false;
    }
    return true;
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

  // Try to get page content from content script (optional)
  let pageContent = null;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
    if (response && response.content) {
      pageContent = response.content;
      console.log('Got page content, length:', pageContent.length);
    }
  } catch (error) {
    // Content script not available on this page (extension pages, some restricted sites)
    // This is normal and OK - we'll just save without page content
    console.log('No content script on this page (this is OK)');
  }

  const bookmark = {
    title: tab.title || 'Untitled',
    url: tab.url, // Keep the URL as is
  };

  // Only add rawContent if we have it
  if (pageContent) {
    bookmark.rawContent = pageContent;
  }

  await saveBookmark(bookmark);
}

async function saveSelection(text, tab) {
  if (!text) return;

  const bookmark = {
    title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    rawContent: text,
    url: tab?.url || '', // Empty string instead of null
  };

  await saveBookmark(bookmark);
}

async function saveSelectionWithContext(text, context, tab) {
  if (!text) return;

  const bookmark = {
    title: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    rawContent: text,
    url: tab?.url || context?.url || '', // Empty string instead of null
  };

  // Add surrounding context to raw content for better AI analysis
  if (context?.surroundingText) {
    bookmark.rawContent = `Selection: ${text}\n\nContext: ${context.surroundingText}`;
  }

  await saveBookmark(bookmark);
}

async function saveClipboardContent(text, tab) {
  if (!text) return;

  // Check if it's a URL
  const isUrl = /^https?:\/\//i.test(text.trim());

  const bookmark = {
    title: isUrl ? text : text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    url: isUrl ? text : (tab?.url || ''), // Empty string instead of null
    rawContent: isUrl ? undefined : text, // Use undefined instead of null
  };

  await saveBookmark(bookmark);
  showNotification('Saved from Clipboard!', 'Content saved successfully ✨', 'success');
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

async function saveImageWithContext(imageUrl, tab) {
  if (!imageUrl || !tab) return;

  try {
    // Get image context from content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'getImageContext',
      imageUrl: imageUrl,
    });

    // Prepare image bookmark data
    const imageData = {
      imageUrl: imageUrl,
      pageUrl: tab.url,
      pageTitle: tab.title,
      surroundingText: response?.surroundingText || '',
      altText: response?.altText || '',
    };

    // Get auth token
    const result = await chrome.storage.local.get(['authToken']);
    const token = result.authToken;

    if (!token) {
      throw new Error('Not authenticated');
    }

    console.log('📸 Saving image with context:', imageData);

    // Call the image API endpoint
    const apiResponse = await fetch(`${API_BASE_URL}/api/bookmarks/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(imageData),
    });

    if (!apiResponse.ok) {
      const error = await apiResponse.json();
      throw new Error(error.error || 'Failed to save image');
    }

    const data = await apiResponse.json();
    console.log('✅ Image saved with AI analysis:', data);
    showNotification('Image Saved!', 'Analyzing with AI... 🤖✨', 'success');
  } catch (error) {
    console.error('Failed to save image:', error);
    showNotification('Failed', error.message || 'Could not save image', 'error');
  }
}

async function saveBookmark(bookmark) {
  console.log('💾 saveBookmark called with:', { 
    title: bookmark.title, 
    url: bookmark.url,
    hasRawContent: !!bookmark.rawContent,
    contentLength: bookmark.rawContent?.length || 0
  });
  
  // Get auth token
  const result = await chrome.storage.local.get(['authToken']);
  const token = result.authToken;

  if (!token) {
    console.error('❌ No auth token found in storage');
    throw new Error('Not authenticated');
  }

  console.log('🔑 Auth token found, length:', token.length);
  
  // Try each endpoint until one works
  for (let i = 0; i < API_ENDPOINTS.length; i++) {
    const endpoint = i === 0 ? ACTIVE_API_BASE_URL : API_ENDPOINTS[i];
    const apiUrl = `${endpoint}/api/bookmarks`;
    
    console.log(`🌐 Attempt ${i + 1}: Trying ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookmark),
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ API error:', error);
        
        // If auth error, don't try other endpoints
        if (response.status === 401) {
          throw new Error('Invalid token or authentication expired');
        }
        
        // Try next endpoint
        if (i < API_ENDPOINTS.length - 1) {
          console.log('🔄 Trying next endpoint...');
          continue;
        }
        
        throw new Error(error.error || 'Failed to save bookmark');
      }

      const data = await response.json();
      console.log('✅ Bookmark saved successfully:', data);
      
      // Update active endpoint for future requests
      ACTIVE_API_BASE_URL = endpoint;
      
      showNotification('Saved!', 'Bookmark saved successfully ✨', 'success');
      return data;
    } catch (fetchError) {
      console.error(`❌ Fetch error on ${endpoint}:`, fetchError.message);
      
      // If this was the last endpoint, throw the error
      if (i === API_ENDPOINTS.length - 1) {
        throw new Error(`Cannot connect to Synapse. Please ensure the app is running.\n\nTried:\n- ${API_ENDPOINTS.join('\n- ')}`);
      }
      
      // Otherwise continue to next endpoint
      console.log('🔄 Trying next endpoint...');
    }
  }
}

function showNotification(title, message, type = 'info') {
  console.log('🔔 showNotification called:', { title, message, type });
  
  // TEMPORARY: Show badge as visual feedback
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: type === 'error' ? '#ef4444' : '#22c55e' });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '' });
  }, 2000);
  
  // Use chrome.runtime.getURL for proper icon path
  const iconPath = chrome.runtime.getURL('icons/icon48.png');
  
  // Use different notification IDs to allow multiple notifications
  const notificationId = `synapse-${type}-${Date.now()}`;

  const options = {
    type: 'basic',
    iconUrl: iconPath,
    title: `🧠 Synapse - ${title}`,
    message: message,
    priority: 2, // Always high priority
    requireInteraction: false, // Don't require interaction
    silent: false // Make sound
  };

  console.log('Creating Chrome notification with options:', options);

  chrome.notifications.create(notificationId, options, (id) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Notification error:', chrome.runtime.lastError);
      // Fallback: Try without icon
      console.log('Retrying without icon...');
      chrome.notifications.create(`${notificationId}-retry`, {
        type: 'basic',
        iconUrl: '',
        title: title,
        message: message,
        priority: 2
      }, (retryId) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Retry failed:', chrome.runtime.lastError);
        } else {
          console.log('✅ Notification created (no icon):', retryId);
        }
      });
      return;
    }
    console.log('✅ Notification created successfully with ID:', id);
    
    // Auto-clear success/info notifications after 5 seconds
    if (type !== 'error') {
      setTimeout(() => {
        chrome.notifications.clear(id, (wasCleared) => {
          console.log('Notification cleared:', id, wasCleared);
        });
      }, 5000);
    }
  });
}
