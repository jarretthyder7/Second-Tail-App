"use client"

import { useState, useEffect } from "react"

interface CarePlan {
  medications?: Array<{
    name: string
    schedule: string
    instructions?: string
  }>
  feeding_schedule?: string
  vet_clinic?: string
  vet_phone?: string
  next_vet_visit?: string
  special_instructions?: string
  behavior_notes?: string
}

interface CarePlanPanelProps {
  dogId: string
  viewerRole: "admin" | "foster"
  onUpdate?: (carePlan: CarePlan) => Promise<void>
}

export function CarePlanPanel({ dogId, viewerRole, onUpdate }: CarePlanPanelProps) {
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedPlan, setEditedPlan] = useState<CarePlan | null>(null)

  // TODO: Replace with actual Supabase query
  useEffect(() => {
    // Mock data fetch
    setCarePlan(null)
    setLoading(false)
  }, [dogId])

  const handleSave = async () => {
    if (!editedPlan || !onUpdate) return
    await onUpdate(editedPlan)
    setCarePlan(editedPlan)
    setEditing(false)
  }

  const addMedication = () => {
    setEditedPlan({
      ...editedPlan,
      medications: [...(editedPlan?.medications || []), { name: "", schedule: "", instructions: "" }],
    })
  }

  const removeMedication = (index: number) => {
    const newMeds = editedPlan?.medications?.filter((_, i) => i !== index)
    setEditedPlan({ ...editedPlan, medications: newMeds })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-[#2E2E2E]/60 text-sm">Loading care plan...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-[#5A4A42]">Care Plan</h4>
        {viewerRole === "admin" && !editing && (
          <button
            onClick={() => {
              setEditing(true)
              setEditedPlan(carePlan || {})
            }}
            className="text-sm font-semibold text-[#D76B1A] hover:text-[#C25E15]"
          >
            Edit
          </button>
        )}
      </div>

      {editing && viewerRole === "admin" ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Medications */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">Medications</label>
            <div className="space-y-3">
              {editedPlan?.medications?.map((med, index) => (
                <div key={index} className="border border-[#F7E2BD] rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => {
                          const newMeds = [...(editedPlan.medications || [])]
                          newMeds[index] = { ...newMeds[index], name: e.target.value }
                          setEditedPlan({ ...editedPlan, medications: newMeds })
                        }}
                        placeholder="Medication name"
                        className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                      />
                      <input
                        type="text"
                        value={med.schedule}
                        onChange={(e) => {
                          const newMeds = [...(editedPlan.medications || [])]
                          newMeds[index] = { ...newMeds[index], schedule: e.target.value }
                          setEditedPlan({ ...editedPlan, medications: newMeds })
                        }}
                        placeholder="Schedule (e.g., Twice daily with food)"
                        className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                      />
                      <input
                        type="text"
                        value={med.instructions || ""}
                        onChange={(e) => {
                          const newMeds = [...(editedPlan.medications || [])]
                          newMeds[index] = { ...newMeds[index], instructions: e.target.value }
                          setEditedPlan({ ...editedPlan, medications: newMeds })
                        }}
                        placeholder="Special instructions (optional)"
                        className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                      />
                    </div>
                    <button
                      onClick={() => removeMedication(index)}
                      className="text-[#D97A68] hover:text-[#D97A68]/80 text-sm font-semibold mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addMedication} className="text-sm font-semibold text-[#D76B1A] hover:text-[#C25E15]">
                + Add Medication
              </button>
            </div>
          </div>

          {/* Feeding Schedule */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">Feeding Instructions</label>
            <textarea
              value={editedPlan?.feeding_schedule || ""}
              onChange={(e) => setEditedPlan({ ...editedPlan, feeding_schedule: e.target.value })}
              placeholder="Describe feeding schedule and dietary requirements"
              className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[80px]"
            />
          </div>

          {/* Vet Information */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">Vet Information</label>
            <div className="space-y-2">
              <input
                type="text"
                value={editedPlan?.vet_clinic || ""}
                onChange={(e) => setEditedPlan({ ...editedPlan, vet_clinic: e.target.value })}
                placeholder="Clinic name"
                className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
              />
              <input
                type="text"
                value={editedPlan?.vet_phone || ""}
                onChange={(e) => setEditedPlan({ ...editedPlan, vet_phone: e.target.value })}
                placeholder="Phone number"
                className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
              />
              <input
                type="text"
                value={editedPlan?.next_vet_visit || ""}
                onChange={(e) => setEditedPlan({ ...editedPlan, next_vet_visit: e.target.value })}
                placeholder="Next visit date (e.g., March 15, 2024)"
                className="w-full rounded-lg border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-[#5A4A42] mb-2">Special Instructions</label>
            <textarea
              value={editedPlan?.special_instructions || ""}
              onChange={(e) => setEditedPlan({ ...editedPlan, special_instructions: e.target.value })}
              placeholder="Any special care instructions or requirements"
              className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 resize-none min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C25E15] transition"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditing(false)
                setEditedPlan(null)
              }}
              className="inline-flex items-center justify-center rounded-xl border border-[#5A4A42] bg-white px-4 py-2 text-sm font-semibold text-[#5A4A42] hover:bg-[#F7E2BD]/40 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {!carePlan || Object.keys(carePlan).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#2E2E2E]/60 text-sm mb-2">No care plan configured yet</p>
              {viewerRole === "admin" && (
                <button
                  onClick={() => {
                    setEditing(true)
                    setEditedPlan({})
                  }}
                  className="text-sm font-semibold text-[#D76B1A] hover:text-[#C25E15]"
                >
                  Create Care Plan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {carePlan.medications && carePlan.medications.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-[#5A4A42] mb-2">💊 Medications</h5>
                  <ul className="space-y-2">
                    {carePlan.medications.map((med, i) => (
                      <li key={i} className="bg-[#F7E2BD]/40 rounded-lg p-3">
                        <span className="font-semibold text-[#5A4A42] text-sm">{med.name}</span>
                        <p className="text-sm text-[#2E2E2E]/70">{med.schedule}</p>
                        {med.instructions && <p className="text-xs text-[#2E2E2E]/60 mt-1">{med.instructions}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {carePlan.feeding_schedule && (
                <div>
                  <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">🍖 Feeding</h5>
                  <p className="text-sm text-[#2E2E2E]/70">{carePlan.feeding_schedule}</p>
                </div>
              )}

              {(carePlan.vet_clinic || carePlan.vet_phone || carePlan.next_vet_visit) && (
                <div>
                  <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">🏥 Vet Information</h5>
                  {carePlan.vet_clinic && <p className="text-sm text-[#2E2E2E]/70">{carePlan.vet_clinic}</p>}
                  {carePlan.vet_phone && <p className="text-xs text-[#2E2E2E]/60">{carePlan.vet_phone}</p>}
                  {carePlan.next_vet_visit && (
                    <p className="text-xs text-[#2E2E2E]/60 mt-1">Next visit: {carePlan.next_vet_visit}</p>
                  )}
                </div>
              )}

              {carePlan.special_instructions && (
                <div>
                  <h5 className="text-sm font-semibold text-[#5A4A42] mb-1">📋 Special Instructions</h5>
                  <p className="text-sm text-[#2E2E2E]/70">{carePlan.special_instructions}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
