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
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 overflow-x-hidden">
        <AmplifyProvider>
          {children}
        </AmplifyProvider>
      </body>
    </html>
  )
}
