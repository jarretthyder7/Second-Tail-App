"use server"

import { createClient } from "./server"

// Dogs
export async function fetchDogsForOrg(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("dogs")
    .select("*, foster:profiles!dogs_foster_id_fkey(id, name, email)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching dogs:", error)
    return []
  }

  return data
}

export async function getDogById(dogId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("dogs")
    .select(`
      *,
      foster:profiles!dogs_foster_id_fkey(id, name, email),
      organization:organizations(*)
    `)
    .eq("id", dogId)
    .single()

  if (error) {
    console.error("Error fetching dog:", error)
    return null
  }

  return data
}

export async function createDog(orgId: string, dogData: any) {
  const supabase = await createClient()

  // `stage` is the canonical lifecycle field (intake, in_foster, available, adopted, etc.)
  // We deliberately do NOT write the legacy `status` column — it has a CHECK constraint
  // expecting legacy values like "fostered" / "medical-hold" and would reject our canonical
  // snake_case values. The dashboard reads stage with a status fallback, so old rows still
  // count correctly during the transition.
  const stageValue = dogData.stage || dogData.status || "intake"

  const { data, error } = await supabase
    .from("dogs")
    .insert({
      organization_id: orgId,
      name: dogData.name,
      breed: dogData.breed,
      species: dogData.species || "dog",
      age: dogData.age || null,
      gender: dogData.gender || null,
      weight: dogData.weight || null,
      image_url: dogData.image || null,
      intake_date: dogData.intakeDate || null,
      stage: stageValue,
      medical_notes: dogData.medicalNotes || null,
      behavior_notes: dogData.behavioralNotes || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating dog:", error)
    throw error
  }

  return data
}

export async function updateDog(dogId: string, updates: any) {
  const supabase = await createClient()

  // Build update object dynamically so we don't overwrite columns that weren't passed.
  const updateBody: Record<string, any> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) updateBody.name = updates.name
  if (updates.breed !== undefined) updateBody.breed = updates.breed
  if (updates.species !== undefined) updateBody.species = updates.species
  if (updates.age !== undefined) updateBody.age = updates.age
  if (updates.gender !== undefined) updateBody.gender = updates.gender
  if (updates.weight !== undefined) updateBody.weight = updates.weight
  if (updates.medicalNotes !== undefined) updateBody.medical_notes = updates.medicalNotes
  if (updates.behavioralNotes !== undefined) updateBody.behavior_notes = updates.behavioralNotes
  if (updates.fosterId !== undefined) updateBody.foster_id = updates.fosterId

  // Stage = canonical. Don't write `status` — its CHECK constraint expects legacy values
  // and would reject canonical snake_case ones. Accept either field name as input.
  const stageValue = updates.stage ?? updates.status
  if (stageValue !== undefined) {
    updateBody.stage = stageValue
  }

  const { data, error } = await supabase
    .from("dogs")
    .update(updateBody)
    .eq("id", dogId)
    .select()
    .single()

  if (error) {
    console.error("Error updating dog:", error)
    throw error
  }

  return data
}

// Daily Logs
export async function fetchLogsForDog(dogId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*, foster:profiles!daily_logs_foster_id_fkey(id, name)")
    .eq("dog_id", dogId)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching logs:", error)
    return []
  }

  return data
}

export async function submitLog(logData: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("daily_logs")
    .insert({
      dog_id: logData.dogId,
      foster_id: logData.fosterId,
      date: logData.date,
      mood: logData.mood,
      food_amount: logData.foodAmount,
      bathroom_breaks: logData.bathroomBreaks,
      exercise_duration: logData.exerciseDuration,
      behavior_notes: logData.behaviorNotes,
      medical_notes: logData.medicalNotes,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Care Plans
export async function fetchCarePlanForDog(dogId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("care_plans").select("*").eq("dog_id", dogId).maybeSingle()

  if (error) {
    
    return null
  }

  return data
}

export async function updateCarePlan(dogId: string, carePlanData: any) {
  const supabase = await createClient()

  // Check if care plan exists
  const { data: existing } = await supabase.from("care_plans").select("id").eq("dog_id", dogId).single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("care_plans")
      .update({
        medications: carePlanData.medications,
        feeding_schedule: carePlanData.feedingSchedule,
        vet_clinic: carePlanData.vetClinic,
        vet_phone: carePlanData.vetPhone,
        special_instructions: carePlanData.specialInstructions,
        next_vet_visit: carePlanData.nextVetVisit,
        updated_at: new Date().toISOString(),
      })
      .eq("dog_id", dogId)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Create new
    const { data, error } = await supabase
      .from("care_plans")
      .insert({
        dog_id: dogId,
        medications: carePlanData.medications,
        feeding_schedule: carePlanData.feedingSchedule,
        vet_clinic: carePlanData.vetClinic,
        vet_phone: carePlanData.vetPhone,
        special_instructions: carePlanData.specialInstructions,
        next_vet_visit: carePlanData.nextVetVisit,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Messages & Conversations
export async function fetchConversationsForDog(dogId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("conversations")
    .select("*, messages(*, sender:profiles!messages_sender_id_fkey(id, name, role))")
    .eq("dog_id", dogId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching conversations:", error)
    return []
  }

  return data
}

export async function fetchMessagesForConversation(conversationId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(id, name, role, org_role)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return data
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content,
    })
    .select()
    .single()

  if (error) {
    console.error("Error sending message:", error)
    throw error
  }

  return data
}

export async function createConversation(dogId: string, orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      dog_id: dogId,
      organization_id: orgId,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating conversation:", error)
    throw error
  }

  return data
}

// Help Requests
export async function fetchHelpRequests(orgId: string) {
  const supabase = await createClient()

  // Fetch help requests directly by organization_id
  const { data, error } = await supabase
    .from("help_requests")
    .select(`
      *,
      dog:dogs(id, name, breed, image_url),
      foster:profiles!help_requests_foster_id_fkey(id, name, email)
    `)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching help requests:", error)
    return []
  }

  return data || []
}

export async function submitHelpRequest(helpRequestData: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      dog_id: helpRequestData.dogId,
      foster_id: helpRequestData.fosterId,
      category: helpRequestData.category,
      priority: helpRequestData.priority,
      title: helpRequestData.title,
      description: helpRequestData.description,
      status: "open",
    })
    .select()
    .single()

  if (error) {
    console.error("Error submitting help request:", error)
    throw error
  }

  return data
}

export async function updateHelpRequest(requestId: string, updates: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("help_requests")
    .update({
      status: updates.status,
      resolved_at: updates.status === "resolved" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single()

  if (error) {
    console.error("Error updating help request:", error)
    throw error
  }

  return data
}

// Organizations
export async function fetchOrganizationById(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).single()

  if (error) {
    console.error("Error fetching organization:", error)
    return null
  }

  return data
}

export async function updateOrganization(orgId: string, updates: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      address: updates.address,
      city: updates.city,
      state: updates.state,
      zip: updates.zip,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId)
    .select()
    .single()

  if (error) {
    console.error("Error updating organization:", error)
    throw error
  }

  return data
}

// Fosters
export async function fetchFostersForOrg(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*, dogs:dogs!dogs_foster_id_fkey(id, name)")
    .eq("organization_id", orgId)
    .eq("role", "foster")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching fosters:", error)
    return []
  }

  return data
}

export async function assignFosterToOrg(fosterId: string, orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      organization_id: orgId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fosterId)
    .select()
    .single()

  if (error) {
    console.error("Error assigning foster:", error)
    throw error
  }

  return data
}

export async function fetchUnassignedFosters() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "foster")
    .is("organization_id", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching unassigned fosters:", error)
    return []
  }

  return data
}

// Invitations
export async function fetchInvitationsForEmail(email: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("invitations")
    .select("*, organization:organizations!organization_id(id, name, email)")
    .eq("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching invitations:", error)
    return []
  }

  return data
}

function generateInvitationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createInvitation(orgId: string, email: string, invitedBy: string) {
  const supabase = await createClient()

  // Check if invitation already exists
  const { data: existing } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("organization_id", orgId)
    .eq("email", email)
    .single()

  if (existing) {
    if (existing.status === "pending") {
      throw new Error("An invitation has already been sent to this email address")
    } else if (existing.status === "accepted") {
      throw new Error("This person is already a foster in your organization. Check your Active Fosters list.")
    } else if (existing.status === "declined") {
      // Update the declined invitation to pending with a fresh code
      const code = generateInvitationCode()
      const { data, error } = await supabase
        .from("invitations")
        .update({
          status: "pending",
          invited_by: invitedBy,
          code,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) {
        console.error("Error updating invitation:", error)
        throw error
      }

      return data
    }
  }

  const code = generateInvitationCode()

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      organization_id: orgId,
      email: email,
      invited_by: invitedBy,
      status: "pending",
      code,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating invitation:", error)
    throw error
  }

  return data
}

export async function acceptInvitation(invitationId: string, profileId: string, orgId: string) {
  const supabase = await createClient()

  console.log("Accepting invitation:", { invitationId, profileId, orgId })

  const { error: inviteError } = await supabase
    .from("invitations")
    .update({
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)

  if (inviteError) {
    console.error("Error updating invitation:", inviteError)
    throw inviteError
  }

  const { data, error: profileError } = await supabase
    .from("profiles")
    .update({
      organization_id: orgId,
      role: "foster",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single()

  if (profileError) {
    console.error("Error assigning foster to org:", profileError)
    throw profileError
  }

  console.log("Successfully accepted invitation and updated profile:", data)

  return data
}

export async function declineInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("invitations")
    .update({
      status: "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId)

  if (error) {
    console.error("Error declining invitation:", error)
    throw error
  }
}

export async function fetchPendingInvitations(orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("invitations")
    .select("*, invited_by_profile:profiles!invitations_invited_by_fkey(id, name)")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching pending invitations:", error)
    return []
  }

  return data
}

export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("invitations").delete().eq("id", invitationId)

  if (error) {
    console.error("Error canceling invitation:", error)
    throw error
  }
}

// New function to cancel foster connection
export async function cancelFosterConnection(profileId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      organization_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single()

  if (error) {
    console.error("Error canceling foster connection:", error)
    throw error
  }

  return data
}

export async function activateAcceptedInvitation(invitationId: string, email: string, orgId: string) {
  const supabase = await createClient()

  // If a real profile already exists for this email, update it
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single()

  if (existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        organization_id: orgId,
        role: "foster",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // If no profile exists yet, do nothing — the invitation record already
  // exists in the invitations table with status "pending". When the foster
  // signs up using their invitation code, the sign-up flow will correctly
  // create their profile with the right ID and link them to the org.
  return null
}

export async function updateFosterProfile(profileId: string, updates: any) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single()

  if (error) {
    console.error("Error updating foster profile:", error)
    throw error
  }

  return data
}

// Referral Tracking Functions
export async function createReferral(referrerId: string, referredEmail: string, orgId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("referrals")
    .insert({
      referrer_id: referrerId,
      referred_email: referredEmail,
      organization_id: orgId,
      status: "pending",
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating referral:", error)
    throw error
  }

  return data
}

export async function completeReferral(referralId: string, referredId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("referrals")
    .update({
      referred_id: referredId,
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", referralId)
    .select()
    .single()

  if (error) {
    console.error("Error completing referral:", error)
    throw error
  }

  return data
}

export async function fetchReferralsForFoster(fosterId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("referrals")
    .select("*, referred:profiles!referrals_referred_id_fkey(id, name, email)")
    .eq("referrer_id", fosterId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching referrals:", error)
    return []
  }

  return data
}

export async function getReferralByCode(code: string) {
  const supabase = await createClient()

  // In a real implementation, you'd store the code in the database
  // For now, we'll just return the code for validation
  return { code }
}

// Backward compatibility aliases
export { fetchDogsForOrg as getDogs }
export { fetchHelpRequests as getHelpRequests }
export { fetchOrganizationById as getOrganization }
export { getDogById as fetchDogById }

// Species-agnostic aliases (dogs table stores all animals)
export { fetchDogsForOrg as fetchAnimalsForOrg }
export { fetchDogsForOrg as getAnimals }
export { getDogById as getAnimalById }
export { createDog as createAnimal }
export { updateDog as updateAnimal }
export { fetchLogsForDog as fetchLogsForAnimal }
export { fetchCarePlanForDog as fetchCarePlanForAnimal }
export { updateCarePlan as updateAnimalCarePlan }
export { fetchConversationsForDog as fetchConversationsForAnimal }
