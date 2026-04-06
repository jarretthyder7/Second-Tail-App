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
        {/* Animated Dog Icon */}
        <div className="relative w-20 h-20">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full animate-gentle-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#D76B1A] animate-gentle-bounce"
          >
            {/* Head */}
            <circle cx="50" cy="45" r="22" />
            {/* Left ear */}
            <path d="M 32 25 Q 28 15 32 10" />
            {/* Right ear */}
            <path d="M 68 25 Q 72 15 68 10" />
            {/* Snout */}
            <circle cx="50" cy="50" r="8" />
            {/* Eyes */}
            <circle cx="45" cy="42" r="2" fill="currentColor" />
            <circle cx="55" cy="42" r="2" fill="currentColor" />
            {/* Mouth */}
            <path d="M 50 52 Q 48 55 46 54" />
            <path d="M 50 52 Q 52 55 54 54" />
            {/* Neck/shoulders */}
            <path d="M 35 62 Q 35 70 40 75" />
            <path d="M 65 62 Q 65 70 60 75" />
            {/* Body */}
            <ellipse cx="50" cy="80" rx="18" ry="12" />
            {/* Animated tail */}
            <g className="origin-[50px_80px]">
              <path
                d="M 65 82 Q 75 75 80 65 Q 82 60 80 55"
                className="animate-tail-wag"
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

        @keyframes gentle-bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes tail-wag {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-30deg);
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

        .animate-gentle-bounce {
          animation: gentle-bounce 2s ease-in-out infinite;
        }

        .animate-tail-wag {
          animation: tail-wag 1.5s ease-in-out infinite;
          transform-origin: 65px 82px;
        }
      `}</style>
    </div>
  )
}
