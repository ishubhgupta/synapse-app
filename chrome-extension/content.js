// Content script for Synapse extension
// Extracts page content and context

// Extract page context (surrounding content around selection)
function getPageContext(selection = '') {
  const context = {
    title: document.title,
    url: window.location.href,
    description: '',
    mainContent: '',
    selectedText: selection,
    surroundingText: '',
  };

  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    context.description = metaDesc.getAttribute('content') || '';
  }

  // Get main content
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const contentEl = article || main || document.body;
  
  if (contentEl) {
    context.mainContent = contentEl.innerText.substring(0, 3000);
  }

  // If there's a selection, get surrounding text for context
  if (selection) {
    const selObj = window.getSelection();
    if (selObj.rangeCount > 0) {
      const range = selObj.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const parentElement = container.nodeType === 3 ? container.parentElement : container;
      
      if (parentElement) {
        const fullText = parentElement.innerText || parentElement.textContent || '';
        const selectionIndex = fullText.indexOf(selection);
        
        if (selectionIndex !== -1) {
          // Get 200 chars before and after
          const start = Math.max(0, selectionIndex - 200);
          const end = Math.min(fullText.length, selectionIndex + selection.length + 200);
          context.surroundingText = fullText.substring(start, end);
        }
      }
    }
  }

  return context;
}

// Log that content script is loaded
console.log('Synapse content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  try {
    if (request.action === 'getSelection') {
      const selection = window.getSelection().toString();
      const context = getPageContext(selection);
      sendResponse({ text: selection, context });
      return true;
    }
    
    if (request.action === 'getPageContent') {
      const context = getPageContext();
      sendResponse({
        content: context.mainContent,
        description: context.description,
        context,
      });
      return true;
    }
  } catch (error) {
    console.error('Error in content script:', error);
    sendResponse({ error: error.message });
  }
  
  return true;
});
