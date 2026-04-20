import type { Metadata } from 'next'
import { RescueSpinnerClient } from './RescueSpinnerClient'

export const metadata: Metadata = {
  title: 'Find a Rescue — Second Tail',
  description:
    'Fling the bone onto the map and discover a real rescue animal waiting for a home near you.',
}

export default function RescueSpinnerPage() {
  return <RescueSpinnerClient />
}
