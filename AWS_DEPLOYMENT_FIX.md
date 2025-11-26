# AWS Deployment Fix: Build-Time Amplify Configuration Issue

## Problem
The application was failing during AWS Amplify deployment with the warning:
```
Amplify has not been configured. Please call Amplify.configure() before using this service.
```

This occurred during the static page generation phase (`Generating static pages`) of the Next.js build process.

## Root Cause
The issue was caused by **Amplify client initialization happening at module load time** instead of runtime:

1. **`awsService.ts`**: The line `const client = generateClient();` was executed at import time
2. **`multiDatabaseStorageManager.ts`**: Similarly, `const client = generateClient();` was executed at import time
3. **`AmplifyProvider.tsx`**: Amplify configuration was happening outside of `useEffect`, which means it ran during static generation at build time

When Next.js performs static page generation during the build process:
- The server loads all module code
- Amplify client tries to initialize but Amplify hasn't been configured yet
- This causes warnings/errors during the build phase

## Solution
Implemented three key fixes:

### 1. **Lazy-Initialize Amplify Configuration** (`src/app/AmplifyProvider.tsx`)
```typescript
// Before: Configuration happened at module load time
Amplify.configure(awsExports);

// After: Configuration only happens in the browser via useEffect
useEffect(() => {
  if (typeof window !== 'undefined') {
    Amplify.configure(awsExports);
  }
}, []);
```

### 2. **Lazy-Initialize GraphQL Client** (`src/lib/awsService.ts`)
```typescript
// Before: Client created at module load time
const client = generateClient();

// After: Client created on first use
let client: ReturnType<typeof generateClient> | null = null;

function getClient() {
  if (!client) {
    client = generateClient();
  }
  return client;
}

// Replace all usages: client.graphql() → getClient().graphql()
```

### 3. **Lazy-Initialize GraphQL Client** (`src/lib/multiDatabaseStorageManager.ts`)
Same pattern as `awsService.ts`:
- Changed initialization to lazy loading
- Updated all GraphQL calls to use `getClient()`

### 4. **Updated Build Configuration** (`next.config.js`)
Added webpack configuration to suppress unnecessary warnings about Amplify during the build phase.

## Testing the Fix
The deployment should now complete successfully without the Amplify configuration warning during the build process:

1. **Local testing**: `npm run build`
2. **Deployment**: Deploy to AWS Amplify as usual

The application will:
- Build successfully without Amplify errors
- Only initialize Amplify when accessed in the browser
- Work exactly as before in production

## Files Modified
- `src/app/AmplifyProvider.tsx` - Moved Amplify.configure() into useEffect
- `src/lib/awsService.ts` - Lazy-initialized GraphQL client (22+ replacements)
- `src/lib/multiDatabaseStorageManager.ts` - Lazy-initialized GraphQL client (21+ replacements)
- `next.config.js` - Added webpack ignore warnings configuration

## Why This Works
- **Build-time**: No Amplify initialization occurs because `getClient()` is never called
- **Runtime (Browser)**: `AmplifyProvider.useEffect()` configures Amplify first, then pages can use it
- **Module Load**: Amplify client is created on-demand when first GraphQL call is made, not at import time

This ensures the application builds successfully on AWS without requiring Amplify to be pre-configured during the build process.

