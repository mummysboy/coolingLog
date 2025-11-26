# 📱 iPad-Specific PWA Optimization Guide

This guide covers iPad-specific optimizations, quirks, and best practices for your PWA.

## 🎯 iPad Screen Sizes

### Common iPad Models
| Model | Screen Size | Resolution | Orientation |
|-------|------------|-----------|-------------|
| iPad mini | 7.9" | 2048×1536 | Portrait/Landscape |
| iPad Air | 10.9" | 2732×2048 | Portrait/Landscape |
| iPad Pro 11" | 11" | 2388×1668 | Portrait/Landscape |
| iPad Pro 12.9" | 12.9" | 2732×2048 | Portrait/Landscape |

### Responsive Design Considerations

```css
/* iPad mini - touch-friendly */
@media (min-width: 768px) and (max-width: 1024px) {
  /* Optimize for 7.9" - 10.9" */
  body { font-size: 16px; }
  button { padding: 12px 24px; }
}

/* iPad Pro - more space */
@media (min-width: 1024px) {
  /* Optimize for 11" and larger */
  body { font-size: 18px; }
  max-width: 1200px;
}

/* iPad in landscape */
@media (orientation: landscape) {
  /* Optimize layout for landscape */
  display: flex;
  gap: 1rem;
}
```

## 🔒 Safe Area (Notch/Home Indicator)

iPad Pro models have rounded corners and a home indicator area that your app should respect.

### In CSS
```css
/* Respect safe area on all sides */
.container {
  padding: 
    max(1rem, env(safe-area-inset-top))
    max(1rem, env(safe-area-inset-right))
    max(1rem, env(safe-area-inset-bottom))
    max(1rem, env(safe-area-inset-left));
}

/* Particularly important for fixed elements */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: env(safe-area-inset-top);
  z-index: 100;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

/* Full-bleed background but safe content */
.hero {
  background: cover;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

### In JavaScript
```typescript
import { getSafeAreaInsets } from '@/lib/pwaUtils'

const insets = getSafeAreaInsets()
console.log(insets)
// { top: "44px", right: "0px", bottom: "20px", left: "0px" }
```

## ⌨️ Input & Keyboard Considerations

### iPad Keyboard Behavior
```html
<!-- Disable zoom on input (keep 16px minimum) -->
<meta name="viewport" content="width=device-width, initial-scale=1, 
  maximum-scale=5, user-scalable=yes, viewport-fit=cover">

<!-- Disable autocorrect/autocapitalize if needed -->
<input type="email" autocomplete="off" autocorrect="off" 
  autocapitalize="off" spellcheck="false">

<!-- Use appropriate input types -->
<input type="tel">      <!-- Shows phone keypad -->
<input type="email">    <!-- Shows email keypad with @ -->
<input type="number">   <!-- Shows numeric keypad -->
<input type="date">     <!-- Shows date picker -->
<input type="time">     <!-- Shows time picker -->
```

### Handle Keyboard Appearance
```typescript
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      // Visual viewport height changes when keyboard appears
      const visualViewport = (window as any).visualViewport
      if (visualViewport) {
        const keyboardHeight = window.innerHeight - visualViewport.height
        setKeyboardHeight(Math.max(0, keyboardHeight))
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return keyboardHeight
}
```

## 📐 Orientation Changes

### Handle Landscape/Portrait
```typescript
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateOrientation = () => {
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      setOrientation(isPortrait ? 'portrait' : 'landscape')
    }

    updateOrientation()
    window.addEventListener('orientationchange', updateOrientation)
    window.addEventListener('resize', updateOrientation)

    return () => {
      window.removeEventListener('orientationchange', updateOrientation)
      window.removeEventListener('resize', updateOrientation)
    }
  }, [])

  return orientation
}
```

### Lock Orientation (if needed)
```typescript
// Note: Only works in fullscreen/PWA mode on some devices
export async function lockOrientation() {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('portrait-primary')
    }
  } catch (error) {
    console.error('Failed to lock orientation:', error)
  }
}
```

## 👆 Touch Optimization

### Touch-Friendly Sizes
```css
/* Minimum touch target: 44x44 points */
button, a, input[type="checkbox"], input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Larger on iPad for comfort */
@media (min-width: 1024px) {
  button, a {
    min-width: 48px;
    min-height: 48px;
    padding: 14px;
  }
}

/* No hover-only actions (iPad has no hover) */
/* Instead: use active, focus, or explicit touch handlers */
button {
  transition: background-color 0.2s;
}

button:active {
  background-color: darken(@color, 10%);
}
```

### Prevent Touch Delays
```css
/* Remove 300ms tap delay */
* {
  touch-action: manipulation;
}

/* For clickable elements */
a, button, [role="button"] {
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
}
```

## 📋 Split View & Multitasking

iPad supports Split View (two apps side-by-side) and Slide Over (floating window).

### Detect Split View
```typescript
export function useSplitViewDetection() {
  const [isSplitView, setIsSplitView] = useState(false)

  useEffect(() => {
    const checkSplitView = () => {
      // Less than full screen width usually means split view
      const isSmall = window.innerWidth < 768
      setIsSplitView(isSmall && /iPad/.test(navigator.userAgent))
    }

    checkSplitView()
    window.addEventListener('resize', checkSplitView)
    return () => window.removeEventListener('resize', checkSplitView)
  }, [])

  return isSplitView
}
```

### Optimize for Split View
```css
/* Stack vertically in split view (< 768px) */
@media (max-width: 767px) {
  .layout {
    flex-direction: column;
  }
  .sidebar {
    display: none;
  }
}

/* Side-by-side in full screen (>= 768px) */
@media (min-width: 768px) {
  .layout {
    display: flex;
    flex-direction: row;
  }
  .sidebar {
    display: block;
  }
}
```

## 📸 Camera & Microphone

### Request Permissions
```typescript
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // Back camera on iPad
    })
    // Stop the stream once permission is granted
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Camera permission denied:', error)
    return false
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    return false
  }
}
```

## 🔊 Audio Playback

### Auto-Play Audio (requires user interaction first)
```typescript
// iPad requires user gesture before audio plays
export async function playAudio(audioPath: string) {
  try {
    const audio = new Audio(audioPath)
    await audio.play()
  } catch (error) {
    console.error('Audio playback failed:', error)
    // Fall back to silence notification or button
  }
}

// Better: make it part of user interaction
document.getElementById('playButton')?.addEventListener('click', () => {
  const audio = new Audio('/notification.mp3')
  audio.play()
})
```

## 💾 Data Persistence

### IndexedDB (Recommended)
```typescript
// Using idb library (already in your dependencies)
import { openDB, DBSchema } from 'idb'

interface LogDB extends DBSchema {
  logs: {
    key: string
    value: LogEntry
  }
}

const db = await openDB<LogDB>('chilling-logs', 1, {
  upgrade(db) {
    db.createObjectStore('logs')
  },
})

// Persist data
await db.put('logs', logEntry, logEntry.id)

// Retrieve data
const entry = await db.get('logs', entryId)

// Sync with server
const allLogs = await db.getAll('logs')
```

### Request Persistent Storage
```typescript
import { requestPersistentStorage } from '@/lib/pwaUtils'

async function ensurePersistent() {
  const isPersistent = await requestPersistentStorage()
  console.log('Persistent storage granted:', isPersistent)
  // On iOS: Usually requires explicit user approval
  // On Android: May be auto-granted or require approval
}
```

## 🎨 Status Bar Customization

### Change Status Bar Style (iOS-specific)
```tsx
// In layout.tsx
export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // or 'black' or 'default'
    title: 'Food Chilling Log',
  },
}

// Or in HTML head
<meta name="apple-mobile-web-app-status-bar-style" 
      content="black-translucent">
```

Options:
- `default` - Standard light status bar (dark text)
- `black` - Opaque black status bar
- `black-translucent` - Translucent black (overlays content)

### Hide/Show Elements Based on Status Bar
```typescript
export function useStatusBar() {
  const [statusBarHeight, setStatusBarHeight] = useState(0)

  useEffect(() => {
    const insets = getSafeAreaInsets()
    const topInset = parseInt(insets.top)
    setStatusBarHeight(topInset)
  }, [])

  return statusBarHeight
}

// Use in component
const statusBarHeight = useStatusBar()
return (
  <div style={{ paddingTop: `${statusBarHeight}px` }}>
    Content below status bar
  </div>
)
```

## 🖨️ Print Support

iPad users may want to print logs:

```typescript
export function usePrint() {
  const handlePrint = () => {
    window.print()
  }

  return handlePrint
}

// Add print styles
@media print {
  body {
    background: white;
    color: black;
  }
  
  .no-print {
    display: none;
  }
  
  .print-break-inside {
    break-inside: avoid;
  }
}
```

## ⚙️ iPad-Specific Configuration

### Update manifest.json
```json
{
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "scope": "/",
  "categories": ["productivity"],
  
  // iOS-specific
  "screenshots": [
    {
      "src": "/icons/screenshot-ipad-portrait.png",
      "sizes": "1024x1366",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/icons/screenshot-ipad-landscape.png",
      "sizes": "1366x1024",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### Launch Images for iPad
```tsx
// In layout.tsx
<link
  rel="apple-touch-startup-image"
  href="/icons/ipad-portrait.png"
  media="(device-width: 1024px) and (device-height: 1366px) and (orientation: portrait)"
/>
<link
  rel="apple-touch-startup-image"
  href="/icons/ipad-landscape.png"
  media="(device-width: 1366px) and (device-height: 1024px) and (orientation: landscape)"
/>
```

## 🧪 Testing on iPad

### Safari DevTools (Remote Debugging)
1. On Mac: Plug in iPad via USB
2. Open Safari → Develop → [Your iPad] → [Your Site]
3. Use full DevTools in Safari
4. Real-time debugging!

### Before PWA Install
1. Test in Safari browser first
2. Check console for errors
3. Test offline mode
4. Then install as PWA

### After PWA Install
1. Test full-screen mode
2. Test status bar styling
3. Test orientation changes
4. Test Split View (Settings → General → iPad → Enable Split View, then open two apps)

## 💡 iPad-Specific Best Practices

1. **Design for touch** - Buttons min 44x44pt
2. **Respect safe areas** - Use `env()` variables
3. **Handle orientation** - Support both portrait & landscape
4. **Optimize layouts** - Use CSS Grid/Flexbox
5. **Test orientation changes** - Smooth transitions
6. **Use appropriate inputs** - type="email", type="tel", etc.
7. **Avoid hover states** - Use active/focus instead
8. **Plan for keyboards** - Don't cover critical UI
9. **Test Split View** - May show different layout
10. **Support multitasking** - App may be paused/resumed

## 📊 Performance Tips for iPad

```typescript
// 1. Lazy load images
<Image src={url} loading="lazy" />

// 2. Use WebP for performance
<picture>
  <source srcSet={webpUrl} type="image/webp" />
  <img src={pngUrl} alt="..." />
</picture>

// 3. Debounce resize events
import { debounce } from 'lodash'
window.addEventListener('resize', debounce(() => {
  // Handle resize
}, 250))

// 4. Monitor performance
if ('performance' in window) {
  const metrics = performance.getEntriesByType('navigation')[0]
  console.log('Load time:', metrics.loadEventEnd - metrics.fetchStart)
}
```

## 🐛 iPad-Specific Issues & Fixes

### Issue: App won't install on iPad
- Ensure HTTPS
- Check manifest.json is valid
- Verify all icons exist
- Try different Safari version

### Issue: Keyboard hides form inputs
```typescript
export function useScrollToElement() {
  const scrollToElement = (element: HTMLElement) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return scrollToElement
}

// Use in input focus handler
<input onFocus={(e) => scrollToElement(e.target)} />
```

### Issue: Status bar color not changing
- Only works in PWA mode (not Safari browser)
- Must use valid values: "default", "black", "black-translucent"
- iOS may ignore preferences

### Issue: Split View breaks layout
- Test responsive breakpoints thoroughly
- Verify layout works at all widths
- Use mobile-first approach
- Test at 768px width specifically

## Resources

- [Apple Developer: Designing Web Content for Safari](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/)
- [MDN: CSS Environment Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/env())
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [Can I Use: iPad Features](https://caniuse.com/)

---

**Your iPad PWA is now fully optimized! 🎉**

