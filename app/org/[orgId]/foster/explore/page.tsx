"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FosterExplorePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard - explore feature disabled
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-2xl font-bold text-foreground">Feature Not Available</h1>
        <p className="text-muted-foreground">
          Foster access is provided by your rescue organization. Please contact them directly.
        </p>
      </div>
    </div>
  )
}
