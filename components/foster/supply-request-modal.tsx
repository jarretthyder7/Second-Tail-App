"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { X, Loader2, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SupplyRequestModalProps {
  dog: any
  orgId: string
  onClose: () => void
}

const DEFAULT_SUPPLY_TYPES = ["Food", "Toys", "Bedding", "Medications", "Treats", "Other"]

export function SupplyRequestModal({ dog, orgId, onClose }: SupplyRequestModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [supplyTypes, setSupplyTypes] = useState<string[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [formData, setFormData] = useState({
    supplyType: "",
    itemName: "",
    quantity: "",
    urgency: "medium",
    notes: "",
  })

  useEffect(() => {
    async function fetchSupplyTypes() {
      try {
        const response = await fetch(`/api/admin/help-settings?orgId=${orgId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.allowed_supply_types && data.allowed_supply_types.length > 0) {
            setSupplyTypes(data.allowed_supply_types)
          } else {
            setSupplyTypes(DEFAULT_SUPPLY_TYPES)
          }
        } else {
          setSupplyTypes(DEFAULT_SUPPLY_TYPES)
        }
      } catch (error) {
        console.error("[v0] Error fetching supply types:", error)
        setSupplyTypes(DEFAULT_SUPPLY_TYPES)
      } finally {
        setLoadingTypes(false)
      }
    }
    fetchSupplyTypes()
  }, [orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/foster/supply-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          dogId: dog.id,
          itemName: formData.itemName,
          quantity: parseInt(formData.quantity) || 1,
          urgency: formData.urgency,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit request")
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Get org admin email to send notification
        const { data: orgAdmin, error: adminError } = await supabase
          .from("profiles")
          .select("email, name")
          .eq("organization_id", orgId)
          .eq("role", "rescue")
          .eq("org_role", "org_admin")
          .maybeSingle()

        if (!adminError && orgAdmin) {
          // Get current user (foster) details
          const { data: currentUser } = await supabase.from("profiles").select("name").eq("id", user.id).single()

          // Get org name
          const { data: org } = await supabase.from("organizations").select("name").eq("id", orgId).single()

          if (currentUser && org) {
            // Send email notification to org admin
            await fetch("/api/email/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "supply-request",
                orgEmail: orgAdmin.email,
                orgName: org.name,
                fosterName: currentUser.name,
                dogName: dog.name,
                itemName: formData.itemName,
                quantity: formData.quantity,
                urgency: formData.urgency,
              }),
            })
          }
        }
      }

      toast({
        title: "Request submitted",
        description: "Your supply request has been sent to the rescue team. They'll respond within 24 hours.",
      })

      onClose()
      router.refresh()
    } catch (error) {
      console.error("[v0] Error submitting supply request:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit your request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Request Supplies</h3>
              <p className="text-xs text-muted-foreground">For {dog.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Supply Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Supply Category *</label>
            <select
              value={formData.supplyType}
              onChange={(e) => setFormData({ ...formData, supplyType: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
              disabled={loadingTypes}
            >
              {loadingTypes ? (
                <option value="">Loading...</option>
              ) : (
                <>
                  <option value="">Select category...</option>
                  {supplyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Item Name *</label>
            <input
              type="text"
              placeholder="e.g., Dog food, bed, collar, etc."
              value={formData.itemName}
              onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          {/* Quantity & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Quantity</label>
              <input
                type="number"
                placeholder="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Urgency *</label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Additional Notes</label>
            <textarea
              placeholder="Any additional details about your request..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Submitting..." : "Submit Request"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 font-semibold text-foreground hover:bg-secondary transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
