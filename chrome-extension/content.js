// Content script for Synapse extension
// This runs on every page and listens for clipboard events

// Listen for keyboard shortcut (Ctrl+Shift+X) to save selection
document.addEventListener('keydown', async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'X') {
    e.preventDefault();
    
    const selection = window.getSelection().toString().trim();
    
    if (selection) {
      // Send message to background script to save
      chrome.runtime.sendMessage({
        action: 'saveSelection',
        data: {
          title: selection.substring(0, 100),
          rawContent: selection,
          url: window.location.href,
          tags: ['selection', 'highlight'],
        },
      });
    }
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ selection });
  }
  
  if (request.action === 'getPageContent') {
    // Extract main content
    const article = document.querySelector('article');
    const main = document.querySelector('main');
    const content = article || main || document.body;
    
    const text = content.innerText;
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = metaDesc ? metaDesc.getAttribute('content') : '';
    
    sendResponse({
      content: (description + '\n\n' + text).substring(0, 5000),
    });
  }
  
  return true;
});
