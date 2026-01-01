// Synapse Extension Popup

// Configuration - Production first
const API_BASE_URL = 'https://synapse-bookmark.vercel.app';

let currentUser = null;
let authToken = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  
  // Redirect to login if not authenticated
  if (!authToken) {
    window.location.href = 'login.html';
    return;
  }
  
  render();
});

async function checkAuth() {
  // Get stored token
  const result = await chrome.storage.local.get(['authToken', 'user']);
  
  if (result.authToken && result.user) {
    authToken = result.authToken;
    currentUser = result.user;
    return;
  }
  
  authToken = null;
  currentUser = null;
}

function render() {
  const app = document.getElementById('app');

  if (!authToken || !currentUser) {
    app.innerHTML = renderAuthView();
    attachAuthEventListeners();
  } else {
    app.innerHTML = renderMainView();
    attachMainEventListeners();
    loadRecentBookmarks();
  }
}

function renderAuthView() {
  return `
    <div class="auth-section">
      <p>Sign in to Synapse to start saving bookmarks</p>
      <button class="btn btn-primary" id="openLogin">Open Synapse</button>
      <button class="btn btn-secondary" id="manualAuth">I'm already logged in</button>
    </div>
  `;
}

function renderMainView() {
  return `
    <div class="user-info">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>${currentUser.email}</span>
    </div>

    <div id="message"></div>

    <div class="quick-actions">
      <h3>Quick Actions</h3>
      <div class="action-item" id="saveCurrentPage">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span>Save Current Page</span>
      </div>
      <div class="action-item" id="openDashboard">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span>Open Dashboard</span>
      </div>
      <div class="action-item" id="logout">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </div>
    </div>

    <div class="shortcuts">
      <div class="shortcuts-title">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Keyboard Shortcuts
      </div>
      <div class="shortcuts-list">
        <div class="shortcut-item">
          <span class="shortcut-key">Ctrl+Shift+S</span>
          <span class="shortcut-desc">Save current page</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-key">Ctrl+Shift+X</span>
          <span class="shortcut-desc">Save selected text</span>
        </div>
        <div class="shortcut-item">
          <span class="shortcut-desc">💡 Right-click image → Save to Synapse</span>
        </div>
      </div>
    </div>

    <div class="recent-bookmarks">
      <h3>Recent Bookmarks</h3>
      <div id="bookmarkList">
        <div class="loading">Loading...</div>
      </div>
    </div>
  `;
}

function attachAuthEventListeners() {
  document.getElementById('openLogin')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/login` });
  });

  document.getElementById('manualAuth')?.addEventListener('click', async () => {
    await checkAuth();
    if (authToken) {
      render();
    } else {
      showMessage('error', 'Please log in first in the Synapse web app');
    }
  });
}

function attachMainEventListeners() {
  document.getElementById('saveCurrentPage')?.addEventListener('click', async () => {
    const btn = document.getElementById('saveCurrentPage');
    btn.style.opacity = '0.5';

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];

      // Skip chrome:// and edge:// URLs
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
        showMessage('error', 'Cannot save browser internal pages');
        btn.style.opacity = '1';
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: tab.title || 'Untitled Page',
          url: tab.url || '',
        }),
      });

      if (response.ok) {
        showMessage('success', '✨ Bookmark saved successfully!');
        setTimeout(() => loadRecentBookmarks(), 500);
      } else {
        const error = await response.json();
        showMessage('error', error.error || 'Failed to save bookmark');
        console.error('Save error:', error);
      }
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      showMessage('error', 'Failed to save: ' + error.message);
    } finally {
      btn.style.opacity = '1';
    }
  });

  document.getElementById('openDashboard')?.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` });
  });

  document.getElementById('logout')?.addEventListener('click', async () => {
    // Clear stored auth data
    await chrome.storage.local.remove(['authToken', 'user', 'authenticated']);
    authToken = null;
    currentUser = null;
    window.location.href = 'login.html';
  });
}

async function loadRecentBookmarks() {
  const listEl = document.getElementById('bookmarkList');
  if (!listEl) return;

  try {
    const result = await chrome.storage.local.get(['authToken']);
    const token = result.authToken;
    
    const response = await fetch(`${API_BASE_URL}/api/bookmarks?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to fetch');

    const data = await response.json();
    const bookmarks = data.bookmarks || [];

    if (bookmarks.length === 0) {
      listEl.innerHTML = '<p style="text-align: center; color: #6b7280; font-size: 13px;">No bookmarks yet</p>';
      return;
    }

    listEl.innerHTML = bookmarks
      .map(
        (b) => `
      <div class="bookmark-item">
        <div class="bookmark-title">${escapeHtml(b.title)}</div>
        ${b.url ? `<div class="bookmark-url">${escapeHtml(b.url)}</div>` : ''}
      </div>
    `
      )
      .join('');
  } catch (error) {
    listEl.innerHTML = '<p style="text-align: center; color: #ef4444; font-size: 13px;">Failed to load bookmarks</p>';
  }
}

function showMessage(type, text) {
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  messageEl.innerHTML = `<div class="${type}">${escapeHtml(text)}</div>`;

  setTimeout(() => {
    messageEl.innerHTML = '';
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
