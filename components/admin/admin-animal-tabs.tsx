"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import TimelineTab from "@/components/admin/timeline-tab"
import { DocumentUploadSection } from "@/components/admin/document-upload-section"
import { Plus, Save, X, MessageSquare, User, FileText, Download, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminDogTabsProps {
  dog: any
  logs: any[]
  messages: any[]
  carePlan: any | null
  onDataUpdate?: () => void
  onLogsChange?: (logs: any[]) => void
  onCarePlanChange?: (carePlan: any) => void
  fosterConversations?: any[]
}

export function AdminDogTabs({
  dog,
  logs,
  messages: initialMessages,
  carePlan,
  onDataUpdate,
  onLogsChange,
  onCarePlanChange,
  fosterConversations = [],
}: AdminDogTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "timeline" | "logs" | "medical" | "documents" | "behavior" | "notes" | "messages"
  >("timeline")
  const [messages, setMessages] = useState<any[]>(initialMessages)
  const [internalNotes, setInternalNotes] = useState("")
  const [behaviorNotes, setBehaviorNotes] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [editingCarePlan, setEditingCarePlan] = useState(false)
  const [editedCarePlan, setEditedCarePlan] = useState(
    carePlan || {
      medications: [],
      feeding_schedule: "",
      vet_clinic: "",
      vet_phone: "",
      next_vet_visit: "",
      special_instructions: "",
    },
  )
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [allLogs, setAllLogs] = useState<any[]>(logs)
  const [showAddLogForm, setShowAddLogForm] = useState(false)
  const [newLog, setNewLog] = useState({
    category: "general",
    mood: "ok",
    notes: "",
    medical_notes: "",
    behavior_notes: "",
  })
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [isSavingCarePlan, setIsSavingCarePlan] = useState(false)
  // Documents tab — populated from timeline_events where type='file_uploaded'.
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [conversationMessages, setConversationMessages] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const loadCurrentUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setCurrentUser(profile)
      }
    }
    loadCurrentUser()
  }, [])

  // Fetch uploaded documents whenever the Documents tab becomes active or the dog changes.
  // Documents are stored as timeline_events with type='file_uploaded' (per /api/upload/document).
  const fetchDocuments = async () => {
    if (!dog?.id) return
    setIsLoadingDocuments(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("timeline_events")
        .select("id, title, description, event_date, metadata, visible_to_foster, created_at")
        .eq("animal_id", dog.id)
        .eq("type", "file_uploaded")
        .order("event_date", { ascending: false })
      setDocuments(data || [])
    } catch (err) {
      console.error("Failed to fetch documents:", err)
    } finally {
      setIsLoadingDocuments(false)
    }
  }

  useEffect(() => {
    if (activeTab === "documents") fetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dog?.id])

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("Delete this document? This can't be undone.")) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from("timeline_events").delete().eq("id", documentId)
      if (error) throw error
      setDocuments((prev) => prev.filter((d) => d.id !== documentId))
      toast({ title: "Document deleted" })
    } catch (err: any) {
      toast({
        title: "Couldn't delete",
        description: err.message || "Try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    setEditedCarePlan(
      carePlan || {
        medications: [],
        feeding_schedule: "",
        vet_clinic: "",
        vet_phone: "",
        next_vet_visit: "",
        special_instructions: "",
      },
    )
  }, [carePlan])

  useEffect(() => {
    setAllLogs(logs)
  }, [logs])

  useEffect(() => {
    async function loadConversationMessages() {
      if (!selectedConversation) {
        setConversationMessages([])
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true })

      if (data) {
        setConversationMessages(data)
      }
    }

    loadConversationMessages()
  }, [selectedConversation])

  const handleAddRescueLog = async () => {
    if (!newLog.notes.trim() && !newLog.medical_notes.trim() && !newLog.behavior_notes.trim()) return

    setIsSavingLog(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Build description from notes
      const description = [
        newLog.notes,
        newLog.medical_notes ? `Medical: ${newLog.medical_notes}` : "",
        newLog.behavior_notes ? `Behavior: ${newLog.behavior_notes}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")

      // Insert into timeline_events instead of daily_logs (rescue users have permission)
      const { data, error } = await supabase
        .from("timeline_events")
        .insert({
          animal_id: dog.id,
          type: newLog.category === "medical" ? "vet_visit" : newLog.category === "behavior" ? "behavior" : "note",
          title: `Rescue ${newLog.category === "general" ? "Note" : newLog.category.charAt(0).toUpperCase() + newLog.category.slice(1)}`,
          description: description,
          event_date: new Date().toISOString(),
          visible_to_foster: false, // Rescue notes are internal by default
          created_by: user?.email || "rescue",
          metadata: {
            mood: newLog.mood,
            category: newLog.category,
            source: "rescue_admin",
          },
        })
        .select()
        .single()

      if (error) throw error

      // Reset form and notify
      setNewLog({ category: "general", mood: "ok", notes: "", medical_notes: "", behavior_notes: "" })
      setShowAddLogForm(false)
      onDataUpdate?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add rescue note.",
        variant: "destructive",
      })
    } finally {
      setIsSavingLog(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !currentUser || !selectedConversation) return

    const supabase = createClient()
    const newMessage = {
      conversation_id: selectedConversation.id,
      content: messageInput,
      sender_role: "admin",
      sender_user_id: currentUser.id,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase.from("messages").insert(newMessage)

    if (!error) {
      setConversationMessages([
        ...conversationMessages,
        { ...newMessage, id: `msg-${Date.now()}`, senderName: currentUser.name },
      ])
      setMessageInput("")
      onDataUpdate?.()
    }
  }

  const handleSaveCarePlan = async () => {
    setIsSavingCarePlan(true)
    try {
      const supabase = createClient()

      // Prepare next_vet_visit - only include if it has a value
      const nextVetVisit = editedCarePlan.next_vet_visit || editedCarePlan.vetInfo?.nextVisit || null

      const carePlanData = {
        dog_id: dog.id,
        medications: editedCarePlan.medications || [],
        feeding_schedule: editedCarePlan.feeding_schedule || editedCarePlan.feedingInstructions || "",
        vet_clinic: editedCarePlan.vet_clinic || editedCarePlan.vetInfo?.clinic || "",
        vet_phone: editedCarePlan.vet_phone || editedCarePlan.vetInfo?.phone || "",
        next_vet_visit: nextVetVisit || null,
        special_instructions: editedCarePlan.special_instructions || editedCarePlan.behaviorNotes || "",
        updated_at: new Date().toISOString(),
      }

      // Check if care plan exists
      const { data: existingPlan, error: fetchError } = await supabase
        .from("care_plans")
        .select("id")
        .eq("dog_id", dog.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      let result
      if (existingPlan) {
        result = await supabase.from("care_plans").update(carePlanData).eq("dog_id", dog.id)
      } else {
        result = await supabase.from("care_plans").insert(carePlanData)
      }

      if (result.error) throw result.error

      // Update local state to show the saved care plan immediately
      setEditedCarePlan(carePlanData)
      setEditingCarePlan(false)

      // Notify parent components
      onCarePlanChange?.(carePlanData)
      onDataUpdate?.()

      toast({
        title: "Care plan saved",
        description: "The care plan has been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save care plan. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingCarePlan(false)
    }
  }

  const tabs = [
    { id: "timeline", label: "Timeline" },
    { id: "logs", label: "Foster Updates" },
    { id: "medical", label: "Medical" },
    { id: "documents", label: "Documents" },
    { id: "behavior", label: "Behavior" },
    { id: "notes", label: "Internal Notes" },
    { id: "messages", label: "Messages" },
  ] as const

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED4]">
      <div className="border-b border-[#E5DED4] px-4">
        <nav className="flex gap-1 -mb-px overflow-x-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap text-sm flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-[#D76B1A] text-[#D76B1A] font-semibold"
                  : "border-transparent text-[#2E2E2E]/60 hover:text-[#2E2E2E]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 sm:p-6">
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <TimelineTab dogId={dog.id} orgId={dog.organization_id} />
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-[#5A4A42]">Foster Updates</h4>
                <p className="text-xs text-[#8B6F47] mt-1">
                  Updates and notes from fosters about the animal's daily care
                </p>
              </div>
              <button
                onClick={() => setShowAddLogForm(!showAddLogForm)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-xl text-sm font-semibold hover:bg-[#D76B1A]/90 transition"
              >
                <Plus className="w-4 h-4" />
                Add Rescue Note
              </button>
            </div>

            {/* Add Log Form */}
            {showAddLogForm && (
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border-2 border-[#D76B1A]/20">
                <h5 className="font-semibold text-[#5A4A42]">New Rescue Note</h5>
                <p className="text-xs text-[#8B6F47]">
                  Add notes about the animal while they're at the rescue facility (not in foster care)
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-1">Category</label>
                    <select
                      value={newLog.category}
                      onChange={(e) => setNewLog({ ...newLog, category: e.target.value })}
                      className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm"
                    >
                      <option value="general">General Update</option>
                      <option value="medical">Medical</option>
                      <option value="behavior">Behavior</option>
                      <option value="intake">Intake</option>
                      <option value="transfer">Transfer</option>
                      <option value="vet_visit">Vet Visit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5A4A42] mb-1">Mood</label>
                    <select
                      value={newLog.mood}
                      onChange={(e) => setNewLog({ ...newLog, mood: e.target.value })}
                      className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm"
                    >
                      <option value="great">Great</option>
                      <option value="ok">OK</option>
                      <option value="rough">Rough</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-1">Notes</label>
                  <textarea
                    value={newLog.notes}
                    onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                    placeholder="General notes about the animal..."
                    className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm resize-none min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-1">Medical Notes (optional)</label>
                  <textarea
                    value={newLog.medical_notes}
                    onChange={(e) => setNewLog({ ...newLog, medical_notes: e.target.value })}
                    placeholder="Any medical observations..."
                    className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm resize-none min-h-[60px]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddRescueLog}
                    disabled={isSavingLog}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-xl text-sm font-semibold hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSavingLog ? "Saving..." : "Save Log"}
                  </button>
                  <button
                    onClick={() => setShowAddLogForm(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#5A4A42] text-[#5A4A42] rounded-xl text-sm font-semibold hover:bg-[#F7E2BD]/40 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {!allLogs || allLogs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">
                    No logs yet. Updates will appear when assigned foster submits it. Add the first log entry above.
                  </p>
                </div>
              ) : (
                allLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[#5A4A42] capitalize">{log.category || "Update"}</p>
                        <p className="text-xs text-[#2E2E2E]/60">
                          {new Date(log.date || log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {log.mood && (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                            log.mood === "rough"
                              ? "bg-[#D97A68] text-white"
                              : log.mood === "great"
                                ? "bg-[#E8EFE6] text-[#5A4A42]"
                                : "bg-[#F7E2BD] text-[#5A4A42]"
                          }`}
                        >
                          {log.mood === "rough" ? "Rough" : log.mood === "great" ? "Great" : "OK"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#2E2E2E] leading-relaxed">
                      {log.notes || log.behavior_notes || "No notes"}
                    </p>
                    {log.medical_notes && (
                      <p className="text-sm text-[#D97A68] leading-relaxed">
                        <span className="font-semibold">Medical:</span> {log.medical_notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "medical" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#5A4A42]">Medical & Care Plan</h4>
              {!editingCarePlan && (
                <button
                  onClick={() => setEditingCarePlan(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-xl text-sm font-semibold hover:bg-[#D76B1A]/90 transition"
                >
                  {carePlan ? "Edit Care Plan" : "Create Care Plan"}
                </button>
              )}
            </div>

            {editingCarePlan ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Medications</label>
                  <div className="space-y-3">
                    {(editedCarePlan.medications || []).map((med: any, index: number) => (
                      <div key={index} className="border border-[#F7E2BD] rounded-xl p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={med.name || ""}
                              onChange={(e) => {
                                const newMeds = [...(editedCarePlan.medications || [])]
                                newMeds[index] = { ...newMeds[index], name: e.target.value }
                                setEditedCarePlan({ ...editedCarePlan, medications: newMeds })
                              }}
                              placeholder="Medication name"
                              className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                            />
                            <input
                              type="text"
                              value={med.schedule || ""}
                              onChange={(e) => {
                                const newMeds = [...(editedCarePlan.medications || [])]
                                newMeds[index] = { ...newMeds[index], schedule: e.target.value }
                                setEditedCarePlan({ ...editedCarePlan, medications: newMeds })
                              }}
                              placeholder="Schedule (e.g., Twice daily with food)"
                              className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                            />
                            <input
                              type="text"
                              value={med.instructions || ""}
                              onChange={(e) => {
                                const newMeds = [...(editedCarePlan.medications || [])]
                                newMeds[index] = { ...newMeds[index], instructions: e.target.value }
                                setEditedCarePlan({ ...editedCarePlan, medications: newMeds })
                              }}
                              placeholder="Special instructions (optional)"
                              className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const newMeds = (editedCarePlan.medications || []).filter(
                                (_: any, i: number) => i !== index,
                              )
                              setEditedCarePlan({ ...editedCarePlan, medications: newMeds })
                            }}
                            className="text-[#D97A68] hover:text-[#D97A68]/80 text-sm font-semibold mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newMeds = [
                          ...(editedCarePlan.medications || []),
                          { name: "", schedule: "", instructions: "" },
                        ]
                        setEditedCarePlan({ ...editedCarePlan, medications: newMeds })
                      }}
                      className="text-sm font-semibold text-[#D76B1A] hover:text-[#D76B1A]/80"
                    >
                      + Add Medication
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Feeding Schedule</label>
                  <textarea
                    value={editedCarePlan.feeding_schedule || ""}
                    onChange={(e) => setEditedCarePlan({ ...editedCarePlan, feeding_schedule: e.target.value })}
                    placeholder="e.g., 1 cup twice daily, morning and evening..."
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Vet Information</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editedCarePlan.vet_clinic || ""}
                      onChange={(e) => setEditedCarePlan({ ...editedCarePlan, vet_clinic: e.target.value })}
                      placeholder="Clinic name"
                      className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    />
                    <input
                      type="text"
                      value={editedCarePlan.vet_phone || ""}
                      onChange={(e) => setEditedCarePlan({ ...editedCarePlan, vet_phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    />
                    <input
                      type="date"
                      value={editedCarePlan.next_vet_visit || ""}
                      onChange={(e) => setEditedCarePlan({ ...editedCarePlan, next_vet_visit: e.target.value })}
                      className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Special Instructions</label>
                  <textarea
                    value={editedCarePlan.special_instructions || ""}
                    onChange={(e) => setEditedCarePlan({ ...editedCarePlan, special_instructions: e.target.value })}
                    placeholder="Any special care instructions, allergies, behavior notes..."
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[80px]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCarePlan}
                    disabled={isSavingCarePlan}
                    className="inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50"
                  >
                    {isSavingCarePlan ? "Saving..." : "Save Care Plan"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCarePlan(false)
                      setEditedCarePlan(
                        carePlan || {
                          medications: [],
                          feeding_schedule: "",
                          vet_clinic: "",
                          vet_phone: "",
                          next_vet_visit: "",
                          special_instructions: "",
                        },
                      )
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-[#5A4A42] bg-white px-4 py-2 text-sm font-semibold text-[#5A4A42] hover:bg-[#F7E2BD]/40 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#F7E2BD] rounded-2xl p-6 space-y-4">
                {carePlan ? (
                  <>
                    {carePlan.medications && carePlan.medications.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-[#5A4A42] mb-2">Medications</h5>
                        <ul className="space-y-2 text-sm text-[#5A4A42]">
                          {carePlan.medications.map((med: any, i: number) => (
                            <li key={i} className="bg-white/50 rounded-lg p-2">
                              <span className="font-semibold">{med.name}</span> - {med.schedule}
                              {med.instructions && (
                                <div className="text-xs text-[#5A4A42]/70 mt-1">{med.instructions}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {carePlan.feeding_schedule && (
                      <div>
                        <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">Feeding Schedule</h5>
                        <p className="text-sm text-[#5A4A42]">{carePlan.feeding_schedule}</p>
                      </div>
                    )}
                    {(carePlan.vet_clinic || carePlan.vet_phone) && (
                      <div>
                        <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">Vet Information</h5>
                        {carePlan.vet_clinic && <p className="text-sm text-[#5A4A42]">{carePlan.vet_clinic}</p>}
                        {carePlan.vet_phone && <p className="text-xs text-[#5A4A42]/70">{carePlan.vet_phone}</p>}
                        {carePlan.next_vet_visit && (
                          <p className="text-xs text-[#5A4A42]/70 mt-1">
                            Next visit: {new Date(carePlan.next_vet_visit).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {carePlan.special_instructions && (
                      <div>
                        <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">Special Instructions</h5>
                        <p className="text-sm text-[#5A4A42]">{carePlan.special_instructions}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-[#5A4A42]/70 mb-3">No care plan created yet</p>
                    <button
                      onClick={() => setEditingCarePlan(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-xl text-sm font-semibold hover:bg-[#D76B1A]/90 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Create Care Plan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#5A4A42]">Documents</h4>
              <p className="text-xs text-[#5A4A42]/60">
                {documents.length} document{documents.length === 1 ? "" : "s"} on file
              </p>
            </div>

            <DocumentUploadSection dogId={dog.id} onUploadComplete={fetchDocuments} />

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5DED4] p-6">
              <h5 className="text-sm font-semibold text-[#5A4A42] mb-3">Uploaded files</h5>

              {isLoadingDocuments ? (
                <p className="text-sm text-[#5A4A42]/60 py-4 text-center">Loading documents…</p>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-sm text-[#5A4A42]/60">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[#5A4A42]/30" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-xs mt-1">
                    Upload prescriptions, vaccination records, intake forms, and other files above.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5DED4]">
                  {documents.map((doc) => {
                    const meta = doc.metadata || {}
                    const fileUrl: string | undefined = meta.file_url
                    const fileName: string = meta.file_name || doc.title || "Document"
                    const fileType: string = meta.document_type || "general"
                    const fileSize: number | undefined = meta.file_size
                    const uploadedAt = doc.event_date
                      ? new Date(doc.event_date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""
                    const sizeLabel =
                      typeof fileSize === "number"
                        ? fileSize > 1024 * 1024
                          ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.max(1, Math.round(fileSize / 1024))} KB`
                        : ""
                    const typeLabel =
                      fileType === "medical"
                        ? "Medical record"
                        : fileType === "vaccination"
                          ? "Vaccination"
                          : fileType === "adoption"
                            ? "Adoption paper"
                            : fileType === "behavior"
                              ? "Behavior assessment"
                              : fileType === "intake"
                                ? "Intake form"
                                : "Document"

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#F7E2BD]/40 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#D76B1A]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#5A4A42] truncate" title={fileName}>
                              {fileName}
                            </p>
                            <p className="text-xs text-[#5A4A42]/60">
                              {typeLabel}
                              {uploadedAt && ` · ${uploadedAt}`}
                              {sizeLabel && ` · ${sizeLabel}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-[#5A4A42]/70 hover:bg-[#F7E2BD]/30 hover:text-[#D76B1A] transition"
                              title="Open / download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 rounded-lg text-[#5A4A42]/70 hover:bg-red-50 hover:text-red-600 transition"
                            title="Delete document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "behavior" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-[#5A4A42]">Behavior Notes</h4>
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              {carePlan?.special_instructions && (
                <div className="bg-[#F7E2BD] rounded-xl p-4">
                  <h5 className="text-sm font-semibold text-[#5A4A42] mb-2">Current Behavior Notes</h5>
                  <p className="text-sm text-[#2E2E2E] leading-relaxed">{carePlan.special_instructions}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Add New Behavior Note</label>
                <textarea
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[100px]"
                  placeholder="Describe behavior observations..."
                />
                <button className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition">
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-[#5A4A42]">Internal Notes</h4>
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <p className="text-sm text-[#2E2E2E]/60 mb-4">
                These notes are only visible to staff and will not be shared with foster parents.
              </p>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[200px]"
                placeholder="Add internal staff notes here..."
              />
              <button className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition">
                Save Notes
              </button>
            </div>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-[#5A4A42]">Foster Messages</h4>
              {dog.foster && (
                <div className="text-sm text-[#5A4A42]/70">
                  Current foster:{" "}
                  <span className="font-medium text-[#5A4A42]">{dog.foster.name || dog.foster.email}</span>
                </div>
              )}
            </div>

            {process.env.NODE_ENV === "development" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-blue-900">Dev Debug - Foster Info:</p>
                <p className="text-blue-800">
                  <span className="font-medium">dog.foster_id:</span> {dog.foster_id || "null"}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Foster record found:</span>{" "}
                  {dog.foster ? `Yes (${dog.foster.name || dog.foster.email})` : "No"}
                </p>
                <p className="text-blue-800">
                  <span className="font-medium">Conversations found:</span> {fosterConversations.length}
                </p>
              </div>
            )}

            {fosterConversations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conversation List */}
                <div className="space-y-2 border-r border-[#E5DED4] pr-4">
                  <p className="text-xs text-[#5A4A42]/60 uppercase font-semibold mb-2">Conversations</p>
                  {fosterConversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left p-3 rounded-xl transition ${
                        selectedConversation?.id === conv.id
                          ? "bg-[#D76B1A]/10 border border-[#D76B1A]/30"
                          : "hover:bg-[#FDF8F3] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#8FAF99]/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-[#8FAF99]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#5A4A42] truncate">
                            {conv.foster?.name || "Unknown Foster"}
                          </p>
                          <p className="text-xs text-[#5A4A42]/60">{conv.messageCount} messages</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Message Thread */}
                <div className="md:col-span-2">
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-3 border-b border-[#E5DED4]">
                        <div className="w-10 h-10 bg-[#8FAF99]/20 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#8FAF99]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#5A4A42]">
                            {selectedConversation.foster?.name || "Unknown Foster"}
                          </p>
                          <p className="text-xs text-[#5A4A42]/60">{selectedConversation.foster?.email}</p>
                        </div>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                        {conversationMessages.length === 0 ? (
                          <p className="text-[#5A4A42]/60 text-sm text-center py-8">No messages in this conversation</p>
                        ) : (
                          conversationMessages.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl max-w-[80%] ${
                                msg.sender_id === dog.foster_id ? "bg-[#F7E2BD] mr-auto" : "bg-[#D76B1A]/10 ml-auto"
                              }`}
                            >
                              <p className="text-sm text-[#2E2E2E]">{msg.content}</p>
                              <p className="text-xs text-[#2E2E2E]/60 mt-1">
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Reply form */}
                      <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-[#E5DED4]">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 rounded-xl border border-[#F7E2BD] bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-[#5A4A42]/20 mb-3" />
                      <p className="text-[#5A4A42]/60 text-sm">Select a conversation to view messages</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center">
                <MessageSquare className="w-12 h-12 text-[#5A4A42]/20 mx-auto mb-3" />
                {dog.foster_id ? (
                  <>
                    <p className="text-[#5A4A42]/60 text-sm mb-2">No messages yet with {dog.foster?.name}</p>
                    <p className="text-xs text-[#5A4A42]/40">
                      Messages will appear here when {dog.foster?.name || "the foster"} sends a message about{" "}
                      {dog?.name}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[#5A4A42]/60 text-sm mb-2">No foster assigned</p>
                    <p className="text-xs text-[#5A4A42]/40 mb-4">Assign a foster to {dog?.name} to start messaging</p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#D76B1A] text-white rounded-xl text-sm font-semibold hover:bg-[#D76B1A]/90 transition">
                      <User className="w-4 h-4" />
                      Assign Foster
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
