"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Send, FileText, Users, Dog, Search, Check, ChevronRight, Eye, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Animal = {
  id: string
  name: string
  breed: string
  age: number
  image_url: string | null
  status: string
  stage: string
  intake_date: string
  foster_id?: string | null
}

type Foster = {
  id: string
  name: string
  email: string
}

type Organization = {
  id: string
  name: string
  logo_url?: string | null
  primary_color?: string | null
}

function CommunicationsContent() {
  const params = useParams()
  const orgId = params.orgId as string

  const [animals, setAnimals] = useState<Animal[]>([])
  const [fosters, setFosters] = useState<Foster[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")

  // Newsletter content state
  const [subject, setSubject] = useState("")
  const [intro, setIntro] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [animalUrls, setAnimalUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Load organization details
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, logo_url, primary_color")
        .eq("id", orgId)
        .single()

      if (orgData) {
        setOrg(orgData)
      }

      // Load animals
      const { data: animalsData } = await supabase
        .from("dogs")
        .select("*")
        .eq("organization_id", orgId)
        .order("intake_date", { ascending: true })

      if (animalsData) {
        setAnimals(animalsData)
      }

      // Get foster profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("organization_id", orgId)
        .eq("role", "foster")

      if (profilesData) {
        setFosters(profilesData)
      }

      setLoading(false)
    }

    loadData()
  }, [orgId])

  const toggleAnimalSelection = (animalId: string) => {
    setSelectedAnimals((prev) => (prev.includes(animalId) ? prev.filter((id) => id !== animalId) : [...prev, animalId]))
  }

  const selectAllNeedingFoster = () => {
    const needingFoster = animals.filter((a) => !a.foster_id && a.stage !== "adopted")
    setSelectedAnimals(needingFoster.map((a) => a.id))
  }

  const filteredAnimals = animals.filter(
    (animal) =>
      animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedAnimalDetails = animals.filter((a) => selectedAnimals.includes(a.id))

  const generateNewsletterHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FBF8F4;">
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #F7E2BD;">
          ${org?.logo_url ? `<img src="${org.logo_url}" alt="${org.name}" style="max-width: 120px; height: auto; margin-bottom: 16px;" />` : ""}
          <h1 style="color: #5A4A42; margin: 0;">${org?.name || "Animals Need Your Help!"}</h1>
        </div>
        
        <div style="padding: 20px 0;">
          <p style="color: #5A4A42; font-size: 16px; line-height: 1.6;">
            ${intro || "We have some wonderful animals looking for temporary foster homes. Can you help?"}
          </p>
        </div>
        
        ${selectedAnimalDetails
          .map(
            (animal) => `
          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #F7E2BD;">
            <div style="display: flex; gap: 16px; margin-bottom: 12px;">
              <img src="${animal.image_url || "/placeholder.svg?height=120&width=120"}" 
                   alt="${animal.name}" 
                   style="width: 120px; height: 120px; border-radius: 8px; object-fit: cover;" />
              <div>
                <h2 style="color: #5A4A42; margin: 0 0 8px 0;">${animal.name}</h2>
                <p style="color: #6B5B4F; margin: 0 0 4px 0;"><strong>Breed:</strong> ${animal.breed}</p>
                <p style="color: #6B5B4F; margin: 0 0 4px 0;"><strong>Age:</strong> ${animal.age} ${animal.age === 1 ? "year" : "years"} old</p>
                <p style="color: #6B5B4F; margin: 0;"><strong>In shelter since:</strong> ${new Date(animal.intake_date).toLocaleDateString()}</p>
              </div>
            </div>
            ${animalUrls[animal.id] ? `
            <div style="text-align: center;">
              <a href="${animalUrls[animal.id]}" style="display: inline-block; background-color: ${org?.primary_color || "#D76B1A"}; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Learn More About ${animal.name}
              </a>
            </div>
            ` : ''}
          </div>
        `,
          )
          .join("")}
        
        <div style="text-align: center; padding: 30px 0;">
          <a href="#" style="display: inline-block; background-color: ${org?.primary_color || "#D76B1A"}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Learn More About Fostering
          </a>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #F7E2BD; color: #6B5B4F; font-size: 12px;">
          <p>You're receiving this because you're a registered foster with ${org?.name || "our organization"}.</p>
        </div>
      </div>
    `
  }

  const handleSendNow = async () => {
    if (selectedAnimals.length === 0) {
      alert("Please select at least one animal to feature")
      return
    }

    if (!subject) {
      alert("Please enter a subject line")
      return
    }

    const confirmed = confirm(
      `Send newsletter to ${fosters.length} foster(s) featuring ${selectedAnimals.length} animal(s)?`
    )

    if (!confirmed) return

    setSending(true)

    try {
      // Build newsletter sections from selected animals
      const sections = selectedAnimalDetails.map(animal => ({
        id: animal.id,
        type: 'featured_animal' as const,
        title: animal.name,
        content: `
          <p><strong>Breed:</strong> ${animal.breed}</p>
          <p><strong>Age:</strong> ${animal.age} ${animal.age === 1 ? 'year' : 'years'} old</p>
          <p><strong>In shelter since:</strong> ${new Date(animal.intake_date).toLocaleDateString()}</p>
          ${intro ? `<p>${intro}</p>` : ''}
        `,
        image_url: animal.image_url || undefined,
        landing_url: animalUrls[animal.id] || undefined,
      }))

      const response = await fetch(`/api/admin/newsletters/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          subject,
          sections,
          recipientType: 'all_fosters'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✓ Newsletter sent successfully to ${data.stats.success} recipients!`)
        // Reset form
        setSubject("")
        setIntro("")
        setSelectedAnimals([])
        setAnimalUrls({})
      } else {
        alert(`Error: ${data.error || 'Failed to send newsletter'}`)
      }
    } catch (error) {
      console.error('[v0] Newsletter send error:', error)
      alert('Failed to send newsletter. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleScheduleSend = async () => {
    if (!scheduleDate || !scheduleTime) {
      alert("Please select both date and time")
      return
    }

    if (selectedAnimals.length === 0) {
      alert("Please select at least one animal to feature")
      return
    }

    if (!subject) {
      alert("Please enter a subject line")
      return
    }

    setSending(true)

    try {
      const scheduleFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

      // Build newsletter sections from selected animals
      const sections = selectedAnimalDetails.map(animal => ({
        id: animal.id,
        type: 'featured_animal' as const,
        title: animal.name,
        content: `
          <p><strong>Breed:</strong> ${animal.breed}</p>
          <p><strong>Age:</strong> ${animal.age} ${animal.age === 1 ? 'year' : 'years'} old</p>
          <p><strong>In shelter since:</strong> ${new Date(animal.intake_date).toLocaleDateString()}</p>
          ${intro ? `<p>${intro}</p>` : ''}
        `,
        image_url: animal.image_url || undefined,
        landing_url: animalUrls[animal.id] || undefined,
      }))

      const response = await fetch(`/api/admin/newsletters/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          subject,
          sections,
          scheduleFor,
          recipientType: 'all_fosters'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✓ Newsletter scheduled for ${new Date(scheduleFor).toLocaleString()}!`)
        setShowScheduleModal(false)
        setScheduleDate("")
        setScheduleTime("")
        // Reset form
        setSubject("")
        setIntro("")
        setSelectedAnimals([])
        setAnimalUrls({})
      } else {
        alert(`Error: ${data.error || 'Failed to schedule newsletter'}`)
      }
    } catch (error) {
      console.error('[v0] Newsletter schedule error:', error)
      alert('Failed to schedule newsletter. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleExportHTML = () => {
    const html = generateNewsletterHTML()
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `newsletter-${new Date().toISOString().split("T")[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#5A4A42]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#5A4A42] flex items-center gap-3">
          <Mail className="w-8 h-8 text-[#D76B1A]" />
          Build & Send Newsletter
        </h1>
        <p className="text-[#6B5B4F] mt-2">
          Create your newsletter by selecting animals and adding your message, then send or schedule below
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-[#F7E2BD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D76B1A]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#D76B1A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5A4A42]">{fosters.length}</p>
              <p className="text-xs text-[#6B5B4F]">Foster Recipients</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#F7E2BD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D76B1A]/10 flex items-center justify-center">
              <Dog className="w-5 h-5 text-[#D76B1A]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5A4A42]">{animals.filter((a) => !a.foster_id).length}</p>
              <p className="text-xs text-[#6B5B4F]">Need Fostering</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#F7E2BD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5A4A42]">{selectedAnimals.length}</p>
              <p className="text-xs text-[#6B5B4F]">Selected</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-[#F7E2BD]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#5A4A42]">0</p>
              <p className="text-xs text-[#6B5B4F]">Sent This Month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Animal Selection */}
        <div className="bg-white rounded-xl border border-[#F7E2BD] overflow-hidden">
          <div className="p-4 border-b border-[#F7E2BD] bg-[#FBF8F4]">
            <h2 className="font-semibold text-[#5A4A42] mb-3">Select Animals to Feature</h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B4F]" />
                <Input
                  placeholder="Search animals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllNeedingFoster}
                className="whitespace-nowrap bg-transparent"
              >
                Select All Needing Foster
              </Button>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
            {filteredAnimals.map((animal) => (
              <div
                key={animal.id}
                onClick={() => toggleAnimalSelection(animal.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                  selectedAnimals.includes(animal.id)
                    ? "bg-[#D76B1A]/10 border-[#D76B1A]"
                    : "bg-[#FBF8F4] border-transparent hover:border-[#F7E2BD]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedAnimals.includes(animal.id) ? "bg-[#D76B1A] border-[#D76B1A]" : "border-[#6B5B4F]/30"
                  }`}
                >
                  {selectedAnimals.includes(animal.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <img
                  src={animal.image_url || "/placeholder.svg?height=48&width=48&query=dog"}
                  alt={animal.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#5A4A42] truncate">{animal.name}</p>
                  <p className="text-sm text-[#6B5B4F] truncate">
                    {animal.breed} • {animal.age}y
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      animal.foster_id ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {animal.foster_id ? "In Foster" : "Needs Foster"}
                  </span>
                </div>
              </div>
            ))}

            {filteredAnimals.length === 0 && <div className="text-center py-8 text-[#6B5B4F]">No animals found</div>}
          </div>
        </div>

        {/* Right Column - Newsletter Content */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#F7E2BD] p-4">
            <h2 className="font-semibold text-[#5A4A42] mb-4">Newsletter Content</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-1">Subject Line</label>
                <Input
                  placeholder="e.g., Animals Need Your Help This Week!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-1">Introduction Message</label>
                <Textarea
                  placeholder="Write a personal message to your foster network..."
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="pt-2">
                <p className="text-sm text-[#6B5B4F] mb-2">
                  {selectedAnimals.length} animal(s) will be featured with their photo, name, breed, age, and intake
                  date.
                </p>
              </div>

              {/* Animal Landing Page URLs */}
              {selectedAnimalDetails.length > 0 && (
                <div className="pt-4 border-t border-[#F7E2BD]">
                  <label className="block text-sm font-medium text-[#5A4A42] mb-3">
                    Landing Page URLs (optional)
                  </label>
                  <p className="text-xs text-[#6B5B4F] mb-3">
                    Add links to your animal landing pages. A "Learn More" button will be included in the email for each animal.
                  </p>
                  <div className="space-y-3">
                    {selectedAnimalDetails.map((animal) => (
                      <div key={animal.id}>
                        <label className="block text-xs font-medium text-[#5A4A42] mb-1">
                          {animal.name} - Landing Page URL
                        </label>
                        <Input
                          type="url"
                          placeholder={`https://example.com/adopt/${animal.name.toLowerCase()}`}
                          value={animalUrls[animal.id] || ""}
                          onChange={(e) => setAnimalUrls(prev => ({ ...prev, [animal.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-[#F7E2BD] overflow-hidden">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FBF8F4] transition"
            >
              <span className="font-semibold text-[#5A4A42] flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview Newsletter
              </span>
              <ChevronRight
                className={`w-5 h-5 text-[#6B5B4F] transition-transform ${showPreview ? "rotate-90" : ""}`}
              />
            </button>

            {showPreview && (
              <div className="border-t border-[#F7E2BD] p-4 bg-gray-50">
                <div
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generateNewsletterHTML() }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Actions - Bottom of Page */}
      <div className="mt-8 bg-white rounded-xl border border-[#F7E2BD] p-6">
        <h3 className="font-semibold text-[#5A4A42] mb-4">Ready to Send?</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExportHTML}
            variant="outline"
            className="flex-1 bg-transparent"
            disabled={selectedAnimals.length === 0 || sending}
          >
            <FileText className="w-4 h-4 mr-2" />
            Export HTML
          </Button>
          <Button
            onClick={() => setShowScheduleModal(true)}
            variant="outline"
            className="flex-1 bg-transparent"
            disabled={selectedAnimals.length === 0 || !subject || sending}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Send
          </Button>
          <Button
            onClick={handleSendNow}
            className="flex-1 bg-[#D76B1A] hover:bg-[#C55A10]"
            disabled={selectedAnimals.length === 0 || !subject || sending}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Now to {fosters.length} Foster(s)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-[#5A4A42] mb-4">Schedule Newsletter</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-1">Date</label>
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-1">Time</label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    setShowScheduleModal(false)
                    setScheduleDate("")
                    setScheduleTime("")
                  }}
                  variant="outline"
                  className="flex-1 bg-transparent"
                  disabled={sending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleSend}
                  className="flex-1 bg-[#D76B1A] hover:bg-[#C55A10]"
                  disabled={!scheduleDate || !scheduleTime || sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Schedule"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CommunicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center">
          <div className="text-[#5A4A42]">Loading...</div>
        </div>
      }
    >
      <CommunicationsContent />
    </Suspense>
  )
}
