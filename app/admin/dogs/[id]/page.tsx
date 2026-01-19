'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { Header } from '@/components/header'
import { AdminNav } from '@/components/admin/admin-nav'
import { getDogById, getLogsForDog, getMessagesForDog, fetchCarePlanForDog } from '@/lib/mock-data'
import { AdminDogTabs } from '@/components/admin/admin-dog-tabs'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { CarePlan } from '@/lib/mock-data'

export default function AdminDogProfilePage() {
  const params = useParams()
  const dogId = params.id as string

  const dog = getDogById(dogId)
  const logs = dog ? getLogsForDog(dog.id) : []
  const messages = dog ? getMessagesForDog(dog.id) : []
  
  const [carePlan, setCarePlan] = useState<CarePlan | null>(null)

  useEffect(() => {
    if (dog) {
      fetchCarePlanForDog(dog.id).then(setCarePlan)
    }
  }, [dog])

  if (!dog) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen bg-[#FBF8F4]">
          <Header />
          <AdminNav />
          <main className="container mx-auto px-4 py-6">
            <p className="text-[#2E2E2E]/60">Dog not found</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  const statusClass =
    dog.status === 'in-foster'
      ? 'bg-[#E8EFE6] text-[#5A4A42]'
      : dog.status === 'available'
        ? 'bg-[#D76B1A]/10 text-[#D76B1A]'
        : dog.status === 'medical-hold'
          ? 'bg-[#D97A68] text-white'
          : 'bg-[#F7E2BD] text-[#5A4A42]'

  const statusLabel = dog.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#FBF8F4]">
        <Header />
        <AdminNav />

        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="aspect-square bg-[#F7E2BD] overflow-hidden">
                  <img
                    src={dog.photo || "/placeholder.svg?height=280&width=280&query=happy+dog"}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-[#5A4A42]">{dog.name}</h2>
                    <p className="text-sm text-[#2E2E2E]/70">{dog.breed}</p>
                  </div>

                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                    {statusLabel}
                  </span>

                  {dog.tags && dog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dog.tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#F7E2BD] text-[#5A4A42]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#5A4A42]">Intake Information</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-[#2E2E2E]">
                    <span className="font-semibold">Intake Date:</span>{' '}
                    {dog.intakeDate ? new Date(dog.intakeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </p>
                  <p className="text-[#2E2E2E]">
                    <span className="font-semibold">Age:</span> {dog.age || 'Unknown'}
                  </p>
                  <p className="text-[#2E2E2E]">
                    <span className="font-semibold">Weight:</span> {dog.weight || 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="bg-[#F7E2BD] rounded-2xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-[#5A4A42]">Assigned Foster</h4>
                <div className="text-sm">
                  <p className="font-semibold text-[#5A4A42]">{dog.fosterName || 'Unassigned'}</p>
                  {dog.fosterName && (
                    <p className="text-xs text-[#5A4A42]/70 mt-1">Contact via Messages tab</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <AdminDogTabs dog={dog} logs={logs} messages={messages} carePlan={carePlan} />
            </div>
          </div>

          <div className="mt-8">
            <Link href="/admin/dogs">
              <button className="inline-flex items-center justify-center rounded-xl border border-[#5A4A42] px-4 py-2 text-sm font-semibold text-[#5A4A42] hover:bg-[#F7E2BD]/60 transition">
                ← Back to Dogs
              </button>
            </Link>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
