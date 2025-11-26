'use client';

import { useEffect, useState } from 'react';

/**
 * Client component that initializes the service worker
 * Handles updates and displays notifications to the user
 */
export function ServiceWorkerInit() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newRegistration, setNewRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Skip if service workers not supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let cleanupInterval: NodeJS.Timeout | null = null;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        setNewRegistration(registration);
        console.log('[ServiceWorkerInit] Service Worker registered:', registration);

        // Listen for updates on this registration
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed and waiting
              setUpdateAvailable(true);
              console.log('[ServiceWorkerInit] Update available');
            }
          });
        });

        // Periodic update checks
        cleanupInterval = setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      } catch (error) {
        console.error('[ServiceWorkerInit] Service Worker registration failed:', error);
      }
    };

    // Wait for page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', registerServiceWorker);
      return () => {
        document.removeEventListener('DOMContentLoaded', registerServiceWorker);
        if (cleanupInterval) clearInterval(cleanupInterval);
      };
    } else {
      registerServiceWorker();
    }

    return () => {
      if (cleanupInterval) clearInterval(cleanupInterval);
    };
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    setUpdateAvailable(false);
    // Reload after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3"
      role="alert"
    >
      <span className="text-sm font-medium">New version available</span>
      <button
        onClick={handleUpdate}
        className="bg-white text-blue-500 px-3 py-1 rounded font-semibold text-xs hover:bg-gray-100 transition-colors"
      >
        Update
      </button>
    </div>
  );
}

