import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const lora = Lora({ subsets: ['latin'], variable: '--font-lora', weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: 'Second Tail Foster Portal',
  description: 'Supporting fosters and rescues in one place',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${lora.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
