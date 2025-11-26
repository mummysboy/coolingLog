'use client';

import { useEffect, useRef } from 'react';

interface ServiceWorkerHookOptions {
  onUpdateFound?: () => void;
  onRegistrationSuccess?: (registration: ServiceWorkerRegistration) => void;
  onRegistrationFailed?: (error: Error) => void;
  checkUpdatesInterval?: number;
}

/**
 * Custom hook to register and manage the service worker
 * Only registers in production environments
 */
export function useServiceWorker(options: ServiceWorkerHookOptions = {}) {
  const {
    onUpdateFound,
    onRegistrationSuccess,
    onRegistrationFailed,
    checkUpdatesInterval = 60000, // 1 minute
  } = options;

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only register in production
    const isDev = process.env.NODE_ENV === 'development';
    const isSupported = 'serviceWorker' in navigator;

    if (isDev || !isSupported) {
      console.log('[useServiceWorker]', isDev ? 'Development mode' : 'SW not supported');
      return;
    }

    let isMounted = true;

    /**
     * Register the service worker
     */
    const registerSW = async () => {
      try {
        console.log('[useServiceWorker] Registering service worker...');
        
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        if (!isMounted) return;

        registrationRef.current = registration;
        console.log('[useServiceWorker] Registration successful:', registration);
        onRegistrationSuccess?.(registration);

        /**
         * Listen for updates
         */
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          console.log('[useServiceWorker] New worker installing...');

          newWorker.addEventListener('statechange', () => {
            // New service worker installed and waiting
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[useServiceWorker] Update ready');
              onUpdateFound?.();
            }
          });
        });

        /**
         * Handle controller change
         */
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[useServiceWorker] Controller changed, reloading...');
          window.location.reload();
        });

        /**
         * Listen for messages from service worker
         */
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('[useServiceWorker] Message from SW:', event.data);
        });

        /**
         * Start periodic update checks
         */
        updateCheckIntervalRef.current = setInterval(() => {
          console.log('[useServiceWorker] Checking for updates...');
          registration.update().catch((error) => {
            console.error('[useServiceWorker] Update check failed:', error);
          });
        }, checkUpdatesInterval);
      } catch (error) {
        if (!isMounted) return;
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('[useServiceWorker] Registration failed:', err);
        onRegistrationFailed?.(err);
      }
    };

    registerSW();

    /**
     * Cleanup on unmount
     */
    return () => {
      isMounted = false;
      if (updateCheckIntervalRef.current) {
        clearInterval(updateCheckIntervalRef.current);
      }
    };
  }, [onUpdateFound, onRegistrationSuccess, onRegistrationFailed, checkUpdatesInterval]);

  /**
   * Manually trigger update
   */
  const triggerUpdate = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  /**
   * Clear cache
   */
  const clearCache = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
  };

  /**
   * Force update check
   */
  const checkForUpdates = async () => {
    if (registrationRef.current) {
      try {
        await registrationRef.current.update();
        console.log('[useServiceWorker] Update check completed');
      } catch (error) {
        console.error('[useServiceWorker] Update check failed:', error);
      }
    }
  };

  return {
    registration: registrationRef.current,
    triggerUpdate,
    clearCache,
    checkForUpdates,
  };
}

