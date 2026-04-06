"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
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
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isFading, setIsFading] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    // On initial mount, show after 300ms if the page hasn't loaded yet
    let showTimer: ReturnType<typeof setTimeout>
    let hideTimer: ReturnType<typeof setTimeout>

    const dismiss = () => {
      setIsFading(true)
      hideTimer = setTimeout(() => {
        setIsVisible(false)
        setIsFading(false)
      }, 400)
    }

    if (document.readyState === "complete") {
      // Already loaded — don't show at all
      return
    }

    showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    const onLoad = () => dismiss()
    window.addEventListener("load", onLoad)

    // Safety fallback: always dismiss after 4 seconds
    const fallback = setTimeout(() => dismiss(), 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
      clearTimeout(fallback)
      window.removeEventListener("load", onLoad)
    }
  }, [])

  // Also dismiss on route changes (Next.js navigation)
  useEffect(() => {
    if (!isVisible) return
    setIsFading(true)
    const t = setTimeout(() => {
      setIsVisible(false)
      setIsFading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [pathname])

  // Rotate messages while visible
  useEffect(() => {
    if (!isVisible) return
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      className="fixed inset-0 bg-[#FBF8F4] flex items-center justify-center z-[9999]"
      style={{
        opacity: isFading ? 0 : 1,
        transition: "opacity 0.4s ease-out",
        pointerEvents: isFading ? "none" : "all",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Dog Logo with gentle bounce */}
        <div
          className="relative w-28 h-28"
          style={{ animation: "bounce-gentle 2s ease-in-out infinite" }}
        >
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Dog_Heart_Tail-83tTALSjb3OWV19wHdHGvnulgBPIWT.png"
            alt="Second Tail Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-[#5A4A42]" style={{ fontFamily: "Lora" }}>
            One moment...
          </h2>
          <p
            className="text-base text-[#2E2E2E]/70 h-6 max-w-xs"
            style={{ fontFamily: "Lora", transition: "opacity 0.5s" }}
          >
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
                animation: "dot-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
