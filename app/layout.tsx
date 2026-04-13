import type { Metadata, Viewport } from 'next'
import { Lora, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const lora = Lora({ subsets: ['latin'], weight: ['400', '600', '700'] })
const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Second Tail Foster Portal',
  description: 'Supporting fosters and rescues in one place',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
