"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

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

export function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    // Prevent flash: only show if load takes > 300ms
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    // Rotate messages every 2.5 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-[#FBF8F4] flex items-center justify-center z-50 animate-fade-in">
      <div className="flex flex-col items-center gap-6">
        {/* Dog Logo with gentle bounce animation */}
        <div className="relative w-28 h-28 animate-bounce-gentle">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dog_Heart_Tail-83tTALSjb3OWV19wHdHGvnulgBPIWT.png"
            alt="Second Tail Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora" }}>
            One moment...
          </h2>
          <p
            className="text-base text-[#2E2E2E]/70 h-6 transition-opacity duration-500 max-w-xs"
            style={{ fontFamily: "Lora" }}
          >
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#D76B1A]"
              style={{
                animation: `pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Add animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
