'use client'

import { useEffect, useState } from 'react'

/**
 * PWA Client Component
 * Handles client-side PWA features like:
 * - Service Worker management
 * - Update notifications
 * - Installation prompts
 * - Offline detection
 */

export function PWAClient() {
  const [swReady, setSwReady] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🟢 Back online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('🔴 Offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Handle beforeinstallprompt (for Android, Windows)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      console.log('📱 Install prompt available')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('⚠️ Service Worker not supported')
      return
    }

    let refreshing = false

    // Listen for service worker controlling this client
    const handleControllerChange = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('✅ Service Worker registered')
        setSwReady(true)

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update()
        }, 60000)

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('🔄 Update available!')
              setUpdateAvailable(true)
              
              // Optional: Show notification to user
              notifyUpdateAvailable()
            }
          })
        })
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error)
      })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [])

  // Show update notification
  const notifyUpdateAvailable = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Update Available', {
          body: 'A new version of the app is ready. Refresh to update.',
          icon: '/icons/icon-192.png',
        })
      }
    }
  }

  // Handle install button click (for Android/Windows)
  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    console.log(`User response: ${outcome}`)
    setDeferredPrompt(null)
  }

  // Refresh to get the update
  const handleRefresh = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SKIP_WAITING',
      })
    }
    setUpdateAvailable(false)
  }

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center text-sm font-medium z-50"
          role="alert"
        >
          📡 You're offline - Data will sync when connection is restored
        </div>
      )}

      {/* Update Available Notification */}
      {updateAvailable && (
        <div
          className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-sm bg-blue-500 text-white rounded-lg shadow-lg p-4 z-50"
          role="alert"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">🎉 Update Available</p>
              <p className="text-sm opacity-90">A new version is ready</p>
            </div>
            <button
              onClick={handleRefresh}
              className="ml-4 px-3 py-1 bg-white text-blue-500 rounded font-semibold text-sm hover:bg-gray-100 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Install Button (Android/Windows) */}
      {deferredPrompt && (
        <button
          onClick={handleInstallClick}
          className="fixed bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold transition-colors z-50"
        >
          📱 Install App
        </button>
      )}
    </>
  )
}

