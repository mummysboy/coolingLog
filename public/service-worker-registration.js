/**
 * Service Worker Registration Script
 * This file is loaded in the client and registers the service worker
 * Only registers in production
 */

function registerServiceWorker() {
  // Only register in production and if browser supports service workers
  const isDev = process.env.NODE_ENV === 'development';
  const isSupported = 'serviceWorker' in navigator;

  if (isDev) {
    console.log('[SW Registration] Skipping registration in development mode');
    return;
  }

  if (!isSupported) {
    console.warn('[SW Registration] Service Workers not supported in this browser');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW Registration] Service Worker registered successfully:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[SW Registration] New Service Worker installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is ready, notify user
              console.log('[SW Registration] New version available');
              notifyUpdateAvailable();
            }
          });
        });

        // Handle controlled state
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW Registration] Service Worker controller changed');
        });
      })
      .catch((error) => {
        console.error('[SW Registration] Service Worker registration failed:', error);
      });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Registration] Message from Service Worker:', event.data);
    });
  });
}

/**
 * Notify user that update is available
 */
function notifyUpdateAvailable() {
  // Create a simple notification
  const updateNotification = document.createElement('div');
  updateNotification.id = 'sw-update-notification';
  updateNotification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #3b82f6;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;

  updateNotification.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
      <span>New version available</span>
      <button id="sw-update-button" style="
        background-color: white;
        color: #3b82f6;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      " onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
        Update
      </button>
    </div>
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(updateNotification);

  // Handle update button click
  document.getElementById('sw-update-button').addEventListener('click', () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    // Remove notification
    updateNotification.remove();
    // Reload after a short delay to allow service worker to update
    setTimeout(() => window.location.reload(), 1000);
  });
}

/**
 * Force update check
 */
function checkForUpdates() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller
      .getRegistration()
      .then((registration) => {
        if (registration) {
          registration.update();
          console.log('[SW Registration] Checking for updates...');
        }
      });
  }
}

// Register service worker on page load
if (typeof window !== 'undefined') {
  registerServiceWorker();

  // Check for updates every minute
  setInterval(checkForUpdates, 60000);
}

// Export for use in hooks
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { registerServiceWorker, checkForUpdates };
}

