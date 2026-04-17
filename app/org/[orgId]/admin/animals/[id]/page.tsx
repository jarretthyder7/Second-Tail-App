"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { fetchCarePlanForDog, updateDog, fetchLogsForDog, fetchDogById } from "@/lib/supabase/queries"
import { ArrowLeft, Edit, Camera, AlertTriangle, MessageCircle } from "lucide-react"
import Link from "next/link"
import { AdminDogTabs } from "@/components/admin/admin-animal-tabs"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { createTimelineEvent } from "@/lib/timeline-helper"

type Dog = {
  id: string
  name: string
  breed: string
  age?: string
  gender?: string
  weight?: string
  image_url?: string
  intake_date?: string
  status: string
  stage?: string
  medical_notes?: string
  behavior_notes?: string
  foster_id?: string
  organization_id: string
  created_at: string
  updated_at: string
  foster?: {
    id: string
    name: string
    email: string
  }
  tags?: string[]
}

type CarePlan = {
  id: string
  dog_id: string
  medications?: Array<{ name: string; schedule: string; instructions?: string }>
  feeding_schedule?: string
  vet_clinic?: string
  vet_phone?: string
  special_instructions?: string
  next_vet_visit?: string
  behavior_notes?: string
  special_needs?: string[]
  created_at: string
  updated_at: string
}

type HelpRequest = {
  id: string
  dog_id: string
  foster_id: string
  category: string
  priority: string
  title?: string
  description: string
  status: string
  created_at: string
  resolved_at?: string
  updated_at: string
}

type JourneyEvent = {
  id: string
  dogId: string
  type: string
  title: string
  description: string
  timestamp: string
  mood?: string
}

export default function OrgDogDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <AdminDogDetailContent />
    </ProtectedRoute>
  )
}

function AdminDogDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orgId = params.orgId as string
  const dogId = params.id as string

  const [dog, setDog] = useState<Dog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [carePlan, setCarePlan] = useState<any | null>(null)
  const [helpRequests, setHelpRequests] = useState<any[]>([])
  const [journeyEvents, setJourneyEvents] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [editingBasicInfo, setEditingBasicInfo] = useState(false)
  const [editedDog, setEditedDog] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)
  const [showFosterReassign, setShowFosterReassign] = useState(false)
  const [availableForsters, setAvailableForsters] = useState<any[]>([])
  const [selectedNewFoster, setSelectedNewFoster] = useState<string>("")
  const [pendingStageChange, setPendingStageChange] = useState<string | null>(null)
  const [showStageConfirmation, setShowStageConfirmation] = useState(false)
  const [showReturnConfirmation, setShowReturnConfirmation] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [fosterConversations, setFosterConversations] = useState<any[]>([])

  useEffect(() => {
    async function loadDog() {
      setIsLoading(true)
      setError(null)

      try {
        const supabase = createClient()

        const { data: dogData, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).single()

        if (dogError) throw new Error(dogError.message)
        if (!dogData) throw new Error("Dog not found")

        console.log("[v0] Loaded dog data:", {
          name: dogData.name,
          gender: dogData.gender,
          image_url: dogData.image_url,
          intake_date: dogData.intake_date,
        })

        let fosterData = null
        if (dogData.foster_id) {
          const { data } = await supabase
            .from("profiles")
            .select("id, name, email")
            .eq("id", dogData.foster_id)
            .single()
          fosterData = data
        }

        setDog({ ...dogData, foster: fosterData })

        const { data: conversationsData } = await supabase
          .from("conversations")
          .select(`
            id,
            created_at,
            updated_at,
            recipient_id,
            team,
            messages (
              id,
              content,
              sender_id,
              created_at
            )
          `)
          .eq("dog_id", dogId)
          .order("updated_at", { ascending: false })

        if (conversationsData && conversationsData.length > 0) {
          const allUserIds = new Set<string>()
          conversationsData.forEach((conv) => {
            if (conv.recipient_id) allUserIds.add(conv.recipient_id)
            conv.messages?.forEach((msg: any) => {
              if (msg.sender_id) allUserIds.add(msg.sender_id)
            })
          })

          // Fetch profiles for ALL participants
          const { data: userProfiles } = await supabase
            .from("profiles")
            .select("id, name, email, role")
            .in("id", Array.from(allUserIds))

          const usersMap = new Map(userProfiles?.map((u) => [u.id, u]) || [])
          console.log("[v0] Loaded user profiles for conversations:", usersMap.size)

          const enrichedConversations = conversationsData.map((conv) => {
            // Find the foster by checking message senders
            let fosterProfile = null
            if (dogData.foster_id) {
              // Check if foster_id matches any message sender
              const hasFosterMessage = conv.messages?.some((msg: any) => msg.sender_id === dogData.foster_id)
              if (hasFosterMessage) {
                fosterProfile = usersMap.get(dogData.foster_id) || null
              }
              // Also check if foster_id is the recipient
              if (!fosterProfile && conv.recipient_id === dogData.foster_id) {
                fosterProfile = usersMap.get(dogData.foster_id) || null
              }
            }

            console.log("[v0] Conversation", conv.id, "foster profile:", fosterProfile?.name || "not found")

            return {
              ...conv,
              foster: fosterProfile,
              messageCount: conv.messages?.length || 0,
              lastMessage: conv.messages?.[0] || null,
            }
          })

          setFosterConversations(enrichedConversations)

          // Flatten all messages for the messages tab
          const allMessages = conversationsData
            .flatMap((conv) =>
              (conv.messages || []).map((msg: any) => ({
                ...msg,
                user: usersMap.get(msg.sender_id),
              })),
            )
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          setMessages(allMessages)
        }

        const { data: existingEvents } = await supabase
          .from("timeline_events")
          .select("id")
          .eq("animal_id", dogId)
          .limit(1)

        if (!existingEvents || existingEvents.length === 0) {
          const intakeDate = dogData.intake_date ? new Date(dogData.intake_date).toISOString() : dogData.created_at

          await createTimelineEvent({
            animal_id: dogId,
            type: "intake",
            title: "Added to rescue system",
            description: `${dogData.name} was added to the rescue on ${new Date(dogData.intake_date || dogData.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
            event_date: intakeDate,
            created_by: "System",
            visible_to_foster: true,
            metadata: { intake_date: dogData.intake_date },
          })
          console.log("[v0] Created initial intake timeline event with date:", intakeDate)
        }
      } catch (err: any) {
        console.error("[v0] Error loading dog:", err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (dogId) {
      loadDog()
    }
  }, [dogId, orgId, toast])

  useEffect(() => {
    if (dog) {
      setEditedDog(dog)
      fetchLogsForDog(dog.id).then((data) => {
        console.log("[v0] Loaded logs:", data)
        setLogs(data || [])
      })
      fetchCarePlanForDog(dog.id).then((data) => {
        console.log("[v0] Loaded care plan:", data)
        setCarePlan(data)
      })
    }
  }, [dog])

  useEffect(() => {
    async function checkAndCreateFosterAssignmentEvent() {
      if (!dog || !dog.foster_id) return

      const supabase = createClient()

      const { data: existingEvents } = await supabase
        .from("timeline_events")
        .select("id")
        .eq("animal_id", dogId)
        .in("type", ["foster_assigned", "foster_assignment", "foster_change"])
        .limit(1)

      if (!existingEvents || existingEvents.length === 0) {
        const fosterName = dog.foster?.name || dog.foster?.email || "Unknown Foster"

        await createTimelineEvent({
          animal_id: dogId,
          type: "foster_assigned",
          title: "Foster assigned",
          description: `${dog.name} was assigned to foster ${fosterName}`,
          event_date: dog.intake_date
            ? new Date(dog.intake_date + "T12:00:00").toISOString()
            : new Date().toISOString(),
          created_by: "System (retroactive)",
          visible_to_foster: true,
          metadata: {
            foster_id: dog.foster_id,
            foster_name: fosterName,
            retroactive: true,
          },
        })
      }
    }

    checkAndCreateFosterAssignmentEvent()
  }, [dog, dogId])

  const refetchDog = async () => {
    const supabase = createClient()
    const { data: dogData, error: dogError } = await supabase.from("dogs").select("*").eq("id", dogId).single()

    if (!dogError && dogData) {
      let fosterData = null
      if (dogData.foster_id) {
        const { data } = await supabase.from("profiles").select("id, name, email").eq("id", dogData.foster_id).single()
        fosterData = data
      }
      setDog({ ...dogData, foster: fosterData })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("dogId", dogId)

      const response = await fetch("/api/upload/dog-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload image")
      }

      const data = await response.json()

      await refetchDog()

      toast({
        title: "Success",
        description: "The new profile picture has been successfully updated.",
        variant: "default",
      })
    } catch (error) {
      console.error("[v0] Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSaveBasicInfo = async () => {
    if (!dog) return
    try {
      setIsSaving(true)

      console.log("[v0] Saving basic info with gender:", editedDog.gender)

      const response = await fetch(`/api/dogs/${dog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedDog.name,
          breed: editedDog.breed,
          age: editedDog.age,
          gender: editedDog.gender,
          weight: editedDog.weight,
        }),
      })

      if (!response.ok) throw new Error("Failed to update")

      await refetchDog()
      setEditingBasicInfo(false)

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("[v0] Failed to save basic info:", error)
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMedical = async () => {
    if (!dog) return
    try {
      await updateDog(dog.id, { carePlan: editedDog.carePlan })
      const updatedCarePlan = await fetchCarePlanForDog(dogId)
      setCarePlan(updatedCarePlan)
      setEditingBasicInfo(false)
      setEditedDog({})
    } catch (error) {
      console.error("[v0] Failed to save medical info:", error)
      alert("Failed to save medical info. Please try again.")
    }
  }

  const handleSaveBehavior = async () => {
    if (!dog) return
    try {
      await updateDog(dog.id, { behavior_notes: editedDog.behavior_notes })
      const updatedDog = await fetchDogById(dogId)
      await refetchDog()
      setEditingBasicInfo(false)
      setEditedDog({})
    } catch (error) {
      console.error("[v0] Failed to save behavior info:", error)
      alert("Failed to save behavior info. Please try again.")
    }
  }

  const handleAddAppointment = () => {
    console.log("[v0] Adding appointment:", editedDog.newAppointment)
    setEditingBasicInfo(false)
  }

  const handleReassignFoster = () => {
    console.log("[v0] Reassigning foster to:", editedDog.foster_id)
    setEditingBasicInfo(false)
  }

  const handleAddLog = () => {
    console.log("[v0] Adding log:", editedDog.newLog)
    setEditingBasicInfo(false)
  }

  const handleAddMedicalNote = () => {
    console.log("[v0] Adding medical note:", editedDog.newMedicalNote)
    setEditingBasicInfo(false)
  }

  const handleAddBehaviorNote = () => {
    console.log("[v0] Adding behavior note:", editedDog.newBehaviorNote)
    setEditingBasicInfo(false)
  }

  const handleCreateRequest = () => {
    console.log("[v0] Creating request:", editedDog.newRequest)
    setEditingBasicInfo(false)
  }

  const handleResolveRequest = async (requestId: string) => {
    try {
      await updateDog(dogId, {
        helpRequests: helpRequests.map((hr) => (hr.id === requestId ? { ...hr, status: "resolved" } : hr)),
      })
      setHelpRequests(helpRequests.map((hr) => (hr.id === requestId ? { ...hr, status: "resolved" } : hr)))
      console.log("[v0] Resolved request:", requestId)
    } catch (error) {
      console.error("[v0] Failed to resolve request:", error)
      alert("Failed to resolve request. Please try again.")
    }
  }

  const handleContactFoster = (method: string) => {
    console.log(`[v0] Contacting foster via ${method}`)
    alert(`Opening ${method} to contact ${dog?.foster?.name || "foster"}`)
  }

  const handleStageChange = async (newStage: string) => {
    if (!dog || newStage === dog.stage) return

    // Show confirmation dialog instead of immediately changing
    setPendingStageChange(newStage)
    setShowStageConfirmation(true)
  }

  const confirmStageChange = async () => {
    if (!dog || !pendingStageChange) return

    setIsUpdatingStage(true)
    setShowStageConfirmation(false)

    const oldStage = dog.stage || "Not set"

    // Optimistically update the dog state so the dropdown and profile card
    // reflect the new stage immediately — no page refresh required.
    setDog((prev) => (prev ? { ...prev, stage: pendingStageChange } : prev))

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.from("dogs").update({ stage: pendingStageChange }).eq("id", dogId)

      if (updateError) throw updateError

      // Get the current user's name to attribute the timeline entry correctly.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let createdByName = "Admin"
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", user.id)
          .maybeSingle()
        createdByName = profile?.name || profile?.email || user.email || "Admin"
      }

      // Use the correct field names expected by createTimelineEvent and a valid type.
      await createTimelineEvent({
        animal_id: dogId,
        type: "status_change",
        title: `Stage changed from ${oldStage} to ${pendingStageChange}`,
        description: `Stage changed from "${oldStage}" to "${pendingStageChange}". Added by ${createdByName}.`,
        created_by: createdByName,
        visible_to_foster: true,
        event_date: new Date().toISOString(),
        metadata: {
          old_stage: oldStage,
          new_stage: pendingStageChange,
        },
      })

      toast({
        title: "Stage updated",
        description: `${dog.name}'s stage has been updated to ${pendingStageChange}`,
      })
    } catch (error: any) {
      console.error("[v0] Error updating stage:", error)
      // Roll back the optimistic update if the DB write failed.
      setDog((prev) => (prev ? { ...prev, stage: oldStage === "Not set" ? undefined : oldStage } : prev))
      toast({
        title: "Error",
        description: error?.message || "Failed to update stage. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStage(false)
      setPendingStageChange(null)
    }
  }

  const cancelStageChange = () => {
    setShowStageConfirmation(false)
    setPendingStageChange(null)
  }

  const handleFosterReassign = async () => {
    if (!selectedNewFoster) return

    try {
      const supabase = createClient()

      const previousFosterId = dog.foster_id
      const previousFosterName = dog.foster?.name || dog.foster?.email || "Unknown"

      const { data: newFosterData } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", selectedNewFoster)
        .single()

      const newFosterName = newFosterData?.name || newFosterData?.email || "Unknown"

      const { error: updateError } = await supabase
        .from("dogs")
        .update({
          foster_id: selectedNewFoster,
          stage: "in_foster",
          status: "fostered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", dogId)

      if (updateError) throw updateError

      if (previousFosterId) {
        await createTimelineEvent({
          animal_id: dogId,
          type: "foster_change",
          title: "Foster reassigned",
          description: `${dog.name} was reassigned from ${previousFosterName} to ${newFosterName}`,
          event_date: new Date().toISOString(),
          created_by: "Admin",
          visible_to_foster: true,
          metadata: {
            previous_foster_id: previousFosterId,
            new_foster_id: selectedNewFoster,
            previous_foster_name: previousFosterName,
            new_foster_name: newFosterName,
          },
        })
      } else {
        await createTimelineEvent({
          animal_id: dogId,
          type: "foster_assigned",
          title: "Foster assigned",
          description: `${dog.name} was assigned to foster ${newFosterName}`,
          event_date: new Date().toISOString(),
          created_by: "Admin",
          visible_to_foster: true,
          metadata: {
            foster_id: selectedNewFoster,
            foster_name: newFosterName,
          },
        })
      }

      toast({
        title: "Foster Updated",
        description: `Successfully assigned ${newFosterName} as foster`,
      })

      await refetchDog()
      setShowFosterReassign(false)
      setSelectedNewFoster("")
    } catch (err: any) {
      console.error("[v0] Error reassigning foster:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to reassign foster",
        variant: "destructive",
      })
    }
  }

  const loadAvailableForsters = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("organization_id", orgId)
      .eq("role", "foster")
    setAvailableForsters(data || [])
  }

  const handleReassignFosterClick = () => {
    setShowFosterReassign(true)
    loadAvailableForsters()
  }

  const handleReturnToRescue = async () => {
    if (!dog) return
    setIsReturning(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from("dogs")
        .update({ foster_id: null, stage: "intake", status: "available", updated_at: new Date().toISOString() })
        .eq("id", dogId)

      if (updateError) throw updateError

      const fosterName = dog.foster?.name || dog.foster?.email || "Unknown Foster"
      await createTimelineEvent({
        animal_id: dogId,
        type: "status_change",
        title: "Returned to rescue care",
        description: `${dog.name} was returned to rescue care from ${fosterName}`,
        event_date: new Date().toISOString(),
        created_by: "Admin",
        visible_to_foster: true,
        metadata: { previous_foster_id: dog.foster_id, previous_foster_name: fosterName },
      })

      toast({ title: "Returned to rescue care", description: `${dog.name} has been returned to rescue care` })
      setShowReturnConfirmation(false)
      await refetchDog()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to return dog to rescue", variant: "destructive" })
    } finally {
      setIsReturning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6F47]"></div>
          <p className="text-[#5A4A42]">Loading dog profile...</p>
        </div>
      </div>
    )
  }

  if (error || !dog) {
    const errorMessage = error || "The dog profile you're looking for doesn't exist."

    return (
      <div className="min-h-screen bg-[#FDF8F3]">
        <div className="bg-white border-b border-[#E5DED4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Link href={`/org/${orgId}/admin/dogs`} className="p-2 hover:bg-[#FDF8F3] rounded-lg transition">
                <ArrowLeft className="h-5 w-5 text-[#5A4A42]" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-[#2C1810]">Dog Profile Unavailable</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <h3 className="text-yellow-800 font-medium mb-2">Unable to load dog profile</h3>
            <p className="text-yellow-700 text-sm mb-2">{errorMessage}</p>
            <p className="text-yellow-600 text-xs">Dog ID: {dogId}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED4] p-6">
                <div className="w-full h-64 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
                  <p className="text-gray-400">Image unavailable</p>
                </div>
                <h1 className="text-3xl font-bold text-[#5A4A42] mb-2">Profile Unavailable</h1>
                <p className="text-sm text-[#2E2E2E]/70">Unable to load details</p>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <p className="text-[#5A4A42]/70">
                We're having trouble loading this dog's profile. Please try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {showReturnConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-[#5A4A42]">Return to Rescue Care</h3>
            </div>
            <p className="text-[#5A4A42]/80 mb-6">
              Are you sure you want to return <strong>{dog?.name}</strong> to rescue care? This will remove them from{" "}
              <strong>{dog?.foster?.name || dog?.foster?.email}</strong>&apos;s care.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnConfirmation(false)}
                className="flex-1 px-4 py-2 border border-[#E5DED4] rounded-xl text-[#5A4A42] hover:bg-[#FDF8F3] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnToRescue}
                disabled={isReturning}
                className="flex-1 px-4 py-2 bg-[#D76B1A] text-white rounded-xl hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
              >
                {isReturning ? "Returning..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStageConfirmation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-[#5A4A42]">Confirm Stage Change</h3>
            </div>
            <p className="text-[#5A4A42]/80 mb-6">
              Are you sure you want to change <strong>{dog?.name}</strong>'s stage from{" "}
              <strong>{dog?.stage || "Not set"}</strong> to <strong>{pendingStageChange}</strong>?
            </p>
            <p className="text-sm text-[#5A4A42]/60 mb-6">
              This action will be recorded in the timeline and may affect the animal's visibility and workflow.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelStageChange}
                className="flex-1 px-4 py-2 border border-[#E5DED4] rounded-xl text-[#5A4A42] hover:bg-[#FDF8F3] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmStageChange}
                disabled={isUpdatingStage}
                className="flex-1 px-4 py-2 bg-[#D76B1A] text-white rounded-xl hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
              >
                {isUpdatingStage ? "Updating..." : "Confirm Change"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slim sticky top bar ── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E5DED4] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/org/${orgId}/admin/dogs`}
            className="p-2 hover:bg-[#FDF8F3] rounded-lg transition flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-[#5A4A42]" />
          </Link>
          <span className="text-sm font-semibold text-[#5A4A42] truncate">{dog.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={dog.stage || "intake"}
            onChange={(e) => handleStageChange(e.target.value)}
            disabled={isUpdatingStage}
            className="px-3 py-1.5 pr-8 border border-[#E5DED4] rounded-full text-xs font-medium bg-white text-[#5A4A42] hover:bg-[#FDF8F3] transition disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235A4A42' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.6rem center",
            }}
          >
            <option value="intake">Intake</option>
            <option value="evaluation">Evaluation</option>
            <option value="in_foster">In Foster Care</option>
            <option value="available">Available for Adoption</option>
            <option value="adoption_pending">Adoption Pending</option>
            <option value="adopted">Adopted</option>
            <option value="medical_hold">Medical Hold</option>
            <option value="returned">Returned to Rescue</option>
          </select>
          {!editingBasicInfo && (
            <button
              onClick={() => setEditingBasicInfo(true)}
              className="p-2 hover:bg-[#FDF8F3] rounded-lg transition"
              title="Edit details"
            >
              <Edit className="w-4 h-4 text-[#5A4A42]" />
            </button>
          )}
        </div>
      </div>

      {/* ── Hero photo ── */}
      <div className="relative w-full h-64 sm:h-72 lg:h-80 bg-[#F0EBE3] overflow-hidden">
        {dog.image_url ? (
          <img
            src={dog.image_url}
            alt={`${dog.name} — ${dog.breed}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-20 w-20 text-[#C4B5A5]" />
          </div>
        )}

        {/* Upload overlay */}
        <label
          htmlFor="dog-image-upload"
          className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center"
        >
          <div className="bg-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform">
            {isUploadingImage ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B6F47]" />
                <span className="text-xs text-[#8B6F47]">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Camera className="h-6 w-6 text-[#8B6F47]" />
                <span className="text-xs text-[#8B6F47]">Change Photo</span>
              </div>
            )}
          </div>
        </label>
        <input
          id="dog-image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isUploadingImage}
        />

        {/* Gradient + name overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pointer-events-none">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow mb-1">{dog.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-white/80 text-sm drop-shadow">
              {dog.breed}
              {dog.age && ` • ${dog.age}`}
              {dog.gender && ` • ${dog.gender}`}
              {dog.weight && ` • ${dog.weight}`}
            </p>
            {dog.stage && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  dog.stage === "in_foster"
                    ? "bg-[#E8EFE6] text-[#5A4A42]"
                    : dog.stage === "medical_hold"
                    ? "bg-[#D97A68] text-white"
                    : dog.stage === "adopted"
                    ? "bg-[#8FAF99] text-white"
                    : "bg-[#F7E2BD] text-[#5A4A42]"
                }`}
              >
                {dog.stage === "in_foster"
                  ? "In Foster Care"
                  : dog.stage === "medical_hold"
                  ? "Medical Hold"
                  : dog.stage === "available"
                  ? "Available"
                  : dog.stage === "adoption_pending"
                  ? "Adoption Pending"
                  : dog.stage === "adopted"
                  ? "Adopted"
                  : dog.stage === "returned"
                  ? "Returned to Rescue"
                  : dog.stage.charAt(0).toUpperCase() + dog.stage.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Inline edit form ── */}
      {editingBasicInfo && (
        <div className="bg-white border-b border-[#E5DED4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#8B6F47] mb-1">Name</label>
                <input
                  type="text"
                  value={editedDog.name || ""}
                  onChange={(e) => setEditedDog({ ...editedDog, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg text-sm"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B6F47] mb-1">Breed</label>
                <input
                  type="text"
                  value={editedDog.breed || ""}
                  onChange={(e) => setEditedDog({ ...editedDog, breed: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg text-sm"
                  placeholder="Breed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B6F47] mb-1">Age</label>
                <input
                  type="text"
                  value={editedDog.age || ""}
                  onChange={(e) => setEditedDog({ ...editedDog, age: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg text-sm"
                  placeholder="e.g. 2 years"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B6F47] mb-1">Gender</label>
                <select
                  value={editedDog.gender || ""}
                  onChange={(e) => setEditedDog({ ...editedDog, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg bg-white text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#8B6F47] mb-1">Weight</label>
                <input
                  type="text"
                  value={editedDog.weight || ""}
                  onChange={(e) => setEditedDog({ ...editedDog, weight: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg text-sm"
                  placeholder="e.g. 45 lbs"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveBasicInfo}
                disabled={isSaving}
                className="px-5 py-2 bg-[#D76B1A] text-white rounded-lg text-sm font-medium hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditingBasicInfo(false)
                  setEditedDog(dog)
                }}
                className="px-5 py-2 border border-[#E5DED4] rounded-lg text-sm text-[#5A4A42] hover:bg-[#FDF8F3] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Quick details card */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED4] p-5">
              <h3 className="text-xs font-semibold text-[#8B6F47] uppercase tracking-wider mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                {dog.intake_date && (
                  <div className="flex justify-between">
                    <dt className="text-[#8B6F47]">Intake</dt>
                    <dd className="font-medium text-[#2E2E2E]">
                      {new Date(dog.intake_date).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                {dog.breed && (
                  <div className="flex justify-between">
                    <dt className="text-[#8B6F47]">Breed</dt>
                    <dd className="font-medium text-[#2E2E2E]">{dog.breed}</dd>
                  </div>
                )}
                {dog.age && (
                  <div className="flex justify-between">
                    <dt className="text-[#8B6F47]">Age</dt>
                    <dd className="font-medium text-[#2E2E2E]">{dog.age}</dd>
                  </div>
                )}
                {dog.gender && (
                  <div className="flex justify-between">
                    <dt className="text-[#8B6F47]">Gender</dt>
                    <dd className="font-medium text-[#2E2E2E]">{dog.gender}</dd>
                  </div>
                )}
                {dog.weight && (
                  <div className="flex justify-between">
                    <dt className="text-[#8B6F47]">Weight</dt>
                    <dd className="font-medium text-[#2E2E2E]">{dog.weight}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Foster card — has a foster */}
            {dog.foster && !showFosterReassign && (
              <div className="bg-[#8FAF99]/10 rounded-2xl border border-[#8FAF99]/30 p-5">
                <h3 className="text-xs font-semibold text-[#8FAF99] uppercase tracking-wider mb-3">Current Foster</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#8FAF99]/30 flex items-center justify-center text-[#5A4A42] font-bold text-sm flex-shrink-0">
                    {(dog.foster.name || dog.foster.email || "?")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <Link
                    href={`/org/${orgId}/admin/fosters/${dog.foster.id}`}
                    className="font-semibold text-[#D76B1A] hover:underline truncate"
                  >
                    {dog.foster.name || dog.foster.email}
                  </Link>
                </div>
                <div className="flex gap-2 mb-3">
                  <Link
                    href={`/org/${orgId}/admin/communications?foster=${dog.foster.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#D76B1A] text-white rounded-lg text-xs font-medium hover:bg-[#D76B1A]/90 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Message
                  </Link>
                  <button
                    onClick={handleReassignFosterClick}
                    className="flex-1 flex items-center justify-center px-3 py-2 border border-[#E5DED4] text-[#5A4A42] rounded-lg text-xs font-medium hover:bg-[#FDF8F3] transition"
                  >
                    Reassign
                  </button>
                </div>
                <button
                  onClick={() => setShowReturnConfirmation(true)}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg text-xs text-[#5A4A42] hover:bg-white transition"
                >
                  Return to Rescue
                </button>
              </div>
            )}

            {/* No foster placeholder */}
            {!dog.foster && !showFosterReassign && (
              <div className="bg-white rounded-2xl border border-dashed border-[#E5DED4] p-5 text-center">
                <p className="text-sm text-[#8B6F47] mb-3">No foster assigned</p>
                <button
                  onClick={handleReassignFosterClick}
                  className="px-4 py-2 bg-[#D76B1A] text-white rounded-lg text-xs font-medium hover:bg-[#D76B1A]/90 transition"
                >
                  Assign a Foster
                </button>
              </div>
            )}

            {/* Reassign form */}
            {showFosterReassign && (
              <div className="bg-white rounded-2xl border border-[#E5DED4] p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[#5A4A42]">Reassign Foster</h3>
                <select
                  value={selectedNewFoster}
                  onChange={(e) => setSelectedNewFoster(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E5DED4] rounded-lg text-sm"
                >
                  <option value="">Select a foster...</option>
                  {availableForsters.map((foster) => (
                    <option key={foster.id} value={foster.id}>
                      {foster.name || foster.email}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleFosterReassign}
                    disabled={!selectedNewFoster}
                    className="flex-1 bg-[#D76B1A] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowFosterReassign(false)
                      setSelectedNewFoster("")
                    }}
                    className="px-3 py-2 border border-[#E5DED4] rounded-lg text-sm hover:bg-[#FDF8F3] transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right panel: tabs */}
          <div className="lg:col-span-2">
            <AdminDogTabs
              dog={dog}
              logs={logs}
              messages={messages}
              carePlan={carePlan}
              onLogsChange={setLogs}
              onCarePlanChange={setCarePlan}
              fosterConversations={fosterConversations}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
