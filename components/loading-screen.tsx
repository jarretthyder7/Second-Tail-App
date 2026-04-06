"use client"

import { useEffect, useState } from "react"

const loadingMessages = [
  "Loading your dog's care dashboard",
  "Setting up your foster experience",
  "Getting things ready…",
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

    // Rotate messages every 2 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-[#FBF8F4] flex items-center justify-center z-50 animate-fade-in">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Dog Icon - Matching Second Tail Logo */}
        <div className="relative w-24 h-24">
          <svg
            viewBox="0 0 200 240"
            className="w-full h-full"
            fill="none"
            stroke="#D76B1A"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Head */}
            <path d="M 100 50 Q 130 50 140 70 Q 145 85 140 100 Q 130 115 100 120 Q 70 115 60 100 Q 55 85 60 70 Q 70 50 100 50" />
            
            {/* Left Ear */}
            <path d="M 75 55 Q 65 40 75 20 Q 80 35 75 55" />
            
            {/* Right Ear */}
            <path d="M 125 55 Q 135 40 125 20 Q 120 35 125 55" />
            
            {/* Snout */}
            <circle cx="100" cy="100" r="15" />
            
            {/* Eyes */}
            <circle cx="90" cy="90" r="4" fill="#D76B1A" />
            <circle cx="110" cy="90" r="4" fill="#D76B1A" />
            
            {/* Nose */}
            <circle cx="100" cy="102" r="3" fill="#D76B1A" />
            
            {/* Body/Chest */}
            <path d="M 80 120 Q 70 130 70 150 L 70 180" />
            <path d="M 120 120 Q 130 130 130 150 L 130 180" />
            
            {/* Front Left Leg */}
            <path d="M 80 180 Q 75 195 75 215" />
            
            {/* Front Right Leg */}
            <path d="M 120 180 Q 125 195 125 215" />
            
            {/* Back Left Leg */}
            <path d="M 60 160 Q 55 180 55 210" />
            
            {/* Back Right Leg */}
            <path d="M 140 160 Q 145 180 145 210" />
            
            {/* Animated Heart Tail */}
            <g className="animate-tail-wag" style={{ transformOrigin: '130px 120px' }}>
              <path 
                d="M 130 120 Q 160 110 170 85 Q 180 65 175 50 Q 165 40 155 45 Q 150 48 150 55 Q 150 48 145 45 Q 135 40 125 50 Q 120 65 130 85 Q 140 110 130 120" 
                fill="none"
              />
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora" }}>
            Getting things ready…
          </h2>
          <p
            className="text-base text-[#2E2E2E]/70 h-6 transition-opacity duration-500"
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

        @keyframes tail-wag {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-35deg);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }

        .animate-tail-wag {
          animation: tail-wag 1.8s ease-in-out infinite;
          transform-origin: 130px 120px;
        }
      `}</style>
    </div>
  )
}
