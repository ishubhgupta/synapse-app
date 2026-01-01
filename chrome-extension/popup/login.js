// Configuration - Automatically detect environment
const API_BASE_URL = chrome.runtime.getManifest().version.includes('dev') 
  ? 'http://localhost:3000'
  : 'https://synapse-bookmark.vercel.app';

// DOM elements
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const loadingEl = document.getElementById('loading');
const messageEl = document.getElementById('message');
const openAppLink = document.getElementById('openApp');
const signupLink = document.getElementById('signupLink');

// Check if already authenticated
chrome.storage.local.get(['authenticated'], (result) => {
  if (result.authenticated) {
    // Already logged in, redirect to main popup
    window.location.href = 'popup.html';
  }
});

// Form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showMessage('error', 'Please fill in all fields');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/extension/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store authentication token for extension
      await chrome.storage.local.set({ 
        authToken: data.token,
        user: data.user,
        authenticated: true 
      });
      
      showMessage('success', 'Login successful! Redirecting...');
      
      // Redirect to main popup
      setTimeout(() => {
        window.location.href = 'popup.html';
      }, 1000);
    } else {
      showMessage('error', data.error || 'Login failed');
      setLoading(false);
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage('error', 'Failed to connect to Synapse');
    setLoading(false);
  }
});

// Open app link
openAppLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: API_BASE_URL });
});

// Signup link
signupLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${API_BASE_URL}/signup` });
});

// Helper functions
function showMessage(type, text) {
  messageEl.textContent = text;
  messageEl.className = `message ${type} show`;
  
  if (type === 'success') {
    setTimeout(() => {
      messageEl.classList.remove('show');
    }, 3000);
  }
}

function setLoading(loading) {
  loginBtn.disabled = loading;
  loginBtn.textContent = loading ? '...' : 'Log In';
  loadingEl.classList.toggle('show', loading);
  
  if (loading) {
    messageEl.classList.remove('show');
  }
}
