'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Backward compatibility redirect: /admin/dogs/[id] → /admin/animals/[id]
export default function AdminDogDetailRedirect() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    router.replace(`/admin/animals/${id}`)
  }, [id, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  )
}
