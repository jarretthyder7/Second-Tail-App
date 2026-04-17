"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
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
  DollarSign,
  Stethoscope,
  ArrowRight,
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
  | "pending-requests"      // NEW: Appointment + supply requests
  | "recent-activity"       // NEW: Last 5 actions
  | "animals-without-updates" // NEW: Animals needing log entries
  | "reimbursements-pending" // NEW: Pending reimbursement requests
  | "foster-checkins-needed" // NEW: Fosters needing check-ins

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
      description: "Who needs a response? Messages + Support Requests + Appointment Requests",
      defaultSpan: 6,
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
      defaultSpan: 6,
      isDefault: true,
    },
    {
      id: "todays-schedule",
      name: "Today's Schedule",
      description: "What's happening today and next 48 hours",
      defaultSpan: 6,
      isDefault: false,
    },
    {
      id: "recent-activity",
      name: "Recent Activity",
      description: "What happened in the last 24 hours",
      defaultSpan: 6,
      isDefault: false,
    },
  ],
  "Advanced Tiles": [
    {
      id: "team-load",
      name: "Team Load",
      description: "Is anyone overloaded? Staff workload overview",
      defaultSpan: 6,
      isDefault: false,
    },
    {
      id: "outreach-communications",
      name: "Outreach & Communications",
      description: "Foster announcements and adoption pushes",
      defaultSpan: 6,
      isDefault: false,
    },
    {
      id: "animals-without-updates",
      name: "Animals Without Updates",
      description: "Animals that haven't had a log entry in 3+ days",
      defaultSpan: 6,
      isDefault: false,
    },
    {
      id: "reimbursements-pending",
      name: "Reimbursements Pending",
      description: "Foster reimbursement requests waiting for approval",
      defaultSpan: 6,
      isDefault: false,
    },
    {
      id: "foster-checkins-needed",
      name: "Foster Check-ins Needed",
      description: "Fosters who haven't logged an update recently",
      defaultSpan: 6,
      isDefault: false,
    },
  ],
}

// Default tiles for new organizations (auto-created during onboarding)
const DEFAULT_WIDGETS: Widget[] = [
  { id: "default-1", type: "priority-inbox", col_span: 6 },
  { id: "default-2", type: "todays-schedule", col_span: 6 },
  { id: "default-3", type: "animal-health-status", col_span: 12 },
  { id: "default-4", type: "foster-network-status", col_span: 6 },
  { id: "default-5", type: "animals-without-updates", col_span: 6 },
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
  const { toast } = useToast()
  const newTileRef = useRef<HTMLDivElement | null>(null)

  const [isCustomizing, setIsCustomizing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null)
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null)
  const [highlightedWidgetId, setHighlightedWidgetId] = useState<string | null>(null)

  const [dogs, setDogs] = useState<any[]>([])
  const [fosters, setFosters] = useState<any[]>([])
  const [helpRequests, setHelpRequests] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [appointmentRequests, setAppointmentRequests] = useState<any[]>([])
  const [supplyRequests, setSupplyRequests] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [reimbursements, setReimbursements] = useState<any[]>([])
  const [dailyLogs, setDailyLogs] = useState<any[]>([])
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
        const [dogsRes, fostersRes, requestsRes, appointmentsRes, conversationsRes, appointmentReqRes, reimbursementsRes, dailyLogsRes] = await Promise.all([
          fetch(`/api/admin/dogs?orgId=${orgId}`),
          fetch(`/api/admin/fosters?orgId=${orgId}`),
          fetch(`/api/admin/help-requests?orgId=${orgId}`),
          fetch(`/api/admin/appointments?orgId=${orgId}`),
          fetch(`/api/admin/conversations?orgId=${orgId}`),
          fetch(`/api/admin/appointment-requests?orgId=${orgId}`),
          fetch(`/api/admin/reimbursements?orgId=${orgId}`),
          fetch(`/api/admin/daily-logs?orgId=${orgId}`),
        ])

        const [dogsData, fostersData, requestsData, appointmentsData, conversationsData, appointmentReqData, reimbursementsData, dailyLogsData] = await Promise.all([
          dogsRes.ok ? dogsRes.json() : { dogs: [] },
          fostersRes.ok ? fostersRes.json() : { fosters: [] },
          requestsRes.ok ? requestsRes.json() : { requests: [] },
          appointmentsRes.ok ? appointmentsRes.json() : { appointments: [] },
          conversationsRes.ok ? conversationsRes.json() : { conversations: [] },
          appointmentReqRes.ok ? appointmentReqRes.json() : { requests: [] },
          reimbursementsRes.ok ? reimbursementsRes.json() : { reimbursements: [] },
          dailyLogsRes.ok ? dailyLogsRes.json() : { logs: [] },
        ])

        setDogs(dogsData.dogs || [])
        setFosters(fostersData.fosters || [])
        setHelpRequests(requestsData.requests || [])
        setAppointments(appointmentsData.appointments || [])
        setConversations(conversationsData.conversations || [])
        setAppointmentRequests(appointmentReqData.requests || [])
        setReimbursements(reimbursementsData.reimbursements || [])
        setDailyLogs(dailyLogsData.logs || [])

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
        console.error("Error loading dashboard data:", error)
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
      console.error("Error saving dashboard config:", error)
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
    
    // Close the modal immediately
    setShowAddModal(false)
    
    // Enter customize mode so user can reposition
    setIsCustomizing(true)
    
    // Show toast notification with drag icon
    toast({
      title: "Tile added",
      description: "Drag to reposition",
    })
    
    // Highlight the new tile and scroll to it after a brief delay
    setHighlightedWidgetId(newWidget.id)
    setTimeout(() => {
      const element = document.querySelector(`[data-widget-id="${newWidget.id}"]`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedWidgetId(null)
      }, 2000)
    }, 100)
  }

  const removeWidget = (widgetId: string) => {
    if (!dashboardConfig) return

    setDashboardConfig({
      ...dashboardConfig,
      widgets: dashboardConfig.widgets.filter((w) => w.id !== widgetId),
    })
  }

  const handleDragStart = (widgetId: string) => {
    if (!isCustomizing) return
    setDraggedWidget(widgetId)
  }

  const handleDragOver = (e: React.DragEvent, targetWidgetId: string) => {
    if (!isCustomizing) return
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
    if (!isCustomizing) return
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

  // Priority Inbox metrics (combines messages + support requests + appointment requests)
  const unansweredMessages = conversations.filter((c) => {
    // Messages that haven't been read or responded to by rescue staff
    return c.last_message_sender_role === "foster" && !c.read_by_rescue
  }).length
  const openSupportRequests = helpRequests.filter((r) => r.status === "open").length
  const pendingAppointmentRequests = appointmentRequests.filter((r) => r.status === "pending").length
  const totalInboxItems = unansweredMessages + openSupportRequests + pendingAppointmentRequests

  // Animals Needing Attention metrics
  const totalAnimalsInCare = dogs.filter((d) => d.status !== "adopted").length
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

  const getColSpanClass = (colSpan: number) =>
    colSpan === 6 ? "col-span-12 md:col-span-6" : "col-span-12"

  const renderWidget = (widget: Widget) => {
    const isHovered = hoveredWidget === widget.id
    const isDragging = draggedWidget === widget.id
    const isHighlighted = highlightedWidgetId === widget.id

    const baseClasses = `
      group relative bg-white rounded-xl
      transition-all duration-200 ease-out
      ${isCustomizing
        ? "cursor-grab active:cursor-grabbing border-2 border-border-soft hover:border-primary-orange/40"
        : "border border-border-soft hover:border-border-strong"
      }
      ${isHovered && isCustomizing ? "shadow-lg border-primary-orange/60 scale-[1.01] ring-4 ring-primary-orange/10" : "shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"}
      ${isDragging ? "opacity-40 scale-95" : ""}
      ${isHighlighted ? "animate-highlight-pulse" : ""}
      ${getColSpanClass(widget.col_span)}
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
                  <h3 className="text-base font-bold text-primary-bark">Priority Inbox</h3>
                  <p className="text-xs text-primary-bark/60 mt-0.5">Who needs a response?</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-status-error-bg text-primary-bark/40 hover:text-status-error transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {totalInboxItems === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-status-success" />
                  </div>
                  <p className="text-sm font-semibold text-primary-bark">All caught up</p>
                  <p className="text-xs text-primary-bark/50 mt-1">No action needed right now</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Total badge */}
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-xs text-primary-bark/50 font-medium">{totalInboxItems} item{totalInboxItems !== 1 ? "s" : ""} need attention</span>
                  </div>

                  {unansweredMessages > 0 && (
                    <Link
                      href={`/org/${orgId}/admin/messages`}
                      className="flex items-center justify-between p-3 rounded-lg bg-primary-orange-light border border-primary-orange/20 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-primary-orange" />
                        </div>
                        <span className="text-sm font-medium text-primary-bark">Foster Messages</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-primary-bark">{unansweredMessages}</span>
                        <ChevronRight className="w-4 h-4 text-primary-bark/30" />
                      </div>
                    </Link>
                  )}

                  {openSupportRequests > 0 && (
                    <Link
                      href={`/org/${orgId}/admin/settings/help-requests`}
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-primary-bark">Support Requests</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-primary-bark">{openSupportRequests}</span>
                        <ChevronRight className="w-4 h-4 text-primary-bark/30" />
                      </div>
                    </Link>
                  )}

                  {pendingAppointmentRequests > 0 && (
                    <Link
                      href={`/org/${orgId}/admin/appointments`}
                      className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CalendarIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-primary-bark">Appointment Requests</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-primary-bark">{pendingAppointmentRequests}</span>
                        <ChevronRight className="w-4 h-4 text-primary-bark/30" />
                      </div>
                    </Link>
                  )}
                </div>
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
              badgeClass: "bg-status-error-bg text-status-error border border-status-error-border",
            },
            "heads-up": {
              badge: "Heads up",
              badgeClass: "bg-status-warning-bg text-status-warning border border-status-warning-border",
            },
            "stable": {
              badge: "Stable",
              badgeClass: "bg-status-success-bg text-status-success border border-status-success-border",
            },
          }
          const currentAnimalStatus = animalStatusConfig[animalHealthStatus]
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-primary-bark">Animal Health & Status</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${currentAnimalStatus.badgeClass}`}>
                      {currentAnimalStatus.badge}
                    </span>
                  </div>
                  <p className="text-xs text-primary-bark/60 mt-0.5">Quick view of animals needing action</p>
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
                    <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-center">
                      <div className={`text-xl font-bold ${animalsWithoutFoster > 0 ? "text-blue-600" : "text-gray-300"}`}>
                        {animalsWithoutFoster}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Needing placement</div>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50/60 border border-red-100 text-center">
                      <div className={`text-xl font-bold ${medicalFlags > 0 ? "text-red-600" : "text-gray-300"}`}>
                        {medicalFlags}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Medical follow-ups</div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 text-center">
                      <div className={`text-xl font-bold ${behaviorAlerts > 0 ? "text-amber-600" : "text-gray-300"}`}>
                        {behaviorAlerts}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Behavior flags</div>
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
                            href={`/org/${orgId}/admin/animals/${animal.id}`}
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
                    href={`/org/${orgId}/admin/animals`}
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
                    href={`/org/${orgId}/admin/request-supplies`}
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

        // ============================================
        // PENDING REQUESTS - Appointment + Supply Requests
        // ============================================
        case "pending-requests":
          const pendingAppointments = appointmentRequests.filter(r => r.status === "pending").length
          const pendingSupplies = helpRequests.filter(r => r.category === "supplies" && r.status === "open").length
          const totalPendingRequests = pendingAppointments + pendingSupplies
          
          // Check for items waiting >24 hours
          const now24 = new Date()
          const oneDayAgo = new Date(now24.getTime() - 24 * 60 * 60 * 1000)
          const oldRequests = appointmentRequests.filter(r => r.status === "pending" && new Date(r.created_at) < oneDayAgo).length +
                             helpRequests.filter(r => r.category === "supplies" && r.status === "open" && new Date(r.created_at) < oneDayAgo).length
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary-bark">Pending Requests</h3>
                  <p className="text-xs text-primary-bark/60 mt-0.5">Waiting for your response</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-status-error-bg text-primary-bark/40 hover:text-status-error transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {totalPendingRequests === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-status-success" />
                  </div>
                  <p className="text-sm font-semibold text-primary-bark">All caught up</p>
                  <p className="text-xs text-primary-bark/50 mt-1">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingAppointments > 0 && (
                    <Link
                      href={`/org/${orgId}/admin/appointment-requests`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        oldRequests > 0 
                          ? "bg-status-error-bg border border-status-error-border hover:shadow-md" 
                          : "bg-primary-orange-light border border-primary-orange/20 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          oldRequests > 0 ? "bg-status-error/10" : "bg-primary-orange/10"
                        }`}>
                          <CalendarIcon className={`w-5 h-5 ${oldRequests > 0 ? "text-status-error" : "text-primary-orange"}`} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-primary-bark">{pendingAppointments}</div>
                          <div className="text-xs text-primary-bark/60">Appointment Requests</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-primary-bark/30" />
                    </Link>
                  )}
                  {pendingSupplies > 0 && (
                    <Link
                      href={`/org/${orgId}/admin/request-supplies`}
                      className="flex items-center justify-between p-3 rounded-lg bg-primary-orange-light border border-primary-orange/20 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-primary-orange" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-primary-bark">{pendingSupplies}</div>
                          <div className="text-xs text-primary-bark/60">Supply Requests</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-primary-bark/30" />
                    </Link>
                  )}
                  {oldRequests > 0 && (
                    <div className="p-3 rounded-lg bg-status-error-bg border border-status-error-border">
                      <div className="flex items-center gap-2 text-sm text-status-error">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">{oldRequests} request(s) waiting over 24 hours</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )

        // ============================================
        // RECENT ACTIVITY - Last 5 actions
        // ============================================
        case "recent-activity":
          // Build activity log from various events (help requests, timeline events, etc)
          const activityEvents = [
            ...helpRequests.slice(0, 2).map(r => ({
              id: r.id,
              type: "help-request",
              title: `${r.foster_id ? "Foster" : "System"} submitted ${r.category} request`,
              timestamp: new Date(r.created_at),
              link: `/org/${orgId}/admin/request-supplies`,
            })),
            ...appointments.slice(0, 2).map(a => ({
              id: a.id,
              type: "appointment",
              title: `Appointment scheduled: ${a.title}`,
              timestamp: new Date(a.created_at),
              link: `/org/${orgId}/admin/appointments`,
            })),
            ...conversations.slice(0, 1).map(c => ({
              id: c.id,
              type: "message",
              title: "New foster message received",
              timestamp: new Date(c.updated_at),
              link: `/org/${orgId}/admin/messages`,
            })),
          ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5)
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary-bark">Recent Activity</h3>
                  <p className="text-xs text-primary-bark/60 mt-0.5">Last 24 hours</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-status-error-bg text-primary-bark/40 hover:text-status-error transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {activityEvents.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-cream flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-primary-bark">No activity yet</p>
                  <p className="text-xs text-primary-bark/50 mt-1">Check back soon</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activityEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={event.link}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-cream transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-2 h-2 rounded-full bg-primary-orange flex-shrink-0" />
                        <span className="text-sm text-primary-bark">{event.title}</span>
                      </div>
                      <span className="text-xs text-primary-bark/50 flex-shrink-0">
                        {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )

        // ============================================
        // ANIMALS WITHOUT UPDATES - 3+ days without log
        // ============================================
        case "animals-without-updates":
          const threeDaysAgoDate = new Date()
          threeDaysAgoDate.setDate(threeDaysAgoDate.getDate() - 3)
          const sevenDaysAgoDate = new Date()
          sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7)
          
          const animalsWithoutLogsMap = new Map()
          dogs.forEach(dog => {
            const lastLog = dailyLogs.filter(l => l.dog_id === dog.id).sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0]
            const lastUpdateDate = lastLog ? new Date(lastLog.date) : new Date(dog.created_at)
            if (lastUpdateDate < threeDaysAgoDate) {
              const daysSinceUpdate = Math.floor((new Date().getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
              animalsWithoutLogsMap.set(dog.id, { dog, daysSinceUpdate, isUrgent: daysSinceUpdate >= 7 })
            }
          })
          
          const animalsWithoutLogs = Array.from(animalsWithoutLogsMap.values())
            .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
            .slice(0, 5)
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary-bark">Animals Without Updates</h3>
                  <p className="text-xs text-primary-bark/60 mt-0.5">No log entry in 3+ days</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-status-error-bg text-primary-bark/40 hover:text-status-error transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {animalsWithoutLogs.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-status-success" />
                  </div>
                  <p className="text-sm font-semibold text-primary-bark">All animals up to date</p>
                  <p className="text-xs text-primary-bark/50 mt-1">Everyone has recent logs</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {animalsWithoutLogs.map((item) => (
                    <Link
                      key={item.dog.id}
                      href={`/org/${orgId}/admin/animals/${item.dog.id}`}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        item.isUrgent 
                          ? "bg-status-error-bg border border-status-error-border hover:shadow-md"
                          : "bg-neutral-cream border border-border-soft hover:bg-neutral-cream/80"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <PawPrint className={`w-4 h-4 ${item.isUrgent ? "text-status-error" : "text-primary-bark/40"}`} />
                        <span className="text-sm font-medium text-primary-bark">{item.dog.name}</span>
                      </div>
                      <span className={`text-xs font-bold ${item.isUrgent ? "text-status-error" : "text-primary-bark/60"}`}>
                        {item.daysSinceUpdate}d ago
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )

        // ============================================
        // REIMBURSEMENTS PENDING - Foster reimbursement requests
        // ============================================
        case "reimbursements-pending":
          const pendingReimbursements = reimbursements.filter(r => r.status === "pending").length
          const totalPendingAmount = reimbursements
            .filter(r => r.status === "pending")
            .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary-bark">Reimbursements Pending</h3>
                  <p className="text-xs text-primary-bark/60 mt-0.5">Waiting for approval</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-status-error-bg text-primary-bark/40 hover:text-status-error transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {pendingReimbursements === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-status-success" />
                  </div>
                  <p className="text-sm font-semibold text-primary-bark">All paid up</p>
                  <p className="text-xs text-primary-bark/50 mt-1">No pending reimbursements</p>
                </div>
              ) : (
                <Link
                  href={`/org/${orgId}/admin/reimbursements`}
                  className="block p-4 rounded-lg bg-primary-orange-light border border-primary-orange/20 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-orange/10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-primary-orange" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-primary-bark">{pendingReimbursements}</div>
                        <div className="text-xs text-primary-bark/60">Pending Request(s)</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary-bark/30" />
                  </div>
                  <div className="text-sm font-bold text-primary-bark">
                    ${totalPendingAmount.toFixed(2)} total
                  </div>
                </Link>
              )}
            </div>
          )

        // ============================================
        // FOSTER CHECK-INS NEEDED - No updates in 5+ days
        // ============================================
        case "foster-checkins-needed":
          const fiveDaysAgoCheckin = new Date()
          fiveDaysAgoCheckin.setDate(fiveDaysAgoCheckin.getDate() - 5)
          
          const fostersNeedingCheckin = fosters.filter(foster => {
            const lastMessage = conversations.filter(c => c.recipient_id === foster.id || c.team).sort((a, b) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )[0]
            const lastLog = dailyLogs.filter(l => l.foster_id === foster.id).sort((a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0]
            
            const lastUpdate = lastMessage 
              ? new Date(lastMessage.updated_at)
              : lastLog
              ? new Date(lastLog.date)
              : new Date(foster.created_at || 0)
            
            return lastUpdate < fiveDaysAgoCheckin
          }).slice(0, 5)
          
          return (
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-primary-bark">Foster Check-ins Needed</h3>
                  <p className="text-xs text-primary-bark/60 mt-0.5">No update in 5+ days</p>
                </div>
                {isCustomizing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeWidget(widget.id)
                    }}
                    className="p-1.5 rounded-md hover:bg-status-error-bg text-primary-bark/40 hover:text-status-error transition-colors"
                    title="Remove widget"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {fostersNeedingCheckin.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-status-success" />
                  </div>
                  <p className="text-sm font-semibold text-primary-bark">All fosters active</p>
                  <p className="text-xs text-primary-bark/50 mt-1">Everyone checked in recently</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fostersNeedingCheckin.map((foster) => (
                    <div
                      key={foster.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-cream border border-border-soft hover:bg-neutral-cream/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary-bark/40" />
                        <span className="text-sm font-medium text-primary-bark">{foster.name || foster.email}</span>
                      </div>
                      <Link
                        href={`/org/${orgId}/admin/messages?to=${foster.id}`}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary-orange text-white hover:bg-primary-orange/90 transition-colors"
                      >
                        Message
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )

        default:
          return null
      }
    }

    // Don't render the wrapper if the widget has no content (e.g. unknown type)
    const content = widgetContent()
    if (!content) return null

    return (
      <div
        key={widget.id}
        data-widget-id={widget.id}
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
        {content}
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
        {/* ── Greeting + actions row ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#D76B1A] mb-1">
              {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}
              {profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 tracking-tight">Command Center</h1>
            <p className="text-sm text-gray-400">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 pt-1">
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
                  if (isCustomizing) saveDashboardConfig()
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

        {/* ── Quick Actions ── */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href={`/org/${orgId}/admin/animals`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D76B1A] text-white rounded-lg text-xs font-semibold hover:bg-[#D76B1A]/90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Animal
          </Link>
          <Link
            href={`/org/${orgId}/admin/fosters`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-gray-300 hover:shadow-sm transition"
          >
            <UsersRound className="w-3.5 h-3.5 text-green-500" />
            Invite Foster
          </Link>
          <Link
            href={`/org/${orgId}/admin/communications`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-gray-300 hover:shadow-sm transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            Message Foster
          </Link>
          <Link
            href={`/org/${orgId}/admin/appointments`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-gray-300 hover:shadow-sm transition"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
            Appointments
          </Link>
          <Link
            href={`/org/${orgId}/admin/reimbursements`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-gray-300 hover:shadow-sm transition"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            Reimbursements
          </Link>
          <Link
            href={`/org/${orgId}/admin/request-supplies`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-gray-300 hover:shadow-sm transition"
          >
            <Stethoscope className="w-3.5 h-3.5 text-rose-500" />
            Supply Requests
          </Link>
        </div>

        {/* ── Stats Summary Bar ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Animals in Care */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-xl border border-orange-200/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-orange-700/70 uppercase tracking-wide">Animals in Care</span>
              <div className="w-8 h-8 rounded-lg bg-white/70 border border-orange-200/60 flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-[#D76B1A]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-orange-900">{totalAnimalsInCare}</div>
            <p className="text-xs text-orange-700/50 mt-1">Active placements</p>
          </div>

          {/* Active Fosters */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-xl border border-blue-200/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-blue-700/70 uppercase tracking-wide">Active Fosters</span>
              <div className="w-8 h-8 rounded-lg bg-white/70 border border-blue-200/60 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-900">{activeFosters}</div>
            <p className="text-xs text-blue-700/50 mt-1">Registered fosters</p>
          </div>

          {/* Need Response */}
          {totalInboxItems > 0 ? (
            <div className="bg-gradient-to-br from-red-50 to-red-100/60 rounded-xl border border-red-200/70 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-red-700/70 uppercase tracking-wide">Need Response</span>
                <div className="w-8 h-8 rounded-lg bg-white/70 border border-red-200/60 flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-700">{totalInboxItems}</div>
              <p className="text-xs text-red-600/60 mt-1">Awaiting reply</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 rounded-xl border border-emerald-200/70 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-emerald-700/70 uppercase tracking-wide">Need Response</span>
                <div className="w-8 h-8 rounded-lg bg-white/70 border border-emerald-200/60 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-emerald-700">0</div>
              <p className="text-xs text-emerald-700/50 mt-1">All caught up ✓</p>
            </div>
          )}

          {/* Appointments */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100/60 rounded-xl border border-purple-200/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-purple-700/70 uppercase tracking-wide">Appts (48h)</span>
              <div className="w-8 h-8 rounded-lg bg-white/70 border border-purple-200/60 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-900">{todaysAppointments.length}</div>
            <p className="text-xs text-purple-700/50 mt-1">Upcoming visits</p>
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
