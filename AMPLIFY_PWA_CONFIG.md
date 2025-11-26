# AWS Amplify PWA Configuration Guide

This guide explains how to configure AWS Amplify Hosting for optimal PWA performance.

## Amplify Configuration

### 1. Build Settings

Ensure your `amplify.yml` or Amplify Console build settings are configured:

```yaml
version: 1

# Environment variables
env:
  variables:
    NODE_ENV: production

# Frontend build
frontend:
  phases:
    # Pre-build: Install dependencies
    preBuild:
      commands:
        - npm ci
        - echo "Build started on `date`"
    
    # Build: Run Next.js build
    build:
      commands:
        - npm run build
        - echo "Build completed on `date`"
  
  # Build artifacts (Next.js outputs to .next)
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  
  # Cache Node modules for faster builds
  cache:
    paths:
      - node_modules/**/*

# Backend deployment (if using Amplify backend)
backend:
  phases:
    build:
      commands:
        - amplifyPush --simple
```

### 2. Custom Headers Configuration

Add custom headers in Amplify Console:

**Path: `/service-worker.js`**
```
Cache-Control: public, max-age=0, must-revalidate
Service-Worker-Allowed: /
Content-Type: application/javascript
```

**Path: `/manifest.json`**
```
Content-Type: application/manifest+json
Cache-Control: public, max-age=3600
```

**Path: `/**` (All Routes)**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 3. Redirects Configuration

For Next.js App Router, ensure:

**Source: `/<.*>`**
→ Rewrite to `/index.html`
→ Status: 200

This allows client-side routing to work properly.

### 4. Deploy Settings

- **Repository:** Your Git repo (GitHub, GitLab, etc.)
- **Branch:** `main` (or your production branch)
- **Build:** Automatic on push
- **PR Preview:** Enable for testing

## HTTPS & SSL

✅ **Amplify automatically provides HTTPS with SSL/TLS certificates**
- No additional configuration needed
- Required for Service Worker registration
- Enables PWA features on iOS 15+

## Domain Configuration

### Custom Domain Setup

1. Go to **Amplify Console** → Your App
2. **App Settings** → **Domain management**
3. **Add domain** → Enter your custom domain
4. Follow DNS configuration steps

### Connect Your Domain

Update DNS records to point to Amplify:

```
Type: CNAME
Name: your-domain.com (or subdomain)
Value: d123xyz.amplifyapp.com
```

## Monitoring & Diagnostics

### CloudWatch Logs

Amplify stores build and runtime logs in CloudWatch:

1. **AWS Console** → **CloudWatch** → **Log groups**
2. Look for `/aws/amplify/` prefix
3. Monitor for errors in service worker registration

### Check Service Worker Status

After deployment:

1. Visit your app URL
2. Open DevTools (F12)
3. Go to **Application** → **Service Workers**
4. Verify "Active and running"

### Monitor Cache Usage

1. **DevTools** → **Application** → **Cache Storage**
2. Should see `food-chilling-log-v1` cache
3. Check cached assets

## Performance Optimization

### 1. Image Optimization

Amplify automatically optimizes images via:
- CloudFront CDN
- Automatic AVIF/WebP conversion
- Caching on edge locations

### 2. Static Asset Caching

The Next.js build creates optimized output:

```
.next/
├── static/     (long-term cached)
├── server/     (dynamic)
└── public/     (static assets)
```

These are served from CloudFront edge locations globally.

### 3. Service Worker Caching

Combined with Amplify's CDN, your PWA provides:

- **First load:** ~3-5s (network + Amplify CDN)
- **Cached loads:** <1s (service worker cache)
- **Offline:** Instant from service worker

## Database Integration (DynamoDB)

Your app already uses DynamoDB via AWS Amplify. PWA works seamlessly:

### Offline Form Submissions

The service worker supports background sync:

1. Form filled offline → stored in IndexedDB
2. Connection restored → background sync triggered
3. Data sent to DynamoDB
4. User notified

See `public/service-worker.js` for the `sync` event handler.

## Deployment Checklist

Before pushing to production:

### Pre-Deployment

- [ ] Icons created (192x192, 512x512, maskable variants)
- [ ] `manifest.json` validated
- [ ] Service worker tested locally with `npm run build && npm run start`
- [ ] `next.config.js` headers configured
- [ ] Layout includes manifest link
- [ ] ServiceWorkerInit component added
- [ ] No console errors in production build
- [ ] All GraphQL endpoints tested

### Amplify Console

- [ ] Build settings configured
- [ ] Custom headers added for SW and manifest
- [ ] HTTPS enabled (automatic)
- [ ] Domain configured (if needed)
- [ ] Environment variables set (NODE_ENV=production)

### Post-Deployment

- [ ] Service Worker registered in production
- [ ] DevTools shows "Active and running"
- [ ] Cache Strategy working (check Network tab)
- [ ] App installable on iOS and Android
- [ ] Offline mode works (DevTools offline toggle)
- [ ] Updates detect and notify user

## Testing on iOS/iPad

### Prerequisites
- iPad or iPhone
- Safari browser
- App deployed to Amplify

### Installation Steps

1. Open Safari
2. Navigate to your app URL
3. Tap **Share** (bottom button)
4. Tap **Add to Home Screen**
5. Enter app name (or use default)
6. Tap **Add**

### Verification

- App appears as icon on home screen
- Opens in standalone mode (no browser UI)
- Works offline (if cached)
- Can accept form input
- Data syncs when online

## Testing on Android

### Prerequisites
- Android device
- Chrome or Edge browser
- App deployed to Amplify

### Installation Steps

1. Open Chrome/Edge
2. Navigate to your app URL
3. Tap menu (⋮ three dots)
4. Tap **Install app**
5. Confirm installation

### Verification

- App icon in app drawer
- Opens in standalone mode
- Works offline
- Push notifications supported

## Troubleshooting

### Issue: Service Worker Won't Register

**Cause:** Not HTTPS
**Solution:** Amplify provides HTTPS automatically, ensure you're using your Amplify domain

**Cause:** Service worker file not found
**Solution:** Verify `public/service-worker.js` exists and is committed to repo

### Issue: App Not Installable

**Cause:** manifest.json missing
**Solution:** Check in DevTools Manifest tab for errors

**Cause:** Icons not found
**Solution:** Verify icon paths in manifest match actual files

### Issue: iOS Installation Not Working

**Cause:** Using old iOS version (<15)
**Solution:** Service Worker requires iOS 15+, PWA still works with fallback

**Cause:** App icon missing
**Solution:** Add 192x192 icon to public folder and manifest

### Issue: Cache Not Updating

**Cause:** Old cache still being used
**Solution:** Change CACHE_VERSION in service-worker.js, redeploy

### Issue: Form Data Lost Offline

**Cause:** No background sync setup
**Solution:** See Background Sync section in service-worker.js

## Performance Metrics

### Monitoring with CloudWatch

```
1. AWS Console → CloudWatch
2. Create custom metrics for:
   - Service Worker registration success rate
   - Cache hit ratio
   - Offline page loads
   - Form submission success rate
```

### Recommended Metrics

```javascript
// Track in your app
window.navigationTiming = {
  firstContentfulPaint: performance.timing.responseEnd - performance.timing.navigationStart,
  pageLoadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
  serviceWorkerActive: 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
};
```

## Cost Optimization

### Amplify Pricing

- **Build:** Free tier: 1,000 build minutes/month
- **Hosting:** Free tier: 15 GB data/month
- **Data transfer:** First 1 GB free/month

### PWA Reduces Costs

- Service Worker caching reduces bandwidth
- Offline support reduces server load
- DynamoDB batching optimizes API calls

## Security Best Practices

✅ **HTTPS Only** - Amplify enforces
✅ **No Sensitive Data in Cache** - Service worker avoids caching auth tokens
✅ **Content Security Policy** - Can be added via Amplify headers
✅ **Security Headers** - Already configured in next.config.js

## Next Steps

1. **Deploy to Amplify** - Push code, trigger build
2. **Test PWA Features** - Install app on iOS/Android
3. **Monitor Performance** - Check CloudWatch logs
4. **Gather User Feedback** - Refine based on usage
5. **Optimize** - Fine-tune cache strategies

## Resources

- [AWS Amplify Hosting Docs](https://docs.amplify.aws/hosting/)
- [Next.js Deployment on Amplify](https://docs.amplify.aws/deploying-backends/deployment/hosting-information/amplify-config/)
- [PWA on Amplify](https://docs.amplify.aws/guides/hosting/progressive-web-apps/q/platform/js/)
- [Service Worker on Amplify](https://docs.amplify.aws/guides/hosting/service-workers/q/platform/js/)

