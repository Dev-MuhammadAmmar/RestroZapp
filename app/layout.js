import './globals.css'
import { Inter } from 'next/font/google'
import ProtectedLayout from '@/components/ProtectedLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Unsa Restaurant - Management & Billing System',
  description: 'Modern restaurant management and billing system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
         <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/icons/icon-192x192.png" />

        {/* Mobile PWA meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Unsa Restaurant" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {/* Wrap everything inside the protected client wrapper */}
        <ProtectedLayout>{children}</ProtectedLayout>
      </body>
    </html>
  )
}
