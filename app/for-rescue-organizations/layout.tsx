import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For Rescue Organizations — All-in-One Rescue Software',
  description:
    'Second Tail helps animal rescue organizations manage foster networks, intake, medical records, supply requests, reimbursements, appointments, and volunteer communication in one platform.',
  alternates: { canonical: '/for-rescue-organizations' },
  openGraph: {
    title:
      'For Rescue Organizations — All-in-One Rescue Software | Second Tail',
    description:
      'All-in-one foster management platform for animal rescues: intake, medical records, supplies, reimbursements, and messaging.',
    url: '/for-rescue-organizations',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'For Rescue Organizations — All-in-One Rescue Software | Second Tail',
    description:
      'All-in-one foster management platform for animal rescues: intake, medical records, supplies, reimbursements, and messaging.',
  },
}

export default function ForRescueOrganizationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
