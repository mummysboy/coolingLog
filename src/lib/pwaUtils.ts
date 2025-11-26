/**
 * PWA Utilities
 * Helper functions for PWA features
 */

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false

  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches
  )
}

/**
 * Get the current display mode
 */
export function getDisplayMode(): string {
  if (typeof window === 'undefined') return 'browser'

  const modes = [
    'fullscreen',
    'standalone',
    'minimal-ui',
    'browser',
  ]

  for (const mode of modes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) {
      return mode
    }
  }

  return 'browser'
}

/**
 * Request notification permission for PWA
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Send a notification
 */
export function sendNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null

  if (Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      ...options,
    })
  }

  return null
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false

  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Check if running on iPad specifically
 */
export function isIPad(): boolean {
  if (typeof window === 'undefined') return false

  const userAgent = navigator.userAgent
  const navData = navigator as any
  return /iPad/.test(userAgent) || (navData.userAgentData?.mobile === false && /iPad/.test(userAgent))
}

/**
 * Get safe area insets (for notch support)
 */
export function getSafeAreaInsets(): {
  top: string
  right: string
  bottom: string
  left: string
} {
  if (typeof window === 'undefined') {
    return { top: '0px', right: '0px', bottom: '0px', left: '0px' }
  }

  const style = getComputedStyle(document.documentElement)
  
  return {
    top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
    right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
    bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
    left: style.getPropertyValue('env(safe-area-inset-left)') || '0px',
  }
}

/**
 * Trigger SW update check
 */
export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const updated = await registration.update()
    return !!updated
  } catch (error) {
    console.error('Error checking for updates:', error)
    return false
  }
}

/**
 * Force app refresh (useful after update)
 */
export function forceRefresh(): void {
  if (typeof window === 'undefined') return

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING',
    })
  }
}

/**
 * Share data via Web Share API (if available)
 */
export async function shareData(data: ShareData): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!navigator.share) return false

  try {
    await navigator.share(data)
    return true
  } catch (error) {
    console.error('Share failed:', error)
    return false
  }
}

/**
 * Check if device is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

/**
 * Listen for online/offline changes
 */
export function onOnlineStatusChange(
  callback: (isOnline: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Get available storage space
 */
export async function getStorageQuota(): Promise<{
  usage: number
  quota: number
  percentage: number
} | null> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
    }
  } catch (error) {
    console.error('Error getting storage quota:', error)
    return null
  }
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return false
  }

  try {
    if (navigator.storage.persist) {
      return await navigator.storage.persist()
    }
  } catch (error) {
    console.error('Error requesting persistent storage:', error)
  }

  return false
}

