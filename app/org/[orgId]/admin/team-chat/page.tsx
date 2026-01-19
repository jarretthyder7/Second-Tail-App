import { Suspense } from "react"
import TeamChatClient from "./client"

export default function OrgTeamChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-[#2E2E2E]/60">Loading chat...</div>}>
      <TeamChatClient />
    </Suspense>
  )
}
