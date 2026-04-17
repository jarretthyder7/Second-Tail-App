'use client'

import { ProtectedRoute } from '@/lib/protected-route'
import { Header } from '@/components/header'
import { AdminNav } from '@/components/admin/admin-nav'
import { fetchAlertsForAdmin, fetchHelpRequests, mockDogs } from '@/lib/mock-data'
import { useState, useEffect } from 'react'
import type { Alert, HelpRequest } from '@/lib/mock-data'
import Link from 'next/link'

export default function AdminDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAlertsForAdmin(),
      fetchHelpRequests()
    ]).then(([alertsData, helpRequestsData]) => {
      setAlerts(alertsData)
      setHelpRequests(helpRequestsData.filter(hr => hr.status === 'open'))
      setLoading(false)
    })
  }, [])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-[#FBF8F4] text-[#2E2E2E]">
        <Header />
        <AdminNav />

        <main className="container mx-auto px-4 py-6 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#5A4A42] mb-2">Dashboard</h1>
            <p className="text-sm md:text-base text-[#2E2E2E]/70">
              Overview of rescue operations
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Needs Attention */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[#5A4A42]">Needs Attention</h2>

              {loading ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">Loading...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">Everything looks good!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <Link key={alert.id} href={`/admin/animals/${alert.dogId}`}>
                      <div className={`bg-white rounded-2xl shadow-sm p-4 border-l-4 hover:shadow-md transition-shadow cursor-pointer ${
                        alert.priority === 'high' ? 'border-[#D97A68]' : 
                        alert.priority === 'medium' ? 'border-[#D76B1A]' : 
                        'border-[#F7E2BD]'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-[#5A4A42]">{alert.dogName}</h3>
                            <p className="text-xs text-[#2E2E2E]/60 mt-0.5">
                              {new Date(alert.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                            alert.priority === 'high' ? 'bg-[#D97A68] text-white' :
                            alert.priority === 'medium' ? 'bg-[#D76B1A]/10 text-[#D76B1A]' :
                            'bg-[#F7E2BD] text-[#5A4A42]'
                          }`}>
                            {alert.type === 'rough-day' ? 'Rough Day' : 
                             alert.type === 'unanswered-message' ? 'Message' : 
                             'Help Request'}
                          </span>
                        </div>
                        <p className="text-sm text-[#2E2E2E] leading-relaxed">{alert.message}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Open Help Requests */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#5A4A42]">Open Help Requests</h2>
                <Link 
                  href="/admin/help-requests"
                  className="text-sm text-[#D76B1A] hover:text-[#D76B1A]/80 font-semibold"
                >
                  View all →
                </Link>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">Loading...</p>
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
                  <p className="text-[#2E2E2E]/60 text-sm">No open requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {helpRequests.slice(0, 5).map(request => {
                    const dog = mockDogs.find(d => d.id === request.dogId)
                    return (
                      <div key={request.id} className="bg-white rounded-2xl shadow-sm p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[#5A4A42]">{dog?.name || 'Unknown'}</h3>
                            <p className="text-xs text-[#2E2E2E]/60">
                              Foster: {dog?.fosterName || 'Unassigned'}
                            </p>
                          </div>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-[#F7E2BD] text-[#5A4A42] capitalize">
                            {request.type}
                          </span>
                        </div>
                        <p className="text-sm text-[#2E2E2E] leading-relaxed line-clamp-2">{request.description}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Dogs Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[#5A4A42]">Active Dogs</h2>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F7E2BD]/60 border-b border-[#F7E2BD]">
                    <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Dog</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden md:table-cell">Foster</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#5A4A42]">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#5A4A42] hidden lg:table-cell">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {mockDogs.map(dog => (
                    <tr key={dog.id} className="border-b border-[#F7E2BD]/40 hover:bg-[#FBF8F4] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/dogs/${dog.id}`} className="font-semibold text-[#5A4A42] hover:text-[#D76B1A]">
                          {dog.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#2E2E2E]/70 hidden md:table-cell">
                        {dog.fosterName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          dog.status === 'in-foster'
                            ? 'bg-[#E8EFE6] text-[#5A4A42]'
                            : dog.status === 'available'
                              ? 'bg-[#D76B1A]/10 text-[#D76B1A]'
                              : dog.status === 'medical-hold'
                                ? 'bg-[#D97A68] text-white'
                                : 'bg-[#F7E2BD] text-[#5A4A42]'
                        }`}>
                          {dog.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#2E2E2E]/60 text-xs hidden lg:table-cell">
                        {dog.lastUpdate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
