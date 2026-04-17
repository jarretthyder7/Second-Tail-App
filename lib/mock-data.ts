export interface Dog {
  id: string
  name: string
  breed: string
  age?: string
  weight?: string
  status: 'in-foster' | 'available' | 'on-hold' | 'adopted' | 'medical-hold'
  fosterName?: string
  fosterId?: string
  orgId: string // Required org assignment
  photo: string
  lastUpdate: string
  medications?: string[]
  notes?: string
  tags?: string[]
  intakeDate?: string
  lastActivityDate?: string
}

export interface DailyLog {
  id: string
  dogId: string
  orgId: string // 
  date: string
  category: string
  notes: string
  mood: 'rough' | 'ok' | 'great'
  photos?: string[]
}

export interface Conversation {
  id: string
  fosterId: string
  staffId: string
  orgId: string // 
  dogIds: string[]
  lastMessageTimestamp: string
  unreadCount?: number
}

export interface Message {
  id: string
  conversationId: string
  orgId: string // 
  dogId?: string
  sender: 'foster' | 'admin'
  senderName: string
  content: string
  timestamp: string
  attachments?: string[]
  sender_role?: 'foster' | 'foster_team' | 'medical_team' | 'adoption_team'
  sender_user_id?: string
}

export interface HelpRequest {
  id: string
  dogId: string
  fosterId: string
  orgId: string // 
  type: 'supplies' | 'emergency' | 'medical' | 'behavior' | 'appointment' | 'other'
  description: string
  status: 'open' | 'in-progress' | 'resolved'
  assignedTeam?: string
  priority?: 'low' | 'normal' | 'high'
  createdAt: string
  resolvedAt?: string
  appointmentDate?: string
  appointmentTime?: string
  symptoms?: string
  requestedSupplies?: string[]
  notes?: string
}

export interface JourneyEvent {
  id: string
  dogId: string
  orgId: string // 
  type: 'intake' | 'assigned' | 'log' | 'help-request' | 'help-request-resolved' | 'message' | 'vet-visit' | 'status-change' | 'internal' | 'care-plan-change'
  title: string
  description: string
  timestamp: string
  mood?: 'rough' | 'ok' | 'great'
  icon?: string
  teamBadge?: 'foster' | 'medical' | 'adoption'
  isInternal?: boolean
  created_by_role?: 'foster' | 'admin' | 'team'
}

export interface CarePlan {
  dogId: string
  medications: Array<{ name: string; schedule: string; instructions: string }>
  behaviorNotes: string
  feedingInstructions: string
  specialNeeds: string[]
  vetInfo?: { clinic: string; phone: string; nextVisit?: string }
}

export interface Team {
  id: string
  name: string
  orgId: string
  type: 'foster' | 'medical' | 'adoption' | 'operations'
  members: Array<{ id: string; name: string; email: string; isLead?: boolean }>
  leadId?: string // Optional team lead user ID
}

export interface Alert {
  id: string
  type: 'rough-day' | 'unanswered-message' | 'open-help-request'
  dogId: string
  dogName: string
  message: string
  timestamp: string
  priority: 'high' | 'medium' | 'low'
}

export interface InternalTeamMessage {
  id: string
  teamId: string
  orgId: string // 
  senderId: string
  senderName: string
  senderTeam: string
  content: string
  timestamp: string
}

export interface StaffMember {
  id: string
  name: string
  orgId: string // 
  role: 'foster_team' | 'medical_team' | 'adoption_team'
  email: string
  avatar?: string
}

export interface Organization {
  id: string
  name: string
  icon?: string
  contactEmail: string
  contactPhone: string
  emergencyPhone: string
  address?: string
  fosterCoordinator?: {
    name: string
    email: string
    phone: string
  }
}

export interface FosterOrgMembership {
  id: string
  fosterId: string
  orgId: string
  status: 'active' | 'invited' | 'suspended'
  joinedAt: string
}

export interface RescueOrgMembership {
  id: string
  userId: string
  orgId: string
  role: 'admin' | 'staff' | 'coordinator'
  teams: string[] // team IDs user belongs to
}

export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Second Tail Rescue',
    icon: '/organization-logo.png',
    contactEmail: 'info@secondtail.org',
    contactPhone: '555-0100',
    emergencyPhone: '555-0911',
    address: '123 Rescue Lane, New York, NY 10001',
    fosterCoordinator: {
      name: 'Marcus Johnson',
      email: 'marcus@secondtail.org',
      phone: '555-0101'
    }
  },
  {
    id: 'org-2',
    name: 'Husky Haven NYC',
    icon: '/husky-logo.png',
    contactEmail: 'info@huskyhaven.org',
    contactPhone: '555-0200',
    emergencyPhone: '555-0912',
    fosterCoordinator: {
      name: 'Jennifer Smith',
      email: 'jennifer@huskyhaven.org',
      phone: '555-0201'
    }
  },
]

export const mockFosterOrgMemberships: FosterOrgMembership[] = [
  {
    id: 'fom-1',
    fosterId: 'foster-1',
    orgId: 'org-1',
    status: 'active',
    joinedAt: '2025-09-01T00:00:00Z'
  },
  {
    id: 'fom-2',
    fosterId: 'foster-1',
    orgId: 'org-2',
    status: 'active',
    joinedAt: '2025-10-01T00:00:00Z'
  },
]

export const mockRescueOrgMemberships: RescueOrgMembership[] = [
  {
    id: 'rom-1',
    userId: 'admin-1',
    orgId: 'org-1',
    role: 'admin',
    teams: ['team-1', 'team-2', 'team-3']
  },
]

export const mockDogs: Dog[] = [
  {
    id: 'dog-1',
    name: 'Luna',
    breed: 'Golden Retriever Mix',
    age: '2 years',
    weight: '55 lbs',
    status: 'in-foster',
    fosterName: 'Sarah Chen',
    fosterId: 'foster-1',
    orgId: 'org-1', // 
    photo: '/happy-golden-retriever.png',
    lastUpdate: '2 hours ago',
    medications: ['Antibiotics - 2x daily'],
    notes: 'Recovering well from surgery. Very sweet and playful.',
    tags: ['Needs meds', 'Good with dogs'],
    intakeDate: '2025-10-15',
    lastActivityDate: '2025-11-18',
  },
  {
    id: 'dog-2',
    name: 'Max',
    breed: 'German Shepherd',
    age: '4 years',
    weight: '75 lbs',
    status: 'in-foster',
    fosterName: 'Sarah Chen',
    fosterId: 'foster-1',
    orgId: 'org-1', // 
    photo: '/majestic-german-shepherd.png',
    lastUpdate: '1 day ago',
    medications: [],
    notes: 'Seems anxious about loud noises',
    tags: ['Anxious', 'Needs quiet home'],
    intakeDate: '2025-10-20',
    lastActivityDate: '2025-11-17',
  },
  {
    id: 'dog-3',
    name: 'Bella',
    breed: 'Lab Mix',
    age: '1 year',
    weight: '45 lbs',
    status: 'available',
    fosterName: 'James Rodriguez',
    fosterId: 'foster-2',
    orgId: 'org-2', // Different org
    photo: '/labrador-mix-puppy.jpg',
    lastUpdate: '3 hours ago',
    medications: [],
    notes: 'Thriving! Great with kids.',
    tags: ['Good with kids', 'High energy'],
    intakeDate: '2025-09-01',
    lastActivityDate: '2025-11-18',
  },
  {
    id: 'dog-4',
    name: 'Charlie',
    breed: 'Terrier Mix',
    age: '5 years',
    weight: '30 lbs',
    status: 'medical-hold',
    fosterName: 'Emma Wilson',
    fosterId: 'foster-3',
    orgId: 'org-1', // 
    photo: '/terrier-mix.jpg',
    lastUpdate: '5 hours ago',
    medications: ['Pain medication - as needed'],
    notes: 'Post-surgery care ongoing',
    tags: ['Needs meds', 'Senior'],
    intakeDate: '2025-11-01',
    lastActivityDate: '2025-11-18',
  },
]

export const mockLogs: DailyLog[] = [
  {
    id: 'log-1',
    dogId: 'dog-1',
    orgId: 'org-1',
    date: '2025-11-18',
    category: 'Behavior',
    notes: 'Luna is bouncing around with lots of energy! She had a great play session this morning.',
    mood: 'great',
  },
  {
    id: 'log-2',
    dogId: 'dog-1',
    orgId: 'org-1',
    date: '2025-11-17',
    category: 'Health',
    notes: 'Took medication smoothly with treats. Appetite normal.',
    mood: 'great',
  },
  {
    id: 'log-3',
    dogId: 'dog-1',
    orgId: 'org-1',
    date: '2025-11-16',
    category: 'Behavior',
    notes: 'A bit tired today, resting more than usual. Nothing concerning.',
    mood: 'ok',
  },
]

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    fosterId: 'foster-1',
    staffId: 'staff-1',
    orgId: 'org-1',
    dogIds: ['dog-1'],
    lastMessageTimestamp: '2025-11-18T11:00:00Z',
    unreadCount: 0 // No unread messages
  },
  {
    id: 'conv-2',
    fosterId: 'foster-1',
    staffId: 'staff-2',
    orgId: 'org-1',
    dogIds: ['dog-2'],
    lastMessageTimestamp: '2025-11-17T14:15:00Z',
    unreadCount: 2 // 2 unread messages from Dr. Lisa Park
  },
  {
    id: 'conv-3',
    fosterId: 'foster-1',
    staffId: 'staff-3',
    orgId: 'org-1',
    dogIds: ['dog-1'],
    lastMessageTimestamp: '2025-11-16T11:30:00Z',
    unreadCount: 1 // 1 unread message from Jessica Lee
  },
]

export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    orgId: 'org-1',
    dogId: 'dog-1',
    sender: 'admin',
    senderName: 'Marcus Johnson',
    content: 'Hi Sarah! How is Luna doing today?',
    timestamp: '2025-11-18T10:30:00Z',
    sender_role: 'foster_team',
    sender_user_id: 'staff-1'
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    orgId: 'org-1',
    dogId: 'dog-1',
    sender: 'foster',
    senderName: 'Sarah Chen',
    content: 'Luna is doing amazing! So much energy and she loves the new toys.',
    timestamp: '2025-11-18T10:45:00Z',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    orgId: 'org-1',
    dogId: 'dog-1',
    sender: 'admin',
    senderName: 'Marcus Johnson',
    content: 'That\'s wonderful to hear! Keep up the great work.',
    timestamp: '2025-11-18T11:00:00Z',
    sender_role: 'foster_team',
    sender_user_id: 'staff-1'
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    orgId: 'org-1',
    dogId: 'dog-2',
    sender: 'admin',
    senderName: 'Dr. Lisa Park',
    content: 'Hi Sarah, I reviewed Max\'s anxiety notes. Let\'s schedule a check-up.',
    timestamp: '2025-11-17T14:00:00Z',
    sender_role: 'medical_team',
    sender_user_id: 'staff-2'
  },
  {
    id: 'msg-5',
    conversationId: 'conv-2',
    orgId: 'org-1',
    dogId: 'dog-2',
    sender: 'foster',
    senderName: 'Sarah Chen',
    content: 'That would be great! He\'s still very anxious during storms.',
    timestamp: '2025-11-17T14:15:00Z',
  },
  {
    id: 'msg-6',
    conversationId: 'conv-3',
    orgId: 'org-1',
    dogId: 'dog-1',
    sender: 'admin',
    senderName: 'Jessica Lee',
    content: 'Sarah, we have a potential adopter interested in Luna! Can we schedule a meet & greet?',
    timestamp: '2025-11-16T11:00:00Z',
    sender_role: 'adoption_team',
    sender_user_id: 'staff-3'
  },
  {
    id: 'msg-7',
    conversationId: 'conv-3',
    orgId: 'org-1',
    dogId: 'dog-1',
    sender: 'foster',
    senderName: 'Sarah Chen',
    content: 'That\'s exciting! Yes, I\'m available this weekend.',
    timestamp: '2025-11-16T11:30:00Z',
  },
]

export const mockHelpRequests: HelpRequest[] = [
  {
    id: 'help-1',
    dogId: 'dog-2',
    fosterId: 'foster-1',
    orgId: 'org-1',
    type: 'behavior',
    description: 'Max has been very anxious during thunderstorms. Looking for advice on how to help him feel more comfortable.',
    status: 'open',
    createdAt: '2025-11-18T09:00:00Z',
  },
  {
    id: 'help-2',
    dogId: 'dog-4',
    fosterId: 'foster-3',
    orgId: 'org-1',
    type: 'supplies',
    description: 'Running low on pain medication for Charlie. Need refill.',
    status: 'in-progress',
    assignedTeam: 'medical',
    createdAt: '2025-11-17T14:30:00Z',
  },
]

export const mockJourneyEvents: JourneyEvent[] = [
  {
    id: 'journey-1',
    dogId: 'dog-1',
    orgId: 'org-1',
    type: 'intake',
    title: 'Luna arrived at rescue',
    description: 'Intake completed, medical assessment scheduled',
    timestamp: '2025-10-15T10:00:00Z',
  },
  {
    id: 'journey-2',
    dogId: 'dog-1',
    orgId: 'org-1',
    type: 'assigned',
    title: 'Assigned to foster',
    description: 'Assigned to Sarah Chen',
    timestamp: '2025-10-16T14:00:00Z',
  },
  {
    id: 'journey-3',
    dogId: 'dog-1',
    orgId: 'org-1',
    type: 'log',
    title: 'Daily log: Great mood',
    description: 'Luna is bouncing around with lots of energy!',
    timestamp: '2025-11-18T08:30:00Z',
    mood: 'great',
  },
]

export const mockCarePlans: Record<string, CarePlan> = {
  'dog-1': {
    dogId: 'dog-1',
    medications: [
      { name: 'Cephalexin', schedule: '2x daily', instructions: 'Give with food, 500mg' },
    ],
    behaviorNotes: 'Very social and friendly. Loves to play fetch.',
    feedingInstructions: '2 cups twice daily, morning and evening',
    specialNeeds: ['Post-surgery care', 'Avoid rough play for 2 weeks'],
    vetInfo: { clinic: 'Second Tail Vet Clinic', phone: '555-0123', nextVisit: '2025-11-25' },
  },
  'dog-2': {
    dogId: 'dog-2',
    medications: [],
    behaviorNotes: 'Anxious with loud noises. Benefits from a quiet, calm environment.',
    feedingInstructions: '3 cups twice daily',
    specialNeeds: ['Anxiety management', 'Slow introductions to new people'],
  },
}

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Foster Team',
    orgId: 'org-1',
    type: 'foster',
    leadId: 'admin-1',
    members: [
      { id: 'admin-1', name: 'Marcus Johnson', email: 'marcus@secondtail.com', isLead: true },
      { id: 'staff-2', name: 'Emma Wilson', email: 'emma@secondtail.com' },
      { id: 'staff-3', name: 'James Rodriguez', email: 'james@secondtail.com' },
    ],
  },
  {
    id: 'team-2',
    name: 'Medical Team',
    orgId: 'org-1',
    type: 'medical',
    leadId: 'staff-1',
    members: [
      { id: 'staff-1', name: 'Dr. Lisa Park', email: 'lisa@secondtail.com', isLead: true },
      { id: 'staff-4', name: 'Vet Tech Mike', email: 'mike@secondtail.com' },
    ],
  },
  {
    id: 'team-3',
    name: 'Adoption Team',
    orgId: 'org-1',
    type: 'adoption',
    members: [
      { id: 'staff-5', name: 'Jessica Lee', email: 'jessica@secondtail.com' },
      { id: 'staff-6', name: 'Tom Anderson', email: 'tom@secondtail.com' },
    ],
  },
]

export const mockInternalTeamMessages: InternalTeamMessage[] = [
  {
    id: 'internal-1',
    teamId: 'team-1',
    orgId: 'org-1',
    senderId: 'user-1',
    senderName: 'Sarah Chen',
    senderTeam: 'Foster Team',
    content: 'Has anyone dealt with thunderstorm anxiety before? Max is really struggling.',
    timestamp: '2025-11-18T09:15:00Z',
  },
  {
    id: 'internal-2',
    teamId: 'team-1',
    orgId: 'org-1',
    senderId: 'user-4',
    senderName: 'Dr. Lisa Park',
    senderTeam: 'Medical Team',
    content: 'Yes, we can try a calming supplement. I\'ll coordinate with the foster.',
    timestamp: '2025-11-18T09:30:00Z',
  },
]

export const mockStaffMembers: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Marcus Johnson',
    orgId: 'org-1',
    role: 'foster_team',
    email: 'marcus@secondtail.com',
    avatar: '/professional-man-with-friendly-smile.jpg'
  },
  {
    id: 'staff-2',
    name: 'Dr. Lisa Park',
    orgId: 'org-1',
    role: 'medical_team',
    email: 'lisa@secondtail.com',
    avatar: '/female-veterinarian-professional.jpg'
  },
  {
    id: 'staff-3',
    name: 'Jessica Lee',
    orgId: 'org-1',
    role: 'adoption_team',
    email: 'jessica@secondtail.com',
    avatar: '/woman-professional-friendly.jpg'
  },
]

export function getDogsForFoster(fosterId: string): Dog[] {
  return mockDogs.filter(dog => dog.fosterId === fosterId)
}

export function getDogById(dogId: string): Dog | undefined {
  return mockDogs.find(dog => dog.id === dogId)
}

export function getLogsForDog(dogId: string): DailyLog[] {
  return mockLogs.filter(log => log.dogId === dogId)
}

export function getMessagesForDog(dogId: string): Message[] {
  return mockMessages.filter(msg => msg.dogId === dogId)
}

export function getCarePlanForDog(dogId: string): CarePlan | null {
  return mockCarePlans[dogId] || null
}

export function getDogsForAdmin(): Dog[] {
  return mockDogs
}

export function getFirstDogNeedingLog(fosterId: string): Dog | null {
  const dogs = getDogsForFoster(fosterId)
  const today = new Date().toISOString().split('T')[0]
  
  for (const dog of dogs) {
    const logs = getLogsForDog(dog.id)
    const hasLogToday = logs.some(log => log.date === today)
    if (!hasLogToday) {
      return dog
    }
  }
  
  return dogs[0] || null
}

export function fetchLogsForDog(dogId: string): Promise<DailyLog[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(getLogsForDog(dogId)), 100)
  })
}

export function submitLog(dogId: string, data: Partial<DailyLog>): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Submitting log for dog', dogId, data)
    setTimeout(resolve, 500)
  })
}

export function fetchMessagesForDog(dogId: string): Promise<Message[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(getMessagesForDog(dogId)), 100)
  })
}

export function sendMessage(dogId: string, data: { content: string; sender: 'foster' | 'admin'; senderName: string; sender_role?: string }): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Sending message for dog', dogId, data)
    setTimeout(resolve, 500)
  })
}

export function fetchJourneyForDog(dogId: string): Promise<JourneyEvent[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockJourneyEvents.filter(e => e.dogId === dogId)), 100)
  })
}

export function addJourneyEvent(dogId: string, eventData: Partial<JourneyEvent>): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Adding journey event for dog', dogId, eventData)
    setTimeout(resolve, 500)
  })
}

export function submitHelpRequest(dogId: string, data: Partial<HelpRequest>): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Submitting help request for dog', dogId, data)
    setTimeout(resolve, 500)
  })
}

export function fetchHelpRequests(orgId?: string): Promise<HelpRequest[]> {
  return new Promise(resolve => {
    let requests = mockHelpRequests
    if (orgId) {
      requests = requests.filter(r => r.orgId === orgId)
    }
    setTimeout(() => resolve(requests), 100)
  })
}

export function resolveHelpRequest(helpRequestId: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Resolving help request', helpRequestId)
    setTimeout(resolve, 500)
  })
}

export function fetchCarePlanForDog(dogId: string): Promise<CarePlan | null> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockCarePlans[dogId] || null), 100)
  })
}

export function updateCarePlan(dogId: string, data: Partial<CarePlan>): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Updating care plan for dog', dogId, data)
    setTimeout(resolve, 500)
  })
}

export function fetchTeams(orgId?: string): Promise<Team[]> {
  return new Promise(resolve => {
    let teams = mockTeams
    if (orgId) {
      teams = teams.filter(t => t.orgId === orgId)
    }
    setTimeout(() => resolve(teams), 100)
  })
}

export function fetchAlertsForAdmin(): Promise<Alert[]> {
  return new Promise(resolve => {
    const alerts: Alert[] = [
      {
        id: 'alert-1',
        type: 'rough-day',
        dogId: 'dog-2',
        dogName: 'Max',
        message: 'Max had a rough day - check latest log',
        timestamp: '2025-11-17T18:00:00Z',
        priority: 'high',
      },
      {
        id: 'alert-2',
        type: 'open-help-request',
        dogId: 'dog-2',
        dogName: 'Max',
        message: 'New help request: behavior question',
        timestamp: '2025-11-18T09:00:00Z',
        priority: 'medium',
      },
    ]
    setTimeout(() => resolve(alerts), 100)
  })
}

export function fetchDogsForAdmin(orgId?: string): Promise<Dog[]> {
  return new Promise(resolve => {
    let dogs = mockDogs
    if (orgId) {
      dogs = dogs.filter(d => d.orgId === orgId)
    }
    setTimeout(() => resolve(dogs), 100)
  })
}

export function fetchDogsForFoster(fosterId: string): Promise<Dog[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(getDogsForFoster(fosterId)), 100)
  })
}

export function fetchInternalTeamMessages(teamId: string, orgId?: string): Promise<InternalTeamMessage[]> {
  return new Promise(resolve => {
    let messages = mockInternalTeamMessages.filter(m => m.teamId === teamId)
    if (orgId) {
      messages = messages.filter(m => m.orgId === orgId)
    }
    setTimeout(() => resolve(messages), 100)
  })
}

export function sendInternalTeamMessage(teamId: string, message: Partial<InternalTeamMessage>): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Sending internal team message', teamId, message)
    setTimeout(resolve, 500)
  })
}

export function assignHelpRequestToTeam(helpRequestId: string, teamId: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Assigning help request', helpRequestId, 'to team', teamId)
    setTimeout(resolve, 500)
  })
}

export function addInternalNoteToHelpRequest(helpRequestId: string, note: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Adding internal note to help request', helpRequestId, note)
    setTimeout(resolve, 500)
  })
}

export function getStaffMemberById(staffId: string): StaffMember | undefined {
  return mockStaffMembers.find(staff => staff.id === staffId)
}

export function getMessagesForFoster(fosterId: string): Message[] {
  const dogs = getDogsForFoster(fosterId)
  const dogIds = dogs.map(d => d.id)
  return mockMessages.filter(msg => dogIds.includes(msg.dogId))
}

export function getConversationsForFoster(fosterId: string): Conversation[] {
  return mockConversations.filter(conv => conv.fosterId === fosterId)
}

export function getConversationById(conversationId: string): Conversation | undefined {
  return mockConversations.find(conv => conv.id === conversationId)
}

export function getMessagesForConversation(conversationId: string): Message[] {
  return mockMessages.filter(msg => msg.conversationId === conversationId)
}

export function getConversationsForDog(dogId: string, fosterId: string): Conversation[] {
  return mockConversations.filter(conv => 
    conv.fosterId === fosterId && conv.dogIds.includes(dogId)
  )
}

export function fetchOrganizationsForFoster(fosterId: string): Promise<Organization[]> {
  return new Promise(resolve => {
    const memberships = mockFosterOrgMemberships.filter(m => m.fosterId === fosterId && m.status === 'active')
    const orgs = memberships.map(m => mockOrganizations.find(o => o.id === m.orgId)).filter(Boolean) as Organization[]
    setTimeout(() => resolve(orgs), 100)
  })
}

export function fetchOrganizationForAdmin(userId: string): Promise<Organization | null> {
  return new Promise(resolve => {
    const membership = mockRescueOrgMemberships.find(m => m.userId === userId)
    const org = membership ? mockOrganizations.find(o => o.id === membership.orgId) : null
    setTimeout(() => resolve(org || null), 100)
  })
}

export function fetchDogsForOrg(orgId: string): Promise<Dog[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockDogs.filter(dog => dog.orgId === orgId)), 100)
  })
}

export function fetchFosterAssignments(fosterId: string, orgId?: string): Promise<Dog[]> {
  return new Promise(resolve => {
    let dogs = mockDogs.filter(dog => dog.fosterId === fosterId)
    if (orgId) {
      dogs = dogs.filter(dog => dog.orgId === orgId)
    }
    setTimeout(() => resolve(dogs), 100)
  })
}

export function inviteFosterToOrg(email: string, orgId: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Inviting foster', email, 'to org', orgId)
    setTimeout(resolve, 500)
  })
}

export function assignDogToFoster(dogId: string, fosterId: string, orgId: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Assigning dog', dogId, 'to foster', fosterId, 'in org', orgId)
    setTimeout(resolve, 500)
  })
}

export function getOrgMembership(userId: string): Promise<RescueOrgMembership | null> {
  return new Promise(resolve => {
    const membership = mockRescueOrgMemberships.find(m => m.userId === userId)
    setTimeout(() => resolve(membership || null), 100)
  })
}

export function getFosterOrganizationMemberships(fosterId: string): Promise<FosterOrgMembership[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockFosterOrgMemberships.filter(m => m.fosterId === fosterId)), 100)
  })
}

export function getOrganizationById(orgId: string): Organization | undefined {
  return mockOrganizations.find(org => org.id === orgId)
}

export function getOrganization(orgId: string): Organization | undefined {
  return getOrganizationById(orgId)
}

export function getFosterOrganizations(fosterId: string): FosterOrgMembership[] {
  return mockFosterOrgMemberships.filter(m => m.fosterId === fosterId && m.status === 'active')
}

export function fetchOrganizationById(orgId: string): Promise<Organization | null> {
  return new Promise(resolve => {
    setTimeout(() => resolve(getOrganizationById(orgId) || null), 100)
  })
}

export function fetchFostersForOrg(orgId: string): Promise<Array<{ foster: any; membership: FosterOrgMembership; dogs: Dog[] }>> {
  return new Promise(resolve => {
    console.log('[v0] Fetching fosters for org', orgId)
    // Placeholder - would fetch actual foster users
    setTimeout(() => resolve([]), 500)
  })
}

export function updateOrgSettings(orgId: string, settings: Partial<Organization>): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Updating org settings', orgId, settings)
    setTimeout(resolve, 500)
  })
}

export function getTotalUnreadCountForFoster(fosterId: string, orgId?: string): number {
  let conversations = mockConversations.filter(conv => conv.fosterId === fosterId)
  if (orgId) {
    conversations = conversations.filter(conv => conv.orgId === orgId)
  }
  return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
}

export function markConversationAsRead(conversationId: string): Promise<void> {
  return new Promise(resolve => {
    const conv = mockConversations.find(c => c.id === conversationId)
    if (conv) {
      conv.unreadCount = 0
    }
    console.log('[v0] Marked conversation as read', conversationId)
    setTimeout(() => resolve(), 100)
  })
}

export function createDog(dogData: Omit<Dog, 'id' | 'lastUpdate'>): Promise<Dog> {
  return new Promise(resolve => {
    const newDog: Dog = {
      id: `dog-${Date.now()}`,
      lastUpdate: 'Just now',
      ...dogData
    }
    mockDogs.push(newDog)
    console.log('[v0] Created new dog', newDog)
    setTimeout(() => resolve(newDog), 500)
  })
}

export function createConversation(fosterId: string, staffId: string, orgId: string, dogIds: string[]): Promise<Conversation> {
  return new Promise(resolve => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      fosterId,
      staffId,
      orgId,
      dogIds,
      lastMessageTimestamp: new Date().toISOString(),
      unreadCount: 0
    }
    mockConversations.push(newConversation)
    console.log('[v0] Created new conversation', newConversation)
    setTimeout(() => resolve(newConversation), 500)
  })
}

export function createMessage(conversationId: string, orgId: string, dogId: string | undefined, content: string, sender: 'foster' | 'admin', senderName: string, sender_role?: string, sender_user_id?: string): Promise<Message> {
  return new Promise(resolve => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      orgId,
      dogId,
      sender,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      sender_role,
      sender_user_id
    }
    mockMessages.push(newMessage)
    console.log('[v0] Created new message', newMessage)
    setTimeout(() => resolve(newMessage), 500)
  })
}

export function getOrgMembershipForUser(userId: string, orgId: string): RescueOrgMembership | null {
  return mockRescueOrgMemberships.find(m => m.userId === userId && m.orgId === orgId) || null
}

export function userIsOrgAdmin(userId: string, orgId: string): boolean {
  const membership = getOrgMembershipForUser(userId, orgId)
  return membership?.role === 'admin'
}

export function userIsStaff(userId: string, orgId: string): boolean {
  const membership = getOrgMembershipForUser(userId, orgId)
  return membership?.role === 'staff' || membership?.role === 'coordinator'
}

export function userIsTeamLead(userId: string, teamName: string): boolean {
  const team = mockTeams.find(t => t.name === teamName)
  return team?.leadId === userId
}

export function fetchTeamsForOrg(orgId: string): Promise<Team[]> {
  return new Promise(resolve => {
    setTimeout(() => resolve(mockTeams.filter(t => t.orgId === orgId)), 100)
  })
}

export function addTeamMember(teamId: string, userId: string, userName: string, userEmail: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Adding team member', userId, 'to team', teamId)
    setTimeout(resolve, 500)
  })
}

export function createTeam(orgId: string, teamName: string, teamType: 'foster' | 'medical' | 'adoption' | 'operations'): Promise<Team> {
  return new Promise(resolve => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamName,
      orgId,
      type: teamType,
      members: []
    }
    mockTeams.push(newTeam)
    console.log('[v0] Created new team', newTeam)
    setTimeout(() => resolve(newTeam), 500)
  })
}

export function promoteToTeamLead(teamId: string, userId: string): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Promoting user', userId, 'to team lead of team', teamId)
    setTimeout(resolve, 500)
  })
}

export function inviteStaffMember(orgId: string, email: string, role: 'staff' | 'coordinator', teams: string[]): Promise<void> {
  return new Promise(resolve => {
    console.log('[v0] Inviting staff member', email, 'to org', orgId, 'with role', role)
    setTimeout(resolve, 500)
  })
}

export function deleteTeam(teamId: string): Promise<void> {
  return new Promise(resolve => {
    const index = mockTeams.findIndex(t => t.id === teamId)
    if (index > -1) {
      mockTeams.splice(index, 1)
    }
    console.log('[v0] Deleted team', teamId)
    setTimeout(resolve, 500)
  })
}

export function updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
  return new Promise(resolve => {
    const team = mockTeams.find(t => t.id === teamId)
    if (team) {
      Object.assign(team, updates)
    }
    console.log('[v0] Updated team', teamId, updates)
    setTimeout(resolve, 500)
  })
}

export function removeTeamMember(teamId: string, userId: string): Promise<void> {
  return new Promise(resolve => {
    const team = mockTeams.find(t => t.id === teamId)
    if (team) {
      team.members = team.members.filter(m => m.id !== userId)
    }
    console.log('[v0] Removed member', userId, 'from team', teamId)
    setTimeout(resolve, 500)
  })
}
