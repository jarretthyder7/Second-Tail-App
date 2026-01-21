"use client"

import type React from "react"
import { UploadCloud } from "lucide-react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/lib/protected-route"
import { getDogs, createDog } from "@/lib/supabase/queries"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Dog = {
  id: string
  name: string
  breed: string
  species?: string
  age?: string
  gender?: string
  weight?: string
  image_url?: string
  intakeDate?: string
  stage: string
  medicalNotes?: string
  foster_id?: string
  org_id: string
  created_at: string
  updated_at: string
}

export default function OrgDogsPage() {
  return (
    <ProtectedRoute allowedRoles={["rescue"]}>
      <OrgDogsContent />
    </ProtectedRoute>
  )
}

function OrgDogsContent() {
  const params = useParams()
  const orgId = params.orgId as string
  const [dogs, setDogs] = useState<Dog[]>([])
  const [filteredDogs, setFilteredDogs] = useState<Dog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [speciesFilter, setSpeciesFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  useEffect(() => {
    async function loadDogs() {
      const data = await getDogs(orgId)
      console.log("[v0] Loaded animals with species data:", data?.map(d => ({ name: d.name, species: d.species })))
      setDogs(data || [])
      setFilteredDogs(data || [])
    }
    loadDogs()
  }, [orgId])

  useEffect(() => {
    let filtered = dogs

    if (searchQuery) {
      filtered = filtered.filter(
        (dog) =>
          dog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          dog.breed.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((dog) => dog.stage === statusFilter)
    }

    if (speciesFilter !== "all") {
      filtered = filtered.filter((dog) => dog.species?.toLowerCase() === speciesFilter.toLowerCase())
    }

    setFilteredDogs(filtered)
  }, [searchQuery, statusFilter, speciesFilter, dogs])

  const handleAddDog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    let imageUrl: string | undefined
    if (photoFile) {
      try {
        setIsUploadingPhoto(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", photoFile)
        uploadFormData.append("dogId", "temp-" + Date.now())

        const uploadResponse = await fetch("/api/upload/dog-image", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image")
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      } catch (error) {
        console.error("Error uploading photo:", error)
        alert("Failed to upload photo. Please try again.")
        setIsSubmitting(false)
        setIsUploadingPhoto(false)
        return
      }
    }

    const newDogData = {
      name: formData.get("name") as string,
      breed: formData.get("breed") as string,
      species: formData.get("species") as string,
      age: formData.get("age") as string,
      gender: formData.get("gender") as string,
      weight: formData.get("weight") as string,
      stage: formData.get("stage") as string,
      image: imageUrl || undefined,
      medicalNotes: (formData.get("notes") as string) || undefined,
      intakeDate: new Date().toISOString().split("T")[0],
    }

    try {
      const createdDog = await createDog(orgId, newDogData)
      if (createdDog) {
        setDogs([createdDog, ...dogs])
        setIsAddDialogOpen(false)
        setPhotoPreview(null)
        setPhotoFile(null)
        alert("Animal added successfully!")
      }
    } catch (error) {
      console.error("Error creating animal:", error)
      alert("Failed to add animal. Please try again.")
    } finally {
      setIsSubmitting(false)
      setIsUploadingPhoto(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB")
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5A4A42] mb-1">Animals</h1>
          <p className="text-sm text-[#2E2E2E]/70">Manage all animals in your organization</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D76B1A] hover:bg-[#D76B1A]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Animal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#5A4A42]">Add New Animal</DialogTitle>
              <DialogDescription className="text-[#2E2E2E]/70">
                Add a new animal to your organization's system
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddDog} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Species <span className="text-[#D97A68]">*</span>
                  </label>
                  <select
                    name="species"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Name <span className="text-[#D97A68]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    placeholder="Enter animal's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Breed/Type <span className="text-[#D97A68]">*</span>
                  </label>
                  <input
                    type="text"
                    name="breed"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    placeholder="Enter breed or type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Age</label>
                  <input
                    type="text"
                    name="age"
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    placeholder="e.g., 2 years"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Gender</label>
                  <select
                    name="gender"
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">Weight</label>
                  <input
                    type="text"
                    name="weight"
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                    placeholder="e.g., 55 lbs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5A4A42] mb-2">
                    Stage <span className="text-[#D97A68]">*</span>
                  </label>
                  <select
                    name="stage"
                    required
                    className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="available">Available</option>
                    <option value="in_foster">In Foster</option>
                    <option value="medical_hold">Medical Hold</option>
                    <option value="on_hold">On Hold</option>
                    <option value="adopted">Adopted</option>
                    <option value="intake">Intake</option>
                    <option value="evaluation">Evaluation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Photo</label>
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-32 px-4 py-6 border-2 border-dashed border-[#F7E2BD] rounded-xl cursor-pointer hover:border-[#D76B1A] transition">
                    <div className="flex flex-col items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-[#D76B1A] mb-2" />
                      <span className="text-sm font-medium text-[#5A4A42]">Click to upload photo</span>
                      <span className="text-xs text-[#2E2E2E]/60">PNG, JPG, GIF up to 5MB</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5A4A42] mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  placeholder="Any additional notes about the animal"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setPhotoPreview(null)
                    setPhotoFile(null)
                  }}
                  className="border-[#F7E2BD] text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhoto}
                  className="bg-[#D76B1A] hover:bg-[#D76B1A]/90 text-white"
                >
                  {isSubmitting || isUploadingPhoto ? "Uploading..." : "Add Animal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#2E2E2E]/40" />
            <input
              type="text"
              placeholder="Search by name or breed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
            />
          </div>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          >
            <option value="all">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="rabbit">Rabbits</option>
            <option value="bird">Birds</option>
            <option value="other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[#F7E2BD] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
          >
            <option value="all">All Stages</option>
            <option value="in_foster">In Foster</option>
            <option value="available">Available</option>
            <option value="medical_hold">Medical Hold</option>
            <option value="adopted">Adopted</option>
            <option value="intake">Intake</option>
            <option value="evaluation">Evaluation</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FBF8F4]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#5A4A42]">Animal</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#5A4A42]">Species</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#5A4A42]">Breed</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#5A4A42]">Stage</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#5A4A42]">Foster</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#5A4A42]">Last Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredDogs.map((dog) => (
                <tr
                  key={dog.id}
                  className="border-t border-[#F7E2BD]/50 hover:bg-[#FBF8F4]/50 cursor-pointer transition"
                >
                  <td className="py-3 px-4">
                    <Link href={`/org/${orgId}/admin/animals/${dog.id}`} className="flex items-center gap-3">
                      <img
                        src={dog.image_url || "/placeholder.svg?height=40&width=40&query=dog"}
                        alt={dog.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-[#5A4A42]">{dog.name}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/org/${orgId}/admin/animals/${dog.id}`}
                      className="text-sm text-[#2E2E2E]/70 block capitalize"
                    >
                      {dog.species || "Unknown"}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/org/${orgId}/admin/animals/${dog.id}`} className="text-sm text-[#2E2E2E]/70 block">
                      {dog.breed}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/org/${orgId}/admin/animals/${dog.id}`} className="block">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          dog.stage === "in_foster"
                            ? "bg-[#8FAF99]/10 text-[#8FAF99]"
                            : dog.stage === "available"
                              ? "bg-[#D76B1A]/10 text-[#D76B1A]"
                              : dog.stage === "medical_hold"
                                ? "bg-[#D97A68]/10 text-[#D97A68]"
                                : "bg-[#5A4A42]/10 text-[#5A4A42]"
                        }`}
                      >
                        {dog.stage?.replace("_", " ") || "Unknown"}
                      </span>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/org/${orgId}/admin/animals/${dog.id}`} className="text-sm text-[#2E2E2E]/70 block">
                      {dog.foster_id ? "Assigned" : "-"}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/org/${orgId}/admin/animals/${dog.id}`} className="text-sm text-[#2E2E2E]/70 block">
                      {new Date(dog.updated_at).toLocaleDateString()}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredDogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#2E2E2E]/60">No animals found</p>
        </div>
      )}
    </div>
  )
}
