import type { Metadata, Viewport } from 'next'
import { Lora, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { validateEnvironmentVariables } from '@/lib/env-validation'
import './globals.css'

// Validate environment variables on startup
validateEnvironmentVariables()

const lora = Lora({ subsets: ['latin'], weight: ['400', '600', '700'] })
const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Second Tail — Fostering and rescue, made easier.',
  description: 'Second Tail connects foster parents with rescue organizations. Manage care plans, supply requests, appointments, and communication — all in one place. Free for fosters.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Second Tail',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#D76B1A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${lora.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
