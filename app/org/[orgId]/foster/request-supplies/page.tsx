"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function RequestSuppliesPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.orgId as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dogId, setDogId] = useState<string>("")
  const [fetchingDogs, setFetchingDogs] = useState(true)
  const [formData, setFormData] = useState({
    itemName: "",
    quantity: "",
    urgency: "normal",
    notes: "",
  })

  useEffect(() => {
    const fetchDogAssignment = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push(`/org/${orgId}/foster/dashboard`)
          return
        }

        // Get foster's assigned dog
        const { data: dogs } = await supabase
          .from("dogs")
          .select("id")
          .eq("foster_id", user.id)
          .eq("organization_id", orgId)
          .limit(1)
          .single()

        if (dogs?.id) {
          setDogId(dogs.id)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch dog assignment:", error)
      } finally {
        setFetchingDogs(false)
      }
    }

    fetchDogAssignment()
  }, [orgId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dogId) {
      toast({
        title: "Error",
        description: "No dog assignment found. Please contact your rescue coordinator.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/foster/supply-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          dogId,
          itemName: formData.itemName,
          quantity: formData.quantity,
          urgency: formData.urgency,
          notes: formData.notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit request")
      }

      toast({
        title: "Request submitted",
        description: "Your supply request has been sent to the rescue team.",
      })

      router.push(`/org/${orgId}/foster/dashboard`)
    } catch (error) {
      console.error("[v0] Error:", error)
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingDogs) {
    return (
      <div className="min-h-screen bg-background-soft p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#D76B1A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5A4A42]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-soft p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href={`/org/${orgId}/foster/dashboard`}
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary-bark mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-primary-orange/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-orange" />
              </div>
              <div>
                <CardTitle className="text-2xl">Request Supplies</CardTitle>
                <CardDescription>Submit a request for supplies you need for your foster dog</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Dog food, Leash, Toys"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  placeholder="e.g., 1 bag, 2 items, 5 toys"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <select
                  id="urgency"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  required
                >
                  <option value="low">Low - Can wait a week or more</option>
                  <option value="normal">Normal - Needed within a few days</option>
                  <option value="high">High - Needed within 24 hours</option>
                  <option value="urgent">Urgent - Needed immediately</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional details about your request..."
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/org/${orgId}/foster/dashboard`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
