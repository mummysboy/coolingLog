import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AmplifyProvider } from './AmplifyProvider'
import { ServiceWorkerInit } from './ServiceWorkerInit'

export const metadata: Metadata = {
  title: 'Food Chilling Log',
  description: 'iPad-first cooking and cooling log for food safety',
  manifest: '/manifest.json',
  applicationName: 'Food Chilling Log',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Food Chilling Log',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
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
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Chilling Log" />
        <meta name="description" content="iPad-first cooking and cooling log for food safety" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Icons */}
        <link rel="apple-touch-icon" href="/logo.avif" />
        <link rel="icon" type="image/avif" href="/logo.avif" />
        
        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
                    .then(function(registration) {
                      console.log('Service Worker registration successful');
                    })
                    .catch(function(err) {
                      console.log('Service Worker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-100 overflow-x-hidden h-full">
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
        <ServiceWorkerInit />
      </body>
    </html>
  )
}
