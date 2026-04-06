"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const loadingMessages = [
  "Waking up the good boys...",
  "Fetching your data (no paws required)",
  "Sniffing out the latest updates...",
  "Spinning up the treat dispenser...",
  "Teaching old code new tricks...",
  "Herding all the pixels together...",
  "Checking who's a good boy (it's you)",
  "Loading belly rub statistics...",
  "Calculating optimal zoomie trajectories...",
  "Translating barks to bytes...",
  "Assembling the pack...",
  "Warming up the couch cushion...",
]

export function PageLoader() {
  const [messageIndex, setMessageIndex] = useState(() =>
    Math.floor(Math.random() * loadingMessages.length)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-[#FBF8F4] flex items-center justify-center z-40">
      <div className="flex flex-col items-center gap-6">
        {/* Dog Logo */}
        <div
          className="relative w-28 h-28"
          style={{ animation: "pg-bounce 2s ease-in-out infinite" }}
        >
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dog_Heart_Tail-83tTALSjb3OWV19wHdHGvnulgBPIWT.png"
            alt="Second Tail"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora, serif" }}>
            One moment...
          </h2>
          <p className="text-base text-[#2E2E2E]/70 max-w-xs" style={{ fontFamily: "Lora, serif" }}>
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#D76B1A]"
              style={{
                animation: "pg-dot 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pg-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pg-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
