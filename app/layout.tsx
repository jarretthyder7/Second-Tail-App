import type { Metadata, Viewport } from 'next'
import { Lora, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { PostHogProvider } from '@/components/posthog-provider'
import { validateEnvironmentVariables } from '@/lib/env-validation'
import './globals.css'

// Validate environment variables on startup
validateEnvironmentVariables()

const lora = Lora({ subsets: ['latin'], weight: ['400', '600', '700'] })
const geist = Geist({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://getsecondtail.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Second Tail — Fostering and rescue, made easier.',
    template: '%s | Second Tail',
  },
  description:
    'Second Tail connects foster parents with animal rescue organizations. Manage care plans, supply requests, vet appointments, medical records, reimbursements, and messaging — all in one place. Free for fosters. Serving New York, New Jersey, Connecticut, and rescues across the United States.',
  applicationName: 'Second Tail',
  keywords: [
    'animal rescue software',
    'dog fostering platform',
    'foster management',
    'rescue organization tools',
    'foster dashboard',
    'animal welfare',
    'foster care platform',
    'rescue volunteer management',
    'NY animal rescue',
    'tri-state animal rescue',
    'New York foster dogs',
    'New Jersey dog rescue',
    'Connecticut animal rescue',
    'dog adoption',
    'pet fostering',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Second Tail',
  },
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/Dog_Heart_Tail.png', type: 'image/png' }],
    shortcut: '/Dog_Heart_Tail.png',
    apple: [{ url: '/Dog_Heart_Tail.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Second Tail',
    title: 'Second Tail — Fostering and rescue, made easier.',
    description:
      'Free foster dashboard and all-in-one rescue management platform. Care plans, supply requests, appointments, medical records, and messaging.',
    url: '/',
    locale: 'en_US',
    images: [
      {
        url: '/Dog_Heart_Tail.png',
        width: 512,
        height: 512,
        alt: 'Second Tail logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Second Tail — Fostering and rescue, made easier.',
    description:
      'Free foster dashboard and all-in-one rescue management platform.',
    images: ['/Dog_Heart_Tail.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'Second Tail',
        url: siteUrl,
        logo: `${siteUrl}/logo-dog.png`,
        description:
          'Second Tail is a foster management platform connecting animal rescue organizations with foster parents. Serving New York, New Jersey, Connecticut, and rescues across the United States.',
        areaServed: [
          { '@type': 'State', name: 'New York' },
          { '@type': 'State', name: 'New Jersey' },
          { '@type': 'State', name: 'Connecticut' },
          { '@type': 'Country', name: 'United States' },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'Second Tail',
        description:
          'Fostering and rescue, made easier. A shared platform for rescue organizations and foster parents.',
        publisher: { '@id': `${siteUrl}/#organization` },
        inLanguage: 'en-US',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Second Tail',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: siteUrl,
        description:
          'Foster management platform for animal rescues: foster assignments, care plans, supply requests, vet appointments, medical records, reimbursements, newsletters, and messaging.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free for foster parents',
        },
        featureList: [
          'Foster assignment management',
          'Care plans and medical records',
          'Supply request tracking',
          'Vet appointment scheduling',
          'Reimbursement processing',
          'Rescue-to-foster messaging',
          'Volunteer newsletters',
        ],
        audience: {
          '@type': 'Audience',
          audienceType:
            'Animal rescue organizations, foster parents, and volunteers',
        },
      },
    ],
  }

  return (
    <html lang="en">
      <body className={`${lora.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PostHogProvider>{children}</PostHogProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
