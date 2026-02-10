'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Backward compatibility redirect: /dogs/[id] → /animals/[id]
export default function DogDetailRedirect() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const id = params.id as string

  useEffect(() => {
    router.replace(`/org/${orgId}/admin/animals/${id}`)
  }, [orgId, id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  )
}
