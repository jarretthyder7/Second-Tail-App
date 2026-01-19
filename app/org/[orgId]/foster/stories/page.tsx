"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

// Mock foster stories data
const stories = [
  {
    id: 1,
    title: "Max's Journey: From Shelter to Forever Home",
    excerpt:
      "When Max came to us, he was terrified of everything. Three months later, he found his forever family and I couldn't be prouder.",
    author: "Sarah M.",
    date: "2 weeks ago",
    image: "/happy-dog-family.png",
  },
  {
    id: 2,
    title: "The Day Bella Learned to Trust Again",
    excerpt:
      "Bella had been through so much trauma. Watching her slowly open up and play again reminded me why I foster.",
    author: "Michael K.",
    date: "1 month ago",
    image: "/rescued-dog-playing.jpg",
  },
  {
    id: 3,
    title: "Luna's First Week: A Foster Fail Story",
    excerpt:
      "I was supposed to foster Luna for a few weeks. That was two years ago. Sometimes the perfect dog finds you.",
    author: "Jennifer L.",
    date: "1 month ago",
    image: "/dog-with-owner-happy.jpg",
  },
  {
    id: 4,
    title: "Fostering Senior Dogs Changed My Life",
    excerpt:
      "People overlook senior dogs, but they have so much love to give. My experience with Charlie taught me that.",
    author: "David R.",
    date: "2 months ago",
    image: "/happy-senior-dog.png",
  },
  {
    id: 5,
    title: "The Puppy Who Taught Me Patience",
    excerpt:
      "Rocky was a handful - energetic, stubborn, and mischievous. But he taught me more about patience than any book could.",
    author: "Amanda T.",
    date: "2 months ago",
    image: "/playful-puppy.jpg",
  },
  {
    id: 6,
    title: "Saying Goodbye Never Gets Easier (But It's Worth It)",
    excerpt: "Every adoption day is bittersweet. But knowing I helped save a life makes every goodbye worth it.",
    author: "Chris P.",
    date: "3 months ago",
    image: "/dog-adoption-day.png",
  },
]

export default function StoriesPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string

  useEffect(() => {
    // Redirect to dashboard - stories feature disabled
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-2xl font-bold text-foreground">Feature Not Available</h1>
        <p className="text-muted-foreground">
          This feature is currently disabled. Focus on caring for your foster animal using your dashboard.
        </p>
      </div>
    </div>
  )
}
