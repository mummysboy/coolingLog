# PWA Setup Guide for Food Chilling Log

## Overview

This document describes the Progressive Web App (PWA) configuration for the Food Chilling Log application. The PWA setup enables the application to be installed on iOS and Android devices via "Add to Home Screen" and provides offline functionality.

## Files Created/Modified

### 1. **public/manifest.json**
The web app manifest file that defines how the PWA appears on the home screen.

**Key features:**
- App name and short name
- Theme colors (blue #3b82f6)
- Display mode: `standalone` (full screen without browser UI)
- App icons (192x192 and 512x512)
- App shortcuts for quick access to form and admin pages
- iOS and Android compatible

**For production:**
- Replace `logo.avif` with proper app icons in 192x192 and 512x512 formats
- Generate maskable icons for adaptive displays
- Consider using a service like [PWA Asset Generator](https://www.pwabuilder.com/)

### 2. **public/service-worker.js**
The service worker that handles offline functionality and caching strategies.

**Features:**
- **Cache versioning:** Easy version updates (change `CACHE_VERSION`)
- **Precaching:** Essential assets cached on install
- **Cache-first strategy:** Static assets served from cache
- **Network-first strategy:** API calls attempt network first, fallback to cache
- **Offline support:** Returns offline fallback for unavailable content
- **Background sync:** Placeholder for syncing form entries offline
- **Message handling:** Supports cache clearing and update triggers

**Caching strategies:**
- Static assets: Cache first
- GraphQL/API: Network first with timeout
- HTML: Network first for fresh content

### 3. **public/service-worker-registration.js**
Client-side script that registers the service worker (legacy approach, now handled by React component).

### 4. **src/hooks/useServiceWorker.ts**
Custom React hook for service worker management in components.

**Usage:**
```typescript
const { triggerUpdate, clearCache, checkForUpdates } = useServiceWorker({
  onUpdateFound: () => console.log('Update available'),
  onRegistrationSuccess: (registration) => console.log('Registered'),
  onRegistrationFailed: (error) => console.error('Failed', error),
});
```

### 5. **src/app/ServiceWorkerInit.tsx**
Client component that handles:
- Service worker registration on hydration
- Update notifications
- Update triggering with UI

### 6. **src/app/layout.tsx**
Updated root layout with:
- Manifest link
- PWA meta tags
- Apple mobile web app tags
- Theme colors
- Service worker registration script
- ServiceWorkerInit component

### 7. **next.config.js**
Updated Next.js configuration with:
- Service worker headers (must-revalidate, Service-Worker-Allowed)
- Manifest headers
- Security headers
- Cache control headers

## Installation on iOS (iPad)

1. **Open Safari** and navigate to your app URL
2. **Tap Share** (bottom navigation)
3. **Select "Add to Home Screen"**
4. **Choose a name** (default: "Chilling Log")
5. **Tap Add**

The app will now appear as an icon on the home screen and open in standalone mode.

## Installation on Android

1. **Open Chrome** and navigate to your app URL
2. **Tap the menu** (three dots, top right)
3. **Select "Install app"** (or "Add to Home screen")
4. **Confirm** the installation

## Development vs Production

**Development:**
- Service worker is NOT registered
- Hot reload works normally
- No caching interferes with development

**Production:**
- Service worker is registered automatically
- Caching strategies are active
- Updates check every minute
- Update notifications appear when new version available

## Testing the PWA

### Test Locally
```bash
npm run build
npm run start
```
Then navigate to http://localhost:3000 in a PWA-capable browser (Chrome, Edge, Safari 15+).

### Browser DevTools
- **Chrome/Edge:** DevTools → Application → Service Workers
- **Firefox:** about:debugging#/runtime/this-firefox
- **Safari:** Develop → Service Worker

### Test Offline
1. Open DevTools
2. Go to Application → Service Workers
3. Check "Offline"
4. Refresh page - content should still load from cache

## AWS Amplify Deployment

### Hosting Configuration

Ensure these headers are set in your Amplify configuration:

```yaml
version: 1

frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*

customHeaders:
  - pattern: '/service-worker.js'
    headers:
      - key: Cache-Control
        value: public, max-age=0, must-revalidate
      - key: Service-Worker-Allowed
        value: /
  - pattern: '/manifest.json'
    headers:
      - key: Content-Type
        value: application/manifest+json
```

### Pre-deployment Checklist

- [ ] Icons are properly sized (192x192 and 512x512)
- [ ] `manifest.json` has correct URLs
- [ ] Service worker file is in `public/` directory
- [ ] Next.js config has proper headers
- [ ] Layout includes manifest link and meta tags
- [ ] Application builds successfully (`npm run build`)
- [ ] Test in production build locally first
- [ ] No console errors in DevTools

## Customization

### Change App Colors
Update `theme_color` and `background_color` in `public/manifest.json`

### Update Cache Strategy
Modify `CACHE_VERSION` in `public/service-worker.js` and redeploy to invalidate cache

### Add More Precached Assets
Add URLs to `PRECACHE_ASSETS` array in `public/service-worker.js`

### Customize Update Notification
Edit `src/app/ServiceWorkerInit.tsx` to match your design system

### Change Service Worker Scope
Update `scope: '/'` in both registration files (modify to `/app/` if needed)

## Troubleshooting

### Service Worker Won't Register
- Check browser console for errors
- Ensure app is served over HTTPS in production
- Verify `SERVICE_WORKER_ALLOWED` header is set
- Check that `/service-worker.js` is accessible

### Cache Not Clearing
- Increment `CACHE_VERSION` in service-worker.js
- Or manually call `clearCache()` from the hook
- Check DevTools → Application → Cache Storage

### iOS Not Installing
- Ensure using Safari (not Chrome)
- Check that manifest.json is valid
- Verify icons are accessible
- Test with PWA on https:// URL

### App Doesn't Work Offline
- Check service worker is active in DevTools
- Verify precache assets are being cached
- Check network tab to see what's cached
- Test by enabling offline mode in DevTools

## Performance Notes

- First load: ~3-5s (network + assets)
- Cached loads: <1s
- Offline mode: Instant fallback
- Update checks: Every 60 seconds (configurable)

## Security Considerations

- Service worker only registers in production
- HTTPS required for PWA (automatic with Amplify)
- No sensitive data cached
- Cache headers prevent stale content
- Security headers included in all responses

## Resources

- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN: Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)

## Next Steps

1. Generate proper icons (192x192, 512x512) with maskable variants
2. Test on iOS device with "Add to Home Screen"
3. Test on Android device
4. Monitor cache hits/misses in production
5. Gather user feedback on offline experience

