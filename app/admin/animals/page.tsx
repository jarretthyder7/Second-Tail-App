'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { Header } from '@/components/header'
import { AdminNav } from '@/components/admin/admin-nav'
import { fetchDogsForAdmin } from '@/lib/mock-data'
import { useState, useEffect } from 'react'
import type { Dog } from '@/lib/mock-data'
import Link from 'next/link'

export default function AdminDogsPage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-foster' | 'available' | 'on-hold' | 'adopted' | 'medical-hold'>('all')
  const [fosterFilter, setFosterFilter] = useState('all')

  useEffect(() => {
    fetchDogsForAdmin().then(data => {
      setDogs(data)
      setLoading(false)
    })
  }, [])

  const filteredDogs = dogs.filter(dog => {
    const statusMatch = statusFilter === 'all' || dog.status === statusFilter
    const fosterMatch = fosterFilter === 'all' || dog.fosterName === fosterFilter
    return statusMatch && fosterMatch
  })

  const uniqueFosters = Array.from(new Set(dogs.map(d => d.fosterName).filter(Boolean)))

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#FBF8F4]">
        <Header />
        <AdminNav />

        <main className="container mx-auto px-4 py-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#5A4A42] mb-2">All Dogs</h1>
              <p className="text-sm text-[#2E2E2E]/70">Manage all dogs in the rescue</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#5A4A42] mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="in-foster">In Foster</option>
                    <option value="available">Available</option>
                    <option value="on-hold">On Hold</option>
                    <option value="medical-hold">Medical Hold</option>
                    <option value="adopted">Adopted</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-[#5A4A42] mb-1">Foster</label>
                  <select
                    value={fosterFilter}
                    onChange={(e) => setFosterFilter(e.target.value)}
                    className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40"
                  >
                    <option value="all">All Fosters</option>
                    {uniqueFosters.map(foster => (
                      <option key={foster} value={foster}>{foster}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">Loading dogs...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F7E2BD]/60 border-b border-[#F7E2BD]">
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Dog Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden md:table-cell">Assigned Foster</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden lg:table-cell">Intake Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden xl:table-cell">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDogs.map(dog => (
                        <tr key={dog.id} className="border-b border-[#F7E2BD]/40 hover:bg-[#FBF8F4] transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/admin/animals/${dog.id}`} className="font-semibold text-[#5A4A42] hover:text-[#D76B1A] flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#F7E2BD] overflow-hidden flex-shrink-0">
                                <img src={dog.photo || "/placeholder.svg"} alt={dog.name} className="w-full h-full object-cover" />
                              </div>
                              {dog.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-[#2E2E2E]/70 hidden md:table-cell">
                            {dog.fosterName || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              dog.status === 'in-foster' ? 'bg-[#E8EFE6] text-[#5A4A42]' :
                              dog.status === 'available' ? 'bg-[#D76B1A]/10 text-[#D76B1A]' :
                              dog.status === 'medical-hold' ? 'bg-[#D97A68] text-white' :
                              'bg-[#F7E2BD] text-[#5A4A42]'
                            }`}>
                              {dog.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#2E2E2E]/60 text-xs hidden lg:table-cell">
                            {dog.intakeDate ? new Date(dog.intakeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-[#2E2E2E]/60 text-xs hidden xl:table-cell">
                            {dog.lastUpdate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {filteredDogs.length === 0 && !loading && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <p className="text-[#2E2E2E]/60 text-sm">No dogs match the selected filters</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
