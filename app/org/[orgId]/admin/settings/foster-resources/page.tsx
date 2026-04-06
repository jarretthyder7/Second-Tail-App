"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Plus, ExternalLink, Trash2, Edit2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function FosterResourcesPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const [resources, setResources] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingResource, setEditingResource] = useState<any>(null)
  const [newResource, setNewResource] = useState({ title: "", url: "", description: "" })

  useEffect(() => {
    fetchResources()
  }, [orgId])

  const fetchResources = async () => {
    const supabase = createClient()

    const { data: orgData } = await supabase.from("organizations").select("branding").eq("id", orgId).single()

    if (orgData?.branding?.foster_resources) {
      setResources(orgData.branding.foster_resources)
    }

    setIsLoading(false)
  }

  const saveResources = async (updatedResources: any[]) => {
    const supabase = createClient()

    const { data: orgData } = await supabase.from("organizations").select("branding").eq("id", orgId).single()

    const { error } = await supabase
      .from("organizations")
      .update({
        branding: {
          ...orgData?.branding,
          foster_resources: updatedResources,
        },
      })
      .eq("id", orgId)

    if (!error) {
      setResources(updatedResources)
    }
  }

  const handleAddResource = () => {
    const updatedResources = [...resources, newResource]
    saveResources(updatedResources)
    setNewResource({ title: "", url: "", description: "" })
    setShowAddModal(false)
  }

  const handleDeleteResource = (index: number) => {
    const updatedResources = resources.filter((_, i) => i !== index)
    saveResources(updatedResources)
  }

  const handleUpdateResource = () => {
    if (editingResource !== null) {
      const updatedResources = resources.map((res, i) => (i === editingResource.index ? newResource : res))
      saveResources(updatedResources)
      setEditingResource(null)
      setNewResource({ title: "", url: "", description: "" })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-orange border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/org/${orgId}/admin/settings`} className="p-2 hover:bg-muted rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Foster Resources</h1>
              <p className="text-muted-foreground mt-1">Add helpful links and resources for your foster families</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowAddModal(true)
              setEditingResource(null)
              setNewResource({ title: "", url: "", description: "" })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-orange text-white rounded-lg hover:bg-primary-orange/90 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </button>
        </div>

        {resources.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center space-y-4 border">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <ExternalLink className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No resources yet</h3>
              <p className="text-muted-foreground text-sm">
                Add helpful links and resources that your foster families can access from their Learn page
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{resource.title}</h3>
                      <ExternalLink className="w-4 h-4 text-primary-orange" />
                    </div>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-orange hover:underline block"
                    >
                      {resource.url}
                    </a>
                    {resource.description && <p className="text-sm text-muted-foreground">{resource.description}</p>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingResource({ ...resource, index })
                        setNewResource(resource)
                        setShowAddModal(true)
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this resource?")) {
                          handleDeleteResource(index)
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl p-6 max-w-lg w-full space-y-6 border">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingResource ? "Edit Resource" : "Add Resource"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Add helpful links, guides, or documents for your foster families
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    placeholder="e.g., Training Guide PDF"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={newResource.url}
                    onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description (optional)</label>
                  <textarea
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    placeholder="Brief description of this resource..."
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-primary-orange"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingResource(null)
                    setNewResource({ title: "", url: "", description: "" })
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={editingResource ? handleUpdateResource : handleAddResource}
                  disabled={!newResource.title || !newResource.url}
                  className="flex-1 px-4 py-2 bg-primary-orange text-white rounded-lg hover:bg-primary-orange/90 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingResource ? "Update" : "Add"} Resource
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
