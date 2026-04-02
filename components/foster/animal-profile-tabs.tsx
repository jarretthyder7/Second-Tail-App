"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DailyLogTab } from "./daily-log-tab"
import { JourneyTab } from "./journey-tab"

interface DogProfileTabsProps {
  dog: any
  logs: any[]
  messages: any[]
}

export function DogProfileTabs({ dog, logs, messages }: DogProfileTabsProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [activeTab, setActiveTab] = useState<"log" | "journey">("log")

  useEffect(() => {
    if (tabParam === "journey") {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex gap-1 sm:gap-2 rounded-full bg-[#F7E2BD]/60 p-1">
        <button
          onClick={() => setActiveTab("log")}
          className={`flex-1 px-2 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm font-semibold ${
            activeTab === "log" ? "bg-white text-[#5A4A42] shadow-sm" : "text-[#2E2E2E]/70"
          }`}
        >
          Daily Log
        </button>
        <button
          onClick={() => setActiveTab("journey")}
          className={`flex-1 px-2 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm font-semibold ${
            activeTab === "journey" ? "bg-white text-[#5A4A42] shadow-sm" : "text-[#2E2E2E]/70"
          }`}
        >
          Journey
        </button>
      </div>

      {activeTab === "log" && <DailyLogTab dog={dog} logs={logs} />}
      {activeTab === "journey" && <JourneyTab dog={dog} />}
    </div>
  )
}

export default DogProfileTabs
