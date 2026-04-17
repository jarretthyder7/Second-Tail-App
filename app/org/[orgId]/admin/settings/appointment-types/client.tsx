"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AppointmentType {
  id: string
  name: string
  color: string
  organization_id: string
  is_default: boolean
}

export default function AppointmentTypesSettings() {
  const { orgId } = useParams()
  const [types, setTypes] = useState<AppointmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", color: "#3B82F6" })
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", color: "#3B82F6" })

  const supabase = createClient()

  useEffect(() => {
    fetchTypes()
  }, [orgId])

  const fetchTypes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("appointment_types")
      .select("*")
      .eq("organization_id", orgId)
      .order("name")

    if (error) {
      console.error("Error fetching appointment types:", error)
    } else {
      setTypes(data || [])
    }
    setLoading(false)
  }

  const handleAdd = async () => {
    if (!newForm.name.trim()) return

    const { error } = await supabase.from("appointment_types").insert({
      name: newForm.name,
      color: newForm.color,
      organization_id: orgId,
      is_default: false,
    })

    if (error) {
      console.error("Error adding appointment type:", error)
    } else {
      setNewForm({ name: "", color: "#3B82F6" })
      setIsAddingNew(false)
      fetchTypes()
    }
  }

  const handleEdit = (type: AppointmentType) => {
    setEditingId(type.id)
    setEditForm({ name: type.name, color: type.color })
  }

  const handleSave = async (id: string) => {
    const { error } = await supabase
      .from("appointment_types")
      .update({
        name: editForm.name,
        color: editForm.color,
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating appointment type:", error)
    } else {
      setEditingId(null)
      fetchTypes()
    }
  }

  const handleDelete = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      alert("Cannot delete default appointment types")
      return
    }

    if (!confirm("Are you sure you want to delete this appointment type?")) return

    const { error } = await supabase.from("appointment_types").delete().eq("id", id)

    if (error) {
      console.error("Error deleting appointment type:", error)
    } else {
      fetchTypes()
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2E2E2E] mb-2">Appointment Types</h1>
        <p className="text-[#5A4A42]">Manage appointment types and their calendar colors</p>
      </div>

      <Card>
        <CardHeader className="border-b border-[#F7E2BD]">
          <div className="flex items-center justify-between">
            <CardTitle>Appointment Type Legend</CardTitle>
            <Button onClick={() => setIsAddingNew(true)} size="sm" className="bg-[#D76B1A] hover:bg-[#D76B1A]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Type
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {/* Add New Form */}
            {isAddingNew && (
              <div className="bg-[#F7E2BD]/30 p-4 rounded-lg border border-[#F7E2BD]">
                <div className="grid grid-cols-[1fr_120px_100px] gap-3 items-end">
                  <div>
                    <Label>Type Name</Label>
                    <Input
                      value={newForm.name}
                      onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                      placeholder="e.g., Vet Visit"
                    />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <input
                      type="color"
                      value={newForm.color}
                      onChange={(e) => setNewForm({ ...newForm, color: e.target.value })}
                      className="w-full h-10 rounded-md border border-input cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAdd} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => setIsAddingNew(false)} size="sm" variant="outline">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Types */}
            {types.map((type) => (
              <div
                key={type.id}
                className="grid grid-cols-[1fr_120px_100px] gap-3 items-center p-3 rounded-lg border border-[#F7E2BD] hover:bg-[#F7E2BD]/20"
              >
                {editingId === type.id ? (
                  <>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-full h-10 rounded-md border border-input cursor-pointer"
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => handleSave(type.id)} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded" style={{ backgroundColor: type.color }} />
                      <span className="font-medium text-[#2E2E2E]">{type.name}</span>
                      {type.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                    <div className="text-xs text-[#5A4A42] font-mono">{type.color}</div>
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => handleEdit(type)} size="sm" variant="outline">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(type.id, type.is_default)}
                        size="sm"
                        variant="outline"
                        disabled={type.is_default}
                        className={
                          type.is_default ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 hover:text-red-600"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {types.length === 0 && !isAddingNew && (
              <div className="text-center py-8 text-[#5A4A42]">
                <p>No appointment types configured yet.</p>
                <p className="text-sm">Click "Add Type" to create your first one.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
