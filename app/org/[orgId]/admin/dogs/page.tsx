'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Backward compatibility redirect: /dogs → /animals
export default function DogsRedirect() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string

  useEffect(() => {
    router.replace(`/org/${orgId}/admin/animals`)
  }, [orgId, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  )
}
