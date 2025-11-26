import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AmplifyProvider } from './AmplifyProvider'
import { PWAClient } from './pwa-client'

export const metadata: Metadata = {
  title: 'Food Chilling Log',
  description: 'iPad-first cooking and cooling log for food safety',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Food Chilling Log',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
    other: [
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-192.png',
      },
      {
        rel: 'apple-touch-icon',
        url: '/icons/icon-512.png',
        sizes: '512x512',
      },
    ],
  },
  openGraph: {
    title: 'Food Chilling Log',
    description: 'iPad-first cooking and cooling log for food safety',
    url: 'https://foodchillinglog.com',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Chilling Log" />
        <meta name="application-name" content="Food Chilling Log" />
        <meta name="theme-color" content="#ffffff" />
        
        {/* iOS Launch Images */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-192.png"
          media="(device-width: 768px) and (device-height: 1024px)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 1024px) and (device-height: 1366px)"
        />
        
        {/* Standard Icons */}
        <link rel="icon" type="image/png" href="/icons/icon-192.png" sizes="192x192" />
        <link rel="icon" type="image/png" href="/icons/icon-512.png" sizes="512x512" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
        
        {/* Manifest Link */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then((registration) => {
                      console.log('ServiceWorker registration successful:', registration);
                      
                      // Check for updates periodically
                      setInterval(() => {
                        registration.update();
                      }, 60000);
                    })
                    .catch((error) => {
                      console.log('ServiceWorker registration failed:', error);
                    });
                });
                
                // Handle SW updates
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (refreshing) return;
                  refreshing = true;
                  window.location.reload();
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-100 overflow-x-hidden h-full">
        <AmplifyProvider>
          <PWAClient />
          {children}
        </AmplifyProvider>
      </body>
    </html>
  )
}
