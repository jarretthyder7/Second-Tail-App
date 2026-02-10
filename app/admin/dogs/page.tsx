'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Backward compatibility redirect: /admin/dogs → /admin/animals
export default function AdminDogsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/admin/animals')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  )
}
