import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Fosters — Free Foster Dashboard',
  description:
    'Second Tail is free for foster parents. Manage your foster dog\u2019s care plan, supply requests, vet appointments, medical records, and rescue communication from one simple dashboard.',
  alternates: { canonical: '/for-fosters' },
  openGraph: {
    title: 'For Fosters — Free Foster Dashboard | Second Tail',
    description:
      'Free dashboard for foster parents: care plans, supply requests, appointments, medical records, and rescue messaging in one place.',
    url: '/for-fosters',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'For Fosters — Free Foster Dashboard | Second Tail',
    description:
      'Free dashboard for foster parents: care plans, supply requests, appointments, and rescue messaging in one place.',
  },
}

export default function ForFostersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
