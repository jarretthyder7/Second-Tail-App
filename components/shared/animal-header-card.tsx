"use client"

import { useState } from "react"

interface DogHeaderCardProps {
  dog: any
  viewerRole: "admin" | "foster"
  onAssignFoster?: () => void
  onAddUpdate?: () => void
  onUploadFile?: () => void
  onCreateAppointment?: () => void
  onCreateTask?: () => void
}

export function DogHeaderCard({
  dog,
  viewerRole,
  onAssignFoster,
  onAddUpdate,
  onUploadFile,
  onCreateAppointment,
  onCreateTask,
}: DogHeaderCardProps) {
  const [imageError, setImageError] = useState(false)

  const stageColor =
    dog.stage === "in_foster"
      ? "bg-[#E8EFE6] text-[#5A4A42]"
      : dog.stage === "medical_hold"
        ? "bg-[#D97A68] text-white"
        : "bg-[#F7E2BD] text-[#5A4A42]"

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-4">
      <div className="relative">
        <img
          src={
            imageError
              ? "/placeholder.svg?height=300&width=300&query=dog"
              : dog.image_url || "/placeholder.svg?height=300&width=300&query=dog"
          }
          alt={dog.name}
          className="w-full h-64 object-cover"
          onError={() => setImageError(true)}
        />
        <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold ${stageColor}`}>
          {dog.stage === "in_foster"
            ? "In Foster Care"
            : dog.stage === "medical_hold"
              ? "Medical Hold"
              : dog.stage === "available"
                ? "Available"
                : "Other"}
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#5A4A42] mb-1">{dog.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#2E2E2E]/70">
            <span>{dog.breed}</span>
            {dog.age && (
              <>
                <span>•</span>
                <span>{dog.age} years</span>
              </>
            )}
            {dog.gender && (
              <>
                <span>•</span>
                <span className="capitalize">{dog.gender}</span>
              </>
            )}
            {dog.weight && (
              <>
                <span>•</span>
                <span>{dog.weight} lbs</span>
              </>
            )}
          </div>

          {dog.foster && (
            <div className="mt-2 text-sm text-[#2E2E2E]/70">
              <span className="font-medium">Foster:</span> <span>{dog.foster.name || dog.foster.email}</span>
            </div>
          )}

          {dog.organization && <div className="text-xs text-[#2E2E2E]/60 mt-1">via {dog.organization.name}</div>}
        </div>

        {/* Admin Quick Actions */}
        {viewerRole === "admin" && (
          <div className="space-y-2 pt-4 border-t border-[#F7E2BD]">
            <h4 className="text-xs font-semibold text-[#5A4A42] uppercase tracking-wide">Quick Actions</h4>

            <button
              onClick={onAssignFoster}
              className="w-full flex items-center justify-center gap-2 bg-[#D76B1A] text-white px-4 py-2.5 rounded-xl hover:bg-[#C25E15] transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {dog.foster_id ? "Reassign Foster" : "Assign Foster"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAddUpdate}
                className="flex items-center justify-center gap-1.5 border border-[#5A4A42] text-[#5A4A42] px-3 py-2 rounded-xl hover:bg-[#F7E2BD]/40 transition text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Update
              </button>

              <button
                onClick={onUploadFile}
                className="flex items-center justify-center gap-1.5 border border-[#5A4A42] text-[#5A4A42] px-3 py-2 rounded-xl hover:bg-[#F7E2BD]/40 transition text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                File
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onCreateAppointment}
                className="flex items-center justify-center gap-1.5 border border-[#5A4A42] text-[#5A4A42] px-3 py-2 rounded-xl hover:bg-[#F7E2BD]/40 transition text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Appt
              </button>

              <button
                onClick={onCreateTask}
                className="flex items-center justify-center gap-1.5 border border-[#5A4A42] text-[#5A4A42] px-3 py-2 rounded-xl hover:bg-[#F7E2BD]/40 transition text-xs font-medium"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Task
              </button>
            </div>
          </div>
        )}

        {/* Basic Info Card */}
        {(dog.medical_notes || dog.behavior_notes) && (
          <div className="bg-[#F7E2BD]/40 rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#5A4A42] mb-2">Important Notes</h3>
            {dog.medical_notes && (
              <p className="text-sm text-[#2E2E2E]/70 mb-2">
                <span className="font-medium">Medical:</span> {dog.medical_notes}
              </p>
            )}
            {dog.behavior_notes && (
              <p className="text-sm text-[#2E2E2E]/70">
                <span className="font-medium">Behavior:</span> {dog.behavior_notes}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
