"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Mail, Send, FileText, Users, Dog, Plus, Search, Check, ChevronRight, Clock, Eye } from "lucide-react"
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

function CommunicationsContent() {
  const params = useParams()
  const orgId = params.orgId as string

  const [activeTab, setActiveTab] = useState<"create" | "history">("create")
  const [animals, setAnimals] = useState<Animal[]>([])
  const [fosters, setFosters] = useState<Foster[]>([])
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  // Newsletter content state
  const [subject, setSubject] = useState("")
  const [intro, setIntro] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Load animals that need fostering (not currently fostered)
      const { data: animalsData } = await supabase
        .from("dogs")
        .select("*")
        .eq("organization_id", orgId)
        .order("intake_date", { ascending: true })

      if (animalsData) {
        setAnimals(animalsData)
      }

      // Also get foster profiles for names
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
          <h1 style="color: #5A4A42; margin: 0;">Animals Need Your Help!</h1>
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
            <div style="display: flex; gap: 16px;">
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
          </div>
        `,
          )
          .join("")}
        
        <div style="text-align: center; padding: 30px 0;">
          <a href="#" style="display: inline-block; background-color: #D76B1A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Learn More About Fostering
          </a>
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #F7E2BD; color: #6B5B4F; font-size: 12px;">
          <p>You're receiving this because you're a registered foster with our organization.</p>
        </div>
      </div>
    `
  }

  const handleSendNewsletter = async () => {
    if (selectedAnimals.length === 0) {
      alert("Please select at least one animal to feature")
      return
    }

    if (!subject) {
      alert("Please enter a subject line")
      return
    }

    alert(
      `Newsletter would be sent to ${fosters.length} foster(s) featuring ${selectedAnimals.length} animal(s).\n\nThis feature will be completed in Phase 4.`,
    )
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
          Communications
        </h1>
        <p className="text-[#6B5B4F] mt-2">
          Create and send newsletters to your foster network about animals needing homes
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "create"
              ? "bg-[#D76B1A] text-white"
              : "bg-white text-[#5A4A42] border border-[#F7E2BD] hover:bg-[#FBF8F4]"
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create Newsletter
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === "history"
              ? "bg-[#D76B1A] text-white"
              : "bg-white text-[#5A4A42] border border-[#F7E2BD] hover:bg-[#FBF8F4]"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          History
        </button>
      </div>

      {activeTab === "create" ? (
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

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleExportHTML}
                variant="outline"
                className="flex-1 bg-transparent"
                disabled={selectedAnimals.length === 0}
              >
                <FileText className="w-4 h-4 mr-2" />
                Export HTML
              </Button>
              <Button
                onClick={handleSendNewsletter}
                className="flex-1 bg-[#D76B1A] hover:bg-[#C55A10]"
                disabled={selectedAnimals.length === 0 || !subject}
              >
                <Send className="w-4 h-4 mr-2" />
                Send to {fosters.length} Foster(s)
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="bg-white rounded-xl border border-[#F7E2BD] p-8 text-center">
          <Clock className="w-12 h-12 text-[#6B5B4F]/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#5A4A42] mb-2">No newsletters sent yet</h3>
          <p className="text-[#6B5B4F] mb-4">When you send newsletters, they'll appear here for reference.</p>
          <Button onClick={() => setActiveTab("create")} className="bg-[#D76B1A] hover:bg-[#C55A10]">
            Create Your First Newsletter
          </Button>
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
