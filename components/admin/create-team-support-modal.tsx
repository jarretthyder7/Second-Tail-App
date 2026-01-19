'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, Calendar, Users, PawPrint, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type RequestType = 'supplies' | 'medical' | 'behavioral' | 'appointment' | 'emergency' | 'other'
type Priority = 'low' | 'normal' | 'high'

interface Foster {
  id: string
  name: string
  email: string
}

interface Animal {
  id: string
  name: string
  species: string
  breed: string
}

interface Team {
  id: string
  name: string
  type: string
}

interface StaffMember {
  id: string
  name: string
  email: string
}

interface CreateTeamSupportModalProps {
  orgId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateTeamSupportModal({ orgId, isOpen, onClose, onSuccess }: CreateTeamSupportModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fosters, setFosters] = useState<Foster[]>([])
  const [animals, setAnimals] = useState<Animal[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  
  // Form state
  const [selectedFoster, setSelectedFoster] = useState<string>('')
  const [selectedAnimal, setSelectedAnimal] = useState<string>('')
  const [requestType, setRequestType] = useState<RequestType>('supplies')
  const [priority, setPriority] = useState<Priority>('normal')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignmentType, setAssignmentType] = useState<'team' | 'staff' | 'none'>('none')
  const [assignedTeam, setAssignedTeam] = useState<string>('')
  const [assignedStaff, setAssignedStaff] = useState<string>('')
  
  // Appointment-specific fields
  const [createAppointment, setCreateAppointment] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [appointmentLocation, setAppointmentLocation] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, orgId])

  useEffect(() => {
    // Auto-enable appointment creation for appointment type
    if (requestType === 'appointment') {
      setCreateAppointment(true)
    }
  }, [requestType])

  useEffect(() => {
    // When foster is selected, load their animals
    if (selectedFoster) {
      loadAnimalsForFoster(selectedFoster)
    }
  }, [selectedFoster])

  async function loadData() {
    const supabase = createClient()
    
    const [fostersRes, animalsRes, teamsRes, staffRes] = await Promise.all([
      supabase.from('profiles').select('id, name, email').eq('organization_id', orgId).eq('role', 'foster'),
      supabase.from('dogs').select('id, name, species, breed').eq('organization_id', orgId),
      supabase.from('teams').select('id, name, type').eq('organization_id', orgId),
      supabase.from('profiles').select('id, name, email').eq('organization_id', orgId).eq('role', 'rescue'),
    ])

    if (fostersRes.data) setFosters(fostersRes.data)
    if (animalsRes.data) setAnimals(animalsRes.data)
    if (teamsRes.data) setTeams(teamsRes.data)
    if (staffRes.data) setStaff(staffRes.data)
  }

  async function loadAnimalsForFoster(fosterId: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('dogs')
      .select('id, name, species, breed')
      .eq('foster_id', fosterId)
    
    if (data) {
      setAnimals(data)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    
    try {
      const payload = {
        organization_id: orgId,
        foster_id: selectedFoster || null,
        dog_id: selectedAnimal || null,
        category: requestType,
        priority,
        title: title || `${requestType.charAt(0).toUpperCase() + requestType.slice(1)} Request`,
        description,
        status: 'open',
        team_created: true,
        assigned_team_id: assignmentType === 'team' ? assignedTeam : null,
        assigned_staff_id: assignmentType === 'staff' ? assignedStaff : null,
      }

      // Create appointment if needed
      if (createAppointment && appointmentDate && appointmentTime) {
        payload.create_appointment = {
          start_time: `${appointmentDate}T${appointmentTime}`,
          location: appointmentLocation,
        }
      }

      const response = await fetch(`/api/admin/help-requests/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to create support request')

      onSuccess()
      resetForm()
      onClose()
    } catch (error) {
      console.error('[v0] Error creating support request:', error)
      alert('Failed to create support request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setStep(1)
    setSelectedFoster('')
    setSelectedAnimal('')
    setRequestType('supplies')
    setPriority('normal')
    setTitle('')
    setDescription('')
    setAssignmentType('none')
    setAssignedTeam('')
    setAssignedStaff('')
    setCreateAppointment(false)
    setAppointmentDate('')
    setAppointmentTime('')
    setAppointmentLocation('')
  }

  if (!isOpen) return null

  const requestTypeOptions = [
    { value: 'supplies', label: 'Supplies', icon: '📦' },
    { value: 'medical', label: 'Medical', icon: '🏥' },
    { value: 'behavioral', label: 'Behavioral', icon: '🐕' },
    { value: 'appointment', label: 'Appointment', icon: '📅' },
    { value: 'emergency', label: 'Emergency', icon: '🚨' },
    { value: 'other', label: 'Other', icon: '💬' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Support Request</h2>
            <p className="text-sm text-gray-600 mt-1">Log a support request from a call or email</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                  step >= 1 ? 'bg-primary-orange text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </div>
              <div
                className={`flex-1 h-1 mx-3 rounded ${
                  step > 1 ? 'bg-primary-orange' : 'bg-gray-200'
                }`}
              />
            </div>
            <div className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                  step >= 2 ? 'bg-primary-orange text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
              <div
                className={`flex-1 h-1 mx-3 rounded ${
                  step > 2 ? 'bg-primary-orange' : 'bg-gray-200'
                }`}
              />
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
                step >= 3 ? 'bg-primary-orange text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              3
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <span className="text-xs text-gray-600 text-left">Select Foster/Animal</span>
            <span className="text-xs text-gray-600 text-center">Request Details</span>
            <span className="text-xs text-gray-600 text-right">Assignment</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Foster & Animal */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foster (optional)
                </label>
                <select
                  value={selectedFoster}
                  onChange={(e) => setSelectedFoster(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                >
                  <option value="">None - Animal not with foster</option>
                  {fosters.map((foster) => (
                    <option key={foster.id} value={foster.id}>
                      {foster.name} ({foster.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a foster if this request is related to their animal
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Animal
                </label>
                <select
                  value={selectedAnimal}
                  onChange={(e) => setSelectedAnimal(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  disabled={!selectedFoster && animals.length === 0}
                >
                  <option value="">Select an animal</option>
                  {animals.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name} ({animal.species} - {animal.breed})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Request Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {requestTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRequestType(option.value as RequestType)}
                      className={`p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                        requestType === option.value
                          ? 'border-primary-orange bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium text-gray-900">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <div className="flex gap-3">
                  {(['low', 'normal', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 px-4 rounded-xl border-2 transition font-medium ${
                        priority === p
                          ? p === 'high'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : p === 'normal'
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief title for the request"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the request or issue..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-orange/40 resize-none"
                />
              </div>

              {/* Appointment-specific fields */}
              {requestType === 'appointment' && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Appointment Details</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                      <input
                        type="time"
                        value={appointmentTime}
                        onChange={(e) => setAppointmentTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={appointmentLocation}
                      onChange={(e) => setAppointmentLocation(e.target.value)}
                      placeholder="e.g., Main Street Vet Clinic"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Assignment */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign To
                </label>
                <div className="flex gap-3 mb-4">
                  {(['none', 'team', 'staff'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setAssignmentType(type)}
                      className={`flex-1 py-2 px-4 rounded-xl border-2 transition font-medium ${
                        assignmentType === type
                          ? 'border-primary-orange bg-orange-50 text-primary-orange'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {type === 'none' ? 'No Assignment' : type === 'team' ? 'Team' : 'Staff Member'}
                    </button>
                  ))}
                </div>
              </div>

              {assignmentType === 'team' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Team
                  </label>
                  <select
                    value={assignedTeam}
                    onChange={(e) => setAssignedTeam(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  >
                    <option value="">Select a team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {assignmentType === 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Staff Member
                  </label>
                  <select
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-orange/40"
                  >
                    <option value="">Select staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl space-y-2">
                <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Type:</strong> {requestType}</p>
                  <p><strong>Priority:</strong> {priority}</p>
                  {selectedAnimal && <p><strong>Animal:</strong> {animals.find(a => a.id === selectedAnimal)?.name}</p>}
                  {selectedFoster && <p><strong>Foster:</strong> {fosters.find(f => f.id === selectedFoster)?.name}</p>}
                  {createAppointment && appointmentDate && (
                    <p><strong>Appointment:</strong> {appointmentDate} at {appointmentTime}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            disabled={loading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-primary-orange text-white rounded-lg font-medium hover:bg-primary-orange/90 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-primary-orange text-white rounded-lg font-medium hover:bg-primary-orange/90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
