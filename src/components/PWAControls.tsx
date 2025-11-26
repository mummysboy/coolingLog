'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useState } from 'react';

/**
 * Example component demonstrating service worker controls
 * Can be added to admin or settings pages
 */
export function PWAControls() {
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const { triggerUpdate, clearCache, checkForUpdates, registration } = useServiceWorker({
    onUpdateFound: () => {
      addLog('✅ Update available');
    },
    onRegistrationSuccess: (reg) => {
      addLog(`✅ Service Worker registered: ${reg.scope}`);
    },
    onRegistrationFailed: (error) => {
      addLog(`❌ Registration failed: ${error.message}`);
    },
  });

  const addLog = (message: string) => {
    setLogMessages((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev,
    ]);
  };

  const handleClearCache = () => {
    clearCache();
    addLog('🗑️ Cache clearing requested');
  };

  const handleCheckUpdates = () => {
    checkForUpdates();
    addLog('🔄 Checking for updates...');
  };

  const handleTriggerUpdate = () => {
    triggerUpdate();
    addLog('↻ Update triggered, reloading...');
  };

  const getServiceWorkerStatus = () => {
    if (!('serviceWorker' in navigator)) {
      return 'Not Supported';
    }
    if (navigator.serviceWorker.controller) {
      return 'Active';
    }
    if (registration) {
      return 'Registered';
    }
    return 'Not Registered';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4">PWA Settings</h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-600">Service Worker Status</p>
        <p className="text-lg font-semibold text-blue-600">{getServiceWorkerStatus()}</p>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleCheckUpdates}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
        >
          🔄 Check for Updates
        </button>
        <button
          onClick={handleClearCache}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors font-medium"
        >
          🗑️ Clear Cache
        </button>
        <button
          onClick={handleTriggerUpdate}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium"
        >
          ↻ Trigger Update
        </button>
      </div>

      {/* Logs */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2 text-sm">Activity Log</h3>
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs h-48 overflow-y-auto">
          {logMessages.length === 0 ? (
            <p className="text-gray-500">No activity yet...</p>
          ) : (
            logMessages.map((msg, i) => (
              <div key={i} className="mb-1">
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
        <p className="font-semibold mb-1">ℹ️ About PWA</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Service Worker handles offline support</li>
          <li>App can be installed on home screen</li>
          <li>Updates check automatically every 60 seconds</li>
          <li>Cache is versioned for easy updates</li>
        </ul>
      </div>
    </div>
  );
}

