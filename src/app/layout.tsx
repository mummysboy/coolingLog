import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AmplifyProvider } from './AmplifyProvider'

export const metadata: Metadata = {
  title: 'Food Chilling Log',
  description: 'iPad-first cooking and cooling log for food safety',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-100 overflow-x-hidden h-full">
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  )
}
