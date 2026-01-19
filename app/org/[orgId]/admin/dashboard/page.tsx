"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Inbox,
  Dog,
  AlertCircle,
  GripVertical,
  X,
  Plus,
  Users,
  MessageSquare,
  HelpCircle,
  UsersRound,
  CalendarIcon,
  Clock,
  Mail,
  ChevronRight,
  Check,
  AlertTriangle,
  PawPrint,
} from "lucide-react"

// New consolidated widget types following the Command Center philosophy
type WidgetType =
  | "priority-inbox"        // Combines messages + support requests
  | "animal-health-status"  // NEW: Animal health & status overview
  | "animals-needing-attention"  // Legacy - maps to animal-health-status
  | "foster-network-status" // Combines foster-capacity + support
  | "todays-schedule"       // Renamed from upcoming-appointments
  | "team-load"             // Optional - renamed from team-workload-overview
  | "outreach-communications" // Optional - for announcements

type Widget = {
  id: string
  type: WidgetType
  col_span: number
  settings?: Record<string, any>
}

type DashboardConfig = {
  id: string
  organization_id: string
  widgets: Widget[]
}

// Reorganized widget definitions following the spec
const AVAILABLE_WIDGETS: Record<string, { id: WidgetType; name: string; description: string; defaultSpan: number; isDefault?: boolean }[]> = {
  "Core Tiles": [
    {
      id: "priority-inbox",
      name: "Priority Inbox",
      description: "Who needs a response? Messages + Support Requests",
      defaultSpan: 12,
      isDefault: true,
    },
    {
      id: "animal-health-status",
      name: "Animal Health & Status",
      description: "Do any animals need attention right now?",
      defaultSpan: 12,
      isDefault: true,
    },
    {
      id: "foster-network-status",
      name: "Foster Network Status",
      description: "Capacity and foster wellbeing at a glance",
      defaultSpan: 12,
      isDefault: true,
    },
    {
      id: "todays-schedule",
      name: "Today's Schedule",
      description: "What's happening today and next 48 hours",
      defaultSpan: 12,
      isDefault: false,
    },
  ],
  "Advanced Tiles": [
    {
      id: "team-load",
      name: "Team Load",
      description: "Is anyone overloaded? Staff workload overview",
      defaultSpan: 12,
      isDefault: false,
    },
    {
      id: "outreach-communications",
      name: "Outreach & Communications",
      description: "Foster announcements and adoption pushes",
      defaultSpan: 12,
      isDefault: false,
    },
  ],
}

// Default tiles for new organizations (auto-created during onboarding)
const DEFAULT_WIDGETS: Widget[] = [
  { id: "default-1", type: "priority-inbox", col_span: 12 },
  { id: "default-2", type: "animal-health-status", col_span: 12 },
  { id: "default-3", type: "foster-network-status", col_span: 12 },
]

export default function OrgAdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <OrgAdminDashboardContent />
    </ProtectedRoute>
  )
}

function OrgAdminDashboardContent() {
  const params = useParams()
  const orgId = params.orgId as string

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null)

  const [dogs, setDogs] = useState<any[]>([])
  const [fosters, setFosters] = useState<any[]>([])
  const [helpRequests, setHelpRequests] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  const [dogsInShelter, setDogsInShelter] = useState<number>(0)
  const [dogsInFoster, setDogsInFoster] = useState<number>(0)
  const [dogsPendingAdoption, setDogsPendingAdoption] = useState<number>(0)
  const [medicalHolds, setMedicalHolds] = useState<number>(0)
  const [dogsWithoutRecentUpdates, setDogsWithoutRecentUpdates] = useState<number>(0)
  const [fostersWithoutDogs, setFostersWithoutDogs] = useState<number>(0)
  const [unansweredRequests, setUnansweredRequests] = useState<number>(0)
  const [capacityWarning, setCapacityWarning] = useState<boolean>(false)

  useEffect(() => {
    async function loadDashboardConfig() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      setProfile(profileData)

      const { data: config } = await supabase
        .from("dashboard_configs")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle()

      if (config && config.widgets && config.widgets.length > 0) {
        // Migrate old widget types to new ones
        const migratedWidgets = config.widgets.map((w: Widget) => {
          // Map old types to new consolidated types
          const typeMap: Record<string, WidgetType> = {
            "dogs-needing-attention": "animal-health-status",
            "animals-needing-attention": "animal-health-status",
            "dog-status-summary": "animal-health-status",
            "recent-dog-updates": "animal-health-status",
            "foster-capacity": "foster-network-status",
            "fosters-needing-support": "foster-network-status",
            "urgent-help-requests": "priority-inbox",
            "unanswered-help-requests": "priority-inbox",
            "recent-help-requests": "priority-inbox",
            "unanswered-messages": "priority-inbox",
            "recent-conversations": "priority-inbox",
            "upcoming-appointments": "todays-schedule",
            "team-workload-overview": "team-load",
            "pending-reimbursements": "priority-inbox", // fold into inbox for now
          }
          const newType = typeMap[w.type] || w.type
          return { ...w, type: newType as WidgetType }
        })
        // Deduplicate by type (keep first occurrence)
        const seen = new Set<WidgetType>()
        const dedupedWidgets = migratedWidgets.filter((w: Widget) => {
          if (seen.has(w.type)) return false
          seen.add(w.type)
          return true
        })
        setDashboardConfig({ ...config, widgets: dedupedWidgets })
      } else {
        // New org - use default widgets
        setDashboardConfig({
          id: crypto.randomUUID(),
          organization_id: orgId,
          widgets: DEFAULT_WIDGETS.map(w => ({ ...w, id: crypto.randomUUID() })),
        })
      }
    }

    loadDashboardConfig()
  }, [orgId])

  useEffect(() => {
    async function loadData() {
      try {
        const [dogsRes, fostersRes, requestsRes, appointmentsRes, conversationsRes] = await Promise.all([
          fetch(`/api/admin/dogs?orgId=${orgId}`),
          fetch(`/api/admin/fosters?orgId=${orgId}`),
          fetch(`/api/admin/help-requests?orgId=${orgId}`),
          fetch(`/api/admin/appointments?orgId=${orgId}`),
          fetch(`/api/admin/conversations?orgId=${orgId}`),
        ])

        const [dogsData, fostersData, requestsData, appointmentsData, conversationsData] = await Promise.all([
          dogsRes.ok ? dogsRes.json() : { dogs: [] },
          fostersRes.ok ? fostersRes.json() : { fosters: [] },
          requestsRes.ok ? requestsRes.json() : { requests: [] },
          appointmentsRes.ok ? appointmentsRes.json() : { appointments: [] },
          conversationsRes.ok ? conversationsRes.json() : { conversations: [] },
        ])

        setDogs(dogsData.dogs || [])
        setFosters(fostersData.fosters || [])
        setHelpRequests(requestsData.requests || [])
        setAppointments(appointmentsData.appointments || [])
        setConversations(conversationsData.conversations || [])

        const inShelter = dogsData.dogs.filter(d => d.status !== "adopted" && !d.foster_id).length
        const inFoster = dogsData.dogs.filter(d => d.foster_id).length
        const pendingAdoption = dogsData.dogs.filter(d => d.status === "pending_adoption").length
        const medicalHoldsCount = dogsData.dogs.filter(d => d.status === "medical-hold" || d.medical_notes?.includes("urgent")).length
        const staleRecordsCount = dogsData.dogs.filter(d => {
          const lastUpdate = new Date(d.updated_at || d.created_at || "")
          return lastUpdate < new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000)
        }).length
        const availableCapacityCount = fostersData.fosters.length - dogsData.dogs.filter(d => d.foster_id).length
        const unansweredRequestsCount = requestsData.requests.filter(r => r.status === "open").length

        setDogsInShelter(inShelter)
        setDogsInFoster(inFoster)
        setDogsPendingAdoption(pendingAdoption)
        setMedicalHolds(medicalHoldsCount)
        setDogsWithoutRecentUpdates(staleRecordsCount)
        setFostersWithoutDogs(availableCapacityCount)
        setUnansweredRequests(unansweredRequestsCount)

        // Set capacity warning based on available capacity
        setCapacityWarning(availableCapacityCount < 5)
      } catch (error) {
        console.error("[v0] Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [orgId])

  const saveDashboardConfig = async () => {
    if (!dashboardConfig) return

    const supabase = createClient()

    const { data: existingConfig } = await supabase
      .from("dashboard_configs")
      .select("id")
      .eq("organization_id", orgId)
      .maybeSingle()

    let error
    if (existingConfig) {
      const result = await supabase
        .from("dashboard_configs")
        .update({
          widgets: dashboardConfig.widgets,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId)
      error = result.error
    } else {
      const result = await supabase.from("dashboard_configs").insert({
        organization_id: orgId,
        widgets: dashboardConfig.widgets,
      })
      error = result.error
    }

    if (error) {
      console.error("[v0] Error saving dashboard config:", error)
    }
  }

  const addWidget = (widgetDef: { id: WidgetType; name: string; description: string; defaultSpan: number }) => {
    if (!dashboardConfig) return

    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type: widgetDef.id,
      col_span: widgetDef.defaultSpan,
      settings: {},
    }

    setDashboardConfig({
      ...dashboardConfig,
      widgets: [...dashboardConfig.widgets, newWidget],
    })
    setShowAddModal(false)
  }

  const removeWidget = (widgetId: string) => {
    if (!dashboardConfig) return

    setDashboardConfig({
      ...dashboardConfig,
      widgets: dashboardConfig.widgets.filter((w) => w.id !== widgetId),
    })
  }

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId)
  }

  const handleDragOver = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault()
    if (!draggedWidget || !dashboardConfig || draggedWidget === targetWidgetId) return

    const draggedIndex = dashboardConfig.widgets.findIndex((w) => w.id === draggedWidget)
    const targetIndex = dashboardConfig.widgets.findIndex((w) => w.id === targetWidgetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newWidgets = [...dashboardConfig.widgets]
    const [removed] = newWidgets.splice(draggedIndex, 1)
    newWidgets.splice(targetIndex, 0, removed)

    setDashboardConfig({ ...dashboardConfig, widgets: newWidgets })
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
    saveDashboardConfig()
  }

  if (isLoading || !dashboardConfig) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-bark font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isOrgAdmin = profile?.org_role === "org_admin"

  // ============================================
  // METRICS CALCULATIONS (Command Center Philosophy)
  // ============================================
  
  const now = new Date()
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const fortyEightHoursFromNow = new Date()
  fortyEightHoursFromNow.setHours(fortyEightHoursFromNow.getHours() + 48)

  // Priority Inbox metrics (combines messages + support requests)
  const unansweredMessages = conversations.filter((c) => {
    // Messages that haven't been read or responded to by rescue staff
    return c.last_message_sender_role === "foster" && !c.read_by_rescue
  }).length
  const openSupportRequests = helpRequests.filter((r) => r.status === "open").length
  const totalInboxItems = unansweredMessages + openSupportRequests

  // Animals Needing Attention metrics
  const medicalFlags = dogs.filter((d) => d.status === "medical-hold" || d.medical_notes?.includes("urgent")).length
  const behaviorAlerts = dogs.filter((d) => d.behavior_notes?.includes("caution") || d.behavior_notes?.includes("alert")).length
  const animalsWithoutFoster = dogs.filter((d) => !d.foster_id && d.status !== "adopted").length
  const staleRecords = dogs.filter((d) => {
    const lastUpdate = new Date(d.updated_at || d.created_at || "")
    return lastUpdate < threeDaysAgo
  }).length
  // Get top 3 animals by urgency
  const urgentAnimals = dogs
    .filter((d) => d.status === "medical-hold" || !d.foster_id || d.behavior_notes)
    .slice(0, 3)

  // Foster Network Status metrics  
  const activeFosters = fosters.length
  const fostersWithDogs = fosters.filter((f) => dogs.some((d) => d.foster_id === f.id)).length
  const availableCapacity = activeFosters - fostersWithDogs
  const fostersWithOpenRequests = fosters.filter((f) =>
    helpRequests.some((r) => r.foster_id === f.id && r.status === "open")
  ).length
  
  // 3-state Foster Network Status logic
  type FosterNetworkStatus = "needs-attention" | "at-capacity" | "healthy"
  const fosterNetworkStatus: FosterNetworkStatus = 
    fostersWithOpenRequests > 0 ? "needs-attention" :
    availableCapacity === 0 ? "at-capacity" : "healthy"
  
  const fosterStatusConfig = {
    "needs-attention": {
      badge: "Needs attention",
      badgeClass: "bg-red-100 text-red-700",
      reason: `${fostersWithOpenRequests} foster support request${fostersWithOpenRequests > 1 ? "s" : ""} open`,
    },
    "at-capacity": {
      badge: "At capacity",
      badgeClass: "bg-amber-100 text-amber-700",
      reason: "No available foster spots right now",
    },
    "healthy": {
      badge: "Healthy",
      badgeClass: "bg-emerald-100 text-emerald-700",
      reason: "Capacity available, no active support issues",
    },
  }
  const currentFosterStatus = fosterStatusConfig[fosterNetworkStatus]

  // Today's Schedule metrics
  const todaysAppointments = appointments.filter((appt) => {
    const apptDate = new Date(appt.start_time)
    return apptDate >= now && apptDate <= fortyEightHoursFromNow && appt.status === "scheduled"
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  // Team Load metrics (optional widget)
  const teamWorkload = {
    medical: helpRequests.filter((r) => r.category === "medical" && r.status === "open").length,
    adoption: helpRequests.filter((r) => r.category === "adoption" && r.status === "open").length,
    fosterSupport: helpRequests.filter((r) => r.category === "supplies" || r.category === "behavioral" && r.status === "open").length,
  }

  const getAddedWidgetTypes = () => dashboardConfig.widgets.map((w) => w.type)
  const addedTypes = getAddedWidgetTypes()

  const renderWidget = (widget: Widget) => {
    const isHovered = hoveredWidget === widget.id
    const isDragging = draggedWidget === widget.id

    const baseClasses = `
      group relative bg-white rounded-xl 
      transition-all duration-200 ease-out
      ${isCustomizing 
        ? "cursor-grab active:cursor-grabbing border-2 border-gray-200 hover:border-primary-orange/40" 
        : "border border-gray-200/80 hover:border-gray-300"
      }
      ${isHovered && isCustomizing ? "shadow-xl border-primary-orange/60 scale-[1.01] ring-4 ring-primary-orange/10" : "shadow-sm hover:shadow-md"}
      ${isDragging ? "opacity-40 scale-95" : ""}
      col-span-12
    `

    const widgetContent = () => {
      switch (widget.type) {
        // ============================================
        // PRIORITY INBOX - Combines messages + support requests
        // "Who needs a response?"
        // ============================================
        case "priority-inbox":
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Priority Inbox</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Who needs a response?</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {totalInboxItems === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">All caught up</p>
                  <p className="text-xs text-gray-500 mt-1">No action needed right now</p>
                </div>
              ) : (
                <>
                  {/* Main count badge */}
                  <Link
                    href={`/org/${orgId}/admin/messages`}
                    className="block p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all mb-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Inbox className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">{totalInboxItems}</div>
                          <div className="text-xs text-gray-600">need attention</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                  
                  {/* Breakdown by type */}
                  <div className="space-y-1.5">
                    {unansweredMessages > 0 && (
                      <Link
                        href={`/org/${orgId}/admin/messages`}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Foster Messages</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{unansweredMessages}</span>
                      </Link>
                    )}
                    {openSupportRequests > 0 && (
                      <Link
                        href={`/org/${orgId}/admin/help-requests`}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-gray-600">Support Requests</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{openSupportRequests}</span>
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          )

        // ============================================
        // ANIMAL HEALTH & STATUS (NEW)
        // "Do any animals need attention right now?"
        // ============================================
        case "animal-health-status":
        case "animals-needing-attention": // Legacy support
          const totalAnimalIssues = medicalFlags + behaviorAlerts + animalsWithoutFoster
          
          // 3-state Animal Health Status logic
          type AnimalHealthStatus = "needs-attention" | "heads-up" | "stable"
          const animalHealthStatus: AnimalHealthStatus = 
            (medicalFlags > 0 || totalAnimalIssues >= 3) ? "needs-attention" :
            totalAnimalIssues > 0 ? "heads-up" : "stable"
          
          const animalStatusConfig = {
            "needs-attention": {
              badge: "Needs attention",
              badgeClass: "bg-red-100 text-red-700",
            },
            "heads-up": {
              badge: "Heads up",
              badgeClass: "bg-amber-100 text-amber-700",
            },
            "stable": {
              badge: "Stable",
              badgeClass: "bg-emerald-100 text-emerald-700",
            },
          }
          const currentAnimalStatus = animalStatusConfig[animalHealthStatus]
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">Animal Health & Status</h3>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${currentAnimalStatus.badgeClass}`}>
                      {currentAnimalStatus.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Quick view of animals needing action</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {totalAnimalIssues === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">All animals look stable right now</p>
                  <p className="text-xs text-gray-500 mt-1">No urgent issues detected</p>
                </div>
              ) : (
                <>
                  {/* 3 metrics row */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-3 rounded-lg bg-gray-50 text-center">
                      <div className={`text-xl font-bold ${animalsWithoutFoster > 0 ? "text-blue-600" : "text-gray-400"}`}>
                        {animalsWithoutFoster || "—"}
                      </div>
                      <div className="text-[10px] text-gray-500">Needing placement</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 text-center">
                      <div className={`text-xl font-bold ${medicalFlags > 0 ? "text-red-600" : "text-gray-400"}`}>
                        {medicalFlags || "—"}
                      </div>
                      <div className="text-[10px] text-gray-500">Medical follow-ups</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 text-center">
                      <div className={`text-xl font-bold ${behaviorAlerts > 0 ? "text-amber-600" : "text-gray-400"}`}>
                        {behaviorAlerts || "—"}
                      </div>
                      <div className="text-[10px] text-gray-500">Behavior flags</div>
                    </div>
                  </div>
                  
                  {/* Top 3 urgent animals preview */}
                  {urgentAnimals.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {urgentAnimals.map((animal) => {
                        // Determine badge type for this animal
                        const isPlacement = !animal.foster_id
                        const isMedical = animal.status === "medical-hold"
                        const isBehavior = animal.behavior_notes
                        const badgeType = isMedical ? "Medical" : isPlacement ? "Placement" : isBehavior ? "Behavior" : ""
                        const badgeColor = isMedical ? "bg-red-100 text-red-700" : isPlacement ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        
                        return (
                          <Link
                            key={animal.id}
                            href={`/org/${orgId}/admin/dogs/${animal.id}`}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <PawPrint className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{animal.name}</span>
                              {badgeType && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${badgeColor}`}>
                                  {badgeType}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-primary-orange font-medium">View</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  
                  <Link
                    href={`/org/${orgId}/admin/dogs`}
                    className="block text-center text-xs font-medium text-primary-orange hover:text-primary-orange/80 transition-colors"
                  >
                    View Animals →
                  </Link>
                </>
              )}
            </div>
          )

        // ============================================
        // FOSTER NETWORK STATUS
        // "Do we have foster capacity, and are they okay?"
        // ============================================
        case "foster-network-status":
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">Foster Network Status</h3>
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${currentFosterStatus.badgeClass}`}>
                      {currentFosterStatus.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{currentFosterStatus.reason}</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Simple stats row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-gray-900">{activeFosters}</div>
                  <div className="text-xs text-gray-500">Active Fosters</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-2xl font-bold text-emerald-600">{fostersWithDogs}</div>
                  <div className="text-xs text-gray-500">Currently Fostering</div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                  <span className="text-sm text-gray-600">Available Capacity</span>
                  <span className={`text-sm font-semibold ${availableCapacity === 0 ? "text-amber-600" : "text-gray-900"}`}>
                    {availableCapacity}
                  </span>
                </div>
                {fostersWithOpenRequests > 0 && (
                  <Link
                    href={`/org/${orgId}/admin/help-requests`}
                    className="flex items-center justify-between p-2 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <span className="text-sm text-red-700">Fosters with open requests</span>
                    <span className="text-sm font-semibold text-red-700">{fostersWithOpenRequests}</span>
                  </Link>
                )}
              </div>
              
              <Link
                href={`/org/${orgId}/admin/fosters`}
                className="block mt-3 text-center text-xs font-medium text-primary-orange hover:text-primary-orange/80 transition-colors"
              >
                View Fosters →
              </Link>
            </div>
          )

        // ============================================
        // TODAY'S SCHEDULE
        // "What's happening today?"
        // ============================================
        case "todays-schedule":
          const typeLabels: Record<string, string> = {
            vet_visit: "Vet Visit",
            home_check: "Home Check",
            drop_off: "Drop Off",
            pick_up: "Pick Up",
            training: "Training",
            meet_and_greet: "Meet & Greet",
            foster_check_in: "Foster Check-In",
            team_meeting: "Team Meeting",
            other: "Other",
          }

          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Today's Schedule</h3>
                  <p className="text-xs text-gray-500 mt-0.5">What's happening today and next 48 hours</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {todaysAppointments.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Nothing scheduled</p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Clear schedule for the next 48 hours</p>
                  <Link
                    href={`/org/${orgId}/admin/appointments`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-orange hover:text-primary-orange/80 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Appointment
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaysAppointments.slice(0, 5).map((appt) => (
                    <Link
                      key={appt.id}
                      href={`/org/${orgId}/admin/appointments`}
                      className="flex items-start gap-3 p-2.5 -mx-2.5 rounded-md hover:bg-gray-50 transition-colors group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="text-sm font-medium text-gray-900 truncate">{appt.title}</div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 whitespace-nowrap">
                            {typeLabels[appt.appointment_type] || "Other"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(appt.start_time).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {new Date(appt.start_time).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                          {appt.foster && <span className="text-gray-400">|</span>}
                          {appt.foster && <span>{appt.foster.name}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link
                    href={`/org/${orgId}/admin/appointments`}
                    className="block text-center text-xs font-medium text-primary-orange hover:text-primary-orange/80 transition-colors pt-2"
                  >
                    View Calendar →
                  </Link>
                </div>
              )}
            </div>
          )

        // ============================================
        // TEAM LOAD (Optional)
        // "Is anyone overloaded?"
        // ============================================
        case "team-load":
          const totalTeamWorkload = teamWorkload.medical + teamWorkload.adoption + teamWorkload.fosterSupport
          const highestWorkload = Math.max(teamWorkload.medical, teamWorkload.adoption, teamWorkload.fosterSupport)
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">Team Load</h3>
                  {highestWorkload > 5 && (
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
                      Overloaded
                    </span>
                  )}
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {totalTeamWorkload === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Teams balanced</p>
                  <p className="text-xs text-gray-500 mt-1">No overloaded teams</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${teamWorkload.medical > 5 ? "bg-red-500" : "bg-emerald-500"}`} />
                      <span className="text-sm text-gray-700">Medical Team</span>
                    </div>
                    <span className={`text-sm font-semibold ${teamWorkload.medical > 5 ? "text-red-600" : "text-gray-900"}`}>
                      {teamWorkload.medical} open
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${teamWorkload.adoption > 5 ? "bg-red-500" : "bg-emerald-500"}`} />
                      <span className="text-sm text-gray-700">Adoption Team</span>
                    </div>
                    <span className={`text-sm font-semibold ${teamWorkload.adoption > 5 ? "text-red-600" : "text-gray-900"}`}>
                      {teamWorkload.adoption} open
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${teamWorkload.fosterSupport > 5 ? "bg-red-500" : "bg-emerald-500"}`} />
                      <span className="text-sm text-gray-700">Foster Support</span>
                    </div>
                    <span className={`text-sm font-semibold ${teamWorkload.fosterSupport > 5 ? "text-red-600" : "text-gray-900"}`}>
                      {teamWorkload.fosterSupport} open
                    </span>
                  </div>
                </div>
              )}
            </div>
          )

        // ============================================
        // OUTREACH & COMMUNICATIONS (Optional)
        // Support outbound rescue actions
        // ============================================
        case "outreach-communications":
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Outreach & Communications</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Foster announcements and adoption pushes</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Alert for animals needing placement */}
              {animalsWithoutFoster > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 mb-3">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-medium">{animalsWithoutFoster} animals need foster placement</span>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Link
                  href={`/org/${orgId}/admin/communications`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-primary-orange/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Create Announcement</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div
        key={widget.id}
        className={baseClasses}
        draggable={isCustomizing}
        onDragStart={() => handleDragStart(widget.id)}
        onDragOver={(e) => handleDragOver(e, widget.id)}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setHoveredWidget(widget.id)}
        onMouseLeave={() => setHoveredWidget(null)}
      >
        {isCustomizing && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="px-2 py-0.5 rounded-full bg-gray-900 text-white text-[10px] font-medium flex items-center gap-1 shadow-lg">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </div>
          </div>
        )}
        {widgetContent()}
      </div>
    )
  }

  const renderEmptyState = () => (
    <div className="col-span-12 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Up Your Command Center</h3>
        <p className="text-sm text-gray-600 mb-6">
          Add tiles to see what needs attention at a glance. We recommend starting with Priority Inbox, Animals Needing Attention, and Foster Network Status.
        </p>
        {isOrgAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-orange text-white font-medium text-sm hover:bg-primary-orange/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tile
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isCustomizing ? "bg-gray-100" : "bg-[#FAFAF9]"}`}>
      {isCustomizing && (
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(215, 107, 26, 0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(215, 107, 26, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: "32px 32px",
          }}
        />
      )}

      <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-10 py-6 md:py-8 lg:py-10 relative z-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1.5 tracking-tight">Command Center</h1>
            <p className="text-sm text-gray-600">Daily operations overview</p>
          </div>
          <div className="flex items-center gap-3">
            {isCustomizing && isOrgAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md font-medium text-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Tile
              </button>
            )}
            {isOrgAdmin && (
              <button
                onClick={() => {
                  if (isCustomizing) {
                    saveDashboardConfig()
                  }
                  setIsCustomizing(!isCustomizing)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isCustomizing
                    ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {isCustomizing ? <span>Save & Exit</span> : <span>Customize</span>}
              </button>
            )}
          </div>
        </div>

        <div 
          className={`grid grid-cols-12 auto-rows-auto ${
            isCustomizing ? "gap-4" : "gap-3"
          }`}
        >
          {dashboardConfig.widgets.length === 0
            ? renderEmptyState()
            : dashboardConfig.widgets.map((widget) => renderWidget(widget))}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Tile</h2>
                <p className="text-sm text-gray-600 mt-1">Choose a tile to add to your Command Center</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(AVAILABLE_WIDGETS).map(([category, widgets]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      {category === "Core Tiles" && <Dog className="w-4 h-4" />}
                      {category === "Advanced Tiles" && <UsersRound className="w-4 h-4" />}
                      {category}
                    </h3>
                    <div className="grid gap-3">
                      {widgets.map((widget) => {
                        const isAdded = addedTypes.includes(widget.id)
                        return (
                          <button
                            key={widget.id}
                            onClick={() => !isAdded && addWidget(widget)}
                            disabled={isAdded}
                            className={`text-left p-4 rounded-lg border transition-all ${
                              isAdded
                                ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                                : "border-gray-200 bg-white hover:border-primary-orange/40 hover:shadow-md cursor-pointer"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1">{widget.name}</div>
                                <div className="text-xs text-gray-500">{widget.description}</div>
                              </div>
                              {isAdded && (
                                <span className="ml-3 inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
                                  Added
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
