"use client"

import { ProtectedRoute } from "@/lib/protected-route"
import { Header } from "@/components/header"
import { getCurrentUser } from "@/lib/auth"
import { getFosterOrganizations, getOrganization } from "@/lib/mock-data"
import { useRouter } from "next/navigation"

export default function SelectOrganizationPage() {
  const router = useRouter()
  const user = getCurrentUser()

  const memberships = user ? getFosterOrganizations(user.id) : []

  const handleSelectOrg = (orgId: string) => {
    router.push(`/org/${orgId}/foster/dashboard`)
  }

  return (
    <ProtectedRoute allowedRoles={["foster"]}>
      <div className="min-h-screen bg-[#FBF8F4] text-[#2E2E2E]">
        <Header />

        <main className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#5A4A42] mb-3">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-base sm:text-lg text-[#2E2E2E]/70">Select an organization to continue</p>
          </div>

          <div className="space-y-4">
            {memberships.map((membership) => {
              const org = getOrganization(membership.orgId)
              if (!org) return null

              return (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  className="w-full bg-white rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-md transition text-left group"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#D76B1A]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D76B1A]/20 transition">
                      <svg
                        className="w-6 h-6 sm:w-8 sm:h-8 text-[#D76B1A]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-[#5A4A42] mb-1 group-hover:text-[#D76B1A] transition">
                        {org.name}
                      </h3>

                      {org.address && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#2E2E2E]/70 mb-2">
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">{org.address}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#2E2E2E]/70">
                        {org.contactPhone && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <span>{org.contactPhone}</span>
                          </div>
                        )}

                        {org.contactEmail && (
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="truncate">{org.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-[#5A4A42] group-hover:text-[#D76B1A] transition flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              )
            })}
          </div>

          {memberships.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-12 text-center">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-[#2E2E2E]/20 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-sm sm:text-base text-[#2E2E2E]/70">You're not connected to any organizations yet.</p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
