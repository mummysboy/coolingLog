# 📇 PWA Reference Card

Quick reference for PWA setup and troubleshooting.

## 🚀 3-Step Setup

```bash
# Step 1: Generate Icons
npm install --save-dev sharp
npm run generate-icons

# Step 2: Deploy to HTTPS
vercel --prod          # or: amplify publish, or: netlify (auto)

# Step 3: Test on iPad
# Safari → Your URL → Share → Add to Home Screen → Add
```

## 📁 File Reference

| File | Purpose | Edit? |
|------|---------|-------|
| `public/manifest.json` | PWA metadata | ✏️ Yes (colors, name) |
| `public/sw.js` | Service Worker | 🔒 No |
| `src/app/pwa-client.tsx` | UI components | ✏️ Limited |
| `src/lib/pwaUtils.ts` | Utilities | 🔒 No (use functions) |
| `src/app/layout.tsx` | PWA meta tags | ✏️ Yes (status bar) |
| `next.config.js` | Build config | 🔒 No |
| `scripts/generate-icons.js` | Icon gen | 🔒 No |

## 🎨 Customization Cheat Sheet

### Change App Name & Colors
**File:** `public/manifest.json`
```json
{
  "name": "Your App Name",
  "short_name": "Short",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff"
}
```

### Change Status Bar
**File:** `src/app/layout.tsx`
```tsx
appleWebApp: {
  statusBarStyle: "black-translucent" // or "black" or "default"
}
```

### Add Custom Shortcuts
**File:** `public/manifest.json`
```json
"shortcuts": [
  {
    "name": "My Action",
    "url": "/route",
    "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
  }
]
```

## 📱 Testing Commands

```bash
# Local development
npm run dev
# Open http://localhost:3000
# Test offline in DevTools → Application → Service Workers

# Production build
npm run build && npm run start

# Icon generation
npm run generate-icons

# Check deployment
# Visit https://yourdomain.com/manifest.json
# Visit https://yourdomain.com/sw.js
```

## 🔍 Debugging

### Check Service Worker Status
```javascript
// Open DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Active registrations:', registrations);
  registrations.forEach(reg => console.log(reg.active?.state));
});
```

### Force Update Check
```javascript
navigator.serviceWorker.ready.then(reg => reg.update());
```

### Clear Cache
```javascript
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);
```

### Trigger Immediate Update
```javascript
navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
```

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Add to Home Screen" missing | ✅ Ensure HTTPS (not localhost) |
| | ✅ Check `/manifest.json` loads |
| | ✅ Verify icons in `/public/icons/` |
| | ✅ Hard refresh (Cmd+Shift+R) |
| **Icons don't show** | ✅ Run `npm run generate-icons` |
| | ✅ Check files exist |
| | ✅ Wait for redeploy |
| | ✅ Clear browser cache |
| **Offline not working** | ✅ Check SW in DevTools |
| | ✅ Verify cache policy |
| | ✅ Check console for errors |
| **Status bar color wrong** | ✅ Only works in PWA mode |
| | ✅ Check `layout.tsx` setting |
| | ✅ Refresh app |
| **Safe areas not working** | ✅ Use `env()` CSS |
| | ✅ Import `getSafeAreaInsets()` |
| | ✅ Check viewport config |

## 📊 Performance Checklist

- [ ] Service Worker registered
- [ ] Manifest loads (visit `/manifest.json`)
- [ ] Icons present (5 files in `/public/icons/`)
- [ ] Offline mode works
- [ ] No console errors
- [ ] Load time < 2 seconds
- [ ] Works on iPad mini to Pro
- [ ] Handles orientation change
- [ ] Update detected within 60s
- [ ] No memory leaks

## 🧪 iPad Test Checklist

- [ ] Icon on home screen
- [ ] App launches full-screen
- [ ] Status bar visible
- [ ] Status bar styling correct
- [ ] Safe areas respected
- [ ] Forms fillable
- [ ] Offline works
- [ ] Can scroll
- [ ] Can tap buttons
- [ ] Landscape works
- [ ] Portrait works
- [ ] No zoom needed
- [ ] All text readable

## 💻 Deployment Checklist

- [ ] All local tests pass
- [ ] `npm run build` succeeds
- [ ] No lint errors
- [ ] No TypeScript errors
- [ ] Icons generated
- [ ] Deployed to HTTPS
- [ ] URL accessible
- [ ] Service Worker loads
- [ ] Manifest loads
- [ ] Icons display
- [ ] Works on iPad
- [ ] Offline works
- [ ] No errors in console

## 📚 Documentation Quick Links

| Need | Read |
|------|------|
| Quick start | [START_HERE.md](./START_HERE.md) |
| Setup guide | [PWA_QUICK_START.md](./PWA_QUICK_START.md) |
| Detailed help | [PWA_SETUP_GUIDE.md](./PWA_SETUP_GUIDE.md) |
| Testing | [PWA_CHECKLIST.md](./PWA_CHECKLIST.md) |
| iPad features | [IPAD_OPTIMIZATION_GUIDE.md](./IPAD_OPTIMIZATION_GUIDE.md) |
| Technical | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |
| Overview | [PWA_COMPLETE.md](./PWA_COMPLETE.md) |
| Navigation | [INDEX.md](./INDEX.md) |

## 🔗 Useful URLs

```
Development:      http://localhost:3000
Production:       https://yourdomain.com

Key URLs:
/manifest.json    ← PWA metadata
/sw.js            ← Service Worker
/offline.html     ← Offline page
/icons/           ← App icons
```

## 📋 Useful Code Snippets

### Check if PWA is installed
```typescript
import { isStandalonePWA } from '@/lib/pwaUtils'

if (isStandalonePWA()) {
  console.log('Running as PWA');
}
```

### Detect online/offline
```typescript
import { isOnline, onOnlineStatusChange } from '@/lib/pwaUtils'

if (!isOnline()) {
  console.log('Offline mode');
}

// Listen for changes
const unsubscribe = onOnlineStatusChange(isOnline => {
  console.log('Online:', isOnline);
});
```

### Check if iPad
```typescript
import { isIPad } from '@/lib/pwaUtils'

if (isIPad()) {
  console.log('Running on iPad');
}
```

### Get safe area insets
```typescript
import { getSafeAreaInsets } from '@/lib/pwaUtils'

const insets = getSafeAreaInsets()
console.log('Top:', insets.top) // "44px"
```

### Request storage permission
```typescript
import { requestPersistentStorage } from '@/lib/pwaUtils'

const granted = await requestPersistentStorage()
console.log('Persistent storage:', granted)
```

## 🎯 Key Files to Know

```
CORE PWA:
  public/manifest.json     ← Edit for customization
  public/sw.js             ← Caching logic
  src/app/layout.tsx       ← PWA meta tags

UTILITIES:
  src/lib/pwaUtils.ts      ← Use these functions
  src/app/pwa-client.tsx   ← UI components

SETUP:
  scripts/generate-icons.js ← Run: npm run generate-icons
  package.json             ← Has generate-icons script
  next.config.js           ← PWA headers

DOCS:
  START_HERE.md            ← Read first
  PWA_QUICK_START.md       ← Then read this
  PWA_CHECKLIST.md         ← Use for testing
```

## 🚨 Emergency Commands

```bash
# Hard rebuild
rm -rf .next && npm run build

# Force cache clear
rm -rf node_modules/.cache

# Kill hung process
pkill -f "next dev"

# Full reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate icons
npm run generate-icons

# Check HTTPS (production)
curl -I https://yourdomain.com
curl -I https://yourdomain.com/manifest.json
curl -I https://yourdomain.com/sw.js
```

## 📞 Quick Help

**Service Worker not registering?**
```bash
# Check status
navigator.serviceWorker.ready.then(r => console.log(r))

# Check errors
navigator.serviceWorker.getRegistrations()
  .then(r => r.forEach(reg => console.log(reg)))
```

**Icons not showing?**
```bash
# Verify files exist
ls -la public/icons/

# Run generator
npm run generate-icons

# Check manifest
curl https://yourdomain.com/manifest.json | jq .icons
```

**Offline not working?**
```bash
# Check SW cache contents
// In DevTools:
// Application → Service Workers → check "offline"
// Try navigating

# Check for errors
navigator.serviceWorker.controller?.postMessage({ 
  type: 'CHECK_CACHE' 
})
```

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Read START_HERE.md | 3 min |
| Generate icons | 2 min |
| Local testing | 5 min |
| Deploy | 2-5 min |
| Test on iPad | 5 min |
| **Total** | **~20 min** |

---

**Print this page for reference during setup!** 🖨️

For more details: See the full documentation files listed above.

