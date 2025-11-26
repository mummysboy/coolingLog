# PWA Setup Guide for Food Chilling Log

This guide explains how to make the Food Chilling Log a fully functional PWA on iPad and other devices.

## What's Been Implemented

### 1. **Service Worker** (`public/sw.js`)
- Handles offline functionality
- Implements intelligent caching strategies:
  - **Cache-first** for static assets (images, styles, fonts)
  - **Network-first** for API calls and documents
- Supports background sync for offline form submissions
- Automatically updates when new versions are deployed

### 2. **Web Manifest** (`public/manifest.json`)
- Defines app metadata for PWA installation
- Includes app icons in multiple sizes
- Configures standalone display mode
- Provides app shortcuts for quick access

### 3. **Meta Tags & PWA Configuration** (in `src/app/layout.tsx`)
- Apple-specific PWA meta tags for iOS/iPad
- Standard PWA meta tags
- Favicon and apple-touch-icon configuration
- Theme color settings
- Service Worker auto-registration with update detection

### 4. **Offline Fallback** (`public/offline.html`)
- User-friendly offline page
- Auto-reload on connection restoration

## Setup Instructions

### Step 1: Generate PWA Icons

You need to create app icons in these sizes:
- 192x192 px (`/public/icons/icon-192.png`)
- 512x512 px (`/public/icons/icon-512.png`)
- 192x192 px maskable (`/public/icons/icon-192-maskable.png`)
- 512x512 px maskable (`/public/icons/icon-512-maskable.png`)
- 96x96 px (`/public/icons/icon-96.png`) - for shortcuts

**Option A: Use an online PWA icon generator**
1. Visit https://app-manifest.firebaseapp.com/
2. Upload your logo
3. Download the generated icons
4. Place them in `/public/icons/`

**Option B: Use command line (if you have ImageMagick installed)**
```bash
mkdir -p public/icons

# Generate icons from your logo.avif (converting from AVIF first)
convert public/logo.avif -resize 192x192 public/icons/icon-192.png
convert public/logo.avif -resize 512x512 public/icons/icon-512.png
convert public/logo.avif -resize 192x192 public/icons/icon-192-maskable.png
convert public/logo.avif -resize 512x512 public/icons/icon-512-maskable.png
convert public/logo.avif -resize 96x96 public/icons/icon-96.png
```

**Option C: Use Node.js script**
Create a file `scripts/generate-icons.js` and run it to generate icons from your logo.

### Step 2: Update HTTPS Configuration

PWAs **must be served over HTTPS** to work (except on localhost for development).

For production:
- Ensure your hosting provider supports HTTPS
- Many platforms (Vercel, Netlify, AWS Amplify) provide free HTTPS

### Step 3: Test on Your Device

#### On iPad (Safari):
1. Navigate to your PWA URL: `https://your-domain.com`
2. Tap the Share button (rectangle with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Confirm the app name and tap "Add"
5. The app will appear on your home screen as a native-like app

#### On Android (Chrome/Edge):
1. Navigate to your PWA URL
2. A "Install" button should appear in the address bar
3. Tap it to install
4. Or use the menu: ⋮ → "Install app"

#### Testing offline functionality:
1. Install the PWA on your device
2. Open DevTools (on desktop) or use remote debugging
3. Go to Application → Service Workers
4. Check "Offline" to simulate offline mode
5. Navigate around - it should still work!

### Step 4: Optional - Customize Appearance

Edit `public/manifest.json` to customize:
- `name`: Full app name
- `short_name`: Name shown under home screen icon
- `theme_color`: App's primary color
- `background_color`: Loading screen background color
- `display`: Set to "standalone", "fullscreen", etc.

Edit `src/app/layout.tsx` to customize:
- Apple status bar style
- Status bar color
- App icons and splash screens

### Step 5: Monitor Service Worker Updates

The app includes automatic update detection:
- Checks for updates every 60 seconds
- Prompts user to refresh when updates are available (optional)
- You can manually trigger refresh with `navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })`

## Testing Checklist

- [ ] Icons display correctly on home screen
- [ ] App launches in full screen (no browser bars on iPad)
- [ ] App name displays correctly
- [ ] App works offline (forms can be filled, data persists)
- [ ] Images load from cache when offline
- [ ] API calls retry when connection is restored
- [ ] App notifies user when updates are available
- [ ] Shortcuts work (New Entry, Admin Dashboard)
- [ ] Status bar styling looks good on iOS

## Development Tips

### Service Worker Debugging
```javascript
// In browser console
navigator.serviceWorker.ready.then(reg => {
  console.log('SW active:', reg.active);
  reg.active.postMessage({ type: 'SKIP_WAITING' });
});
```

### Cache Management
```javascript
// Clear all caches
caches.keys().then(names => names.forEach(name => caches.delete(name)));
```

### Disable SW in Development
In `src/app/layout.tsx`, you can conditionally register the SW:
```javascript
if (process.env.NODE_ENV === 'production') {
  // register SW
}
```

## Troubleshooting

**"Add to Home Screen" option not appearing:**
- Ensure you're on HTTPS (except localhost)
- Check that `manifest.json` is valid (copy URL to browser address bar)
- Make sure icons are accessible
- Clear browser cache and reload

**App crashes after installation:**
- Check browser console for errors
- Ensure all dependencies are properly bundled
- Verify service worker is working (DevTools → Application → Service Workers)

**Offline features not working:**
- Verify SW is installed and active (DevTools → Application → Service Workers)
- Check that routes/resources are being cached
- Ensure IndexedDB is enabled in browser

## Resources

- [MDN PWA Documentation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev PWA Learning Path](https://web.dev/progressive-web-apps/)
- [Apple PWA Support Guide](https://developer.apple.com/news/?id=2jqehda6)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Next Steps

After setting up icons and deploying:
1. Test on iPad with "Add to Home Screen"
2. Verify offline functionality
3. Monitor service worker updates
4. Gather user feedback on PWA experience

