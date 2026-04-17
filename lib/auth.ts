// Mock authentication system
export interface User {
  id: string
  name: string
  email: string
  role: 'foster' | 'rescue' // Changed 'admin' to 'rescue'
  orgId?: string // For rescue users, their organization
  orgRole?: 'org_admin' | 'staff' // Only for rescue users
  teams?: string[] // Team IDs this user belongs to
  teamLeads?: string[] // Team IDs this user leads (just for UI, no extra permissions)
  avatarUrl?: string
}

// Mock user database
const mockUsers: Record<string, User> = {
  foster: {
    id: 'foster-1',
    name: 'Sarah Chen',
    email: 'sarah@foster.com',
    role: 'foster',
    avatarUrl: '/diverse-avatars.png',
  },
  admin: {
    id: 'admin-1',
    name: 'Marcus Johnson',
    email: 'marcus@secondtail.com',
    role: 'rescue',
    orgId: 'org-1',
    orgRole: 'org_admin',
    teams: ['team-1', 'team-2', 'team-3'],
    teamLeads: [],
    avatarUrl: '/diverse-avatars.png',
  },
  staff1: {
    id: 'staff-1',
    name: 'Dr. Lisa Park',
    email: 'lisa@secondtail.com',
    role: 'rescue',
    orgId: 'org-1',
    orgRole: 'staff',
    teams: ['team-2'], // Medical team
    teamLeads: ['team-2'], // Team lead of medical team
    avatarUrl: '/diverse-avatars.png',
  },
  staff2: {
    id: 'staff-2',
    name: 'Emma Wilson',
    email: 'emma@secondtail.com',
    role: 'rescue',
    orgId: 'org-1',
    orgRole: 'staff',
    teams: ['team-1'], // Foster team
    teamLeads: [],
    avatarUrl: '/diverse-avatars.png',
  },
  staff3: {
    id: 'staff-3',
    name: 'Jessica Lee',
    email: 'jessica@secondtail.com',
    role: 'rescue',
    orgId: 'org-1',
    orgRole: 'staff',
    teams: ['team-3'], // Adoption team
    teamLeads: [],
    avatarUrl: '/diverse-avatars.png',
  },
}

export function loginUser(email: string, password: string, expectedRole?: 'foster' | 'rescue'): User | null {
  // Mock login - in real app, validate credentials
  let user: User | null = null
  
  if (email.includes('foster') || email === 'sarah@foster.com') {
    user = mockUsers.foster
  } else if (email === 'marcus@secondtail.com') {
    user = mockUsers.admin
  } else if (email === 'lisa@secondtail.com') {
    user = mockUsers.staff1
  } else if (email === 'emma@secondtail.com') {
    user = mockUsers.staff2
  } else if (email === 'jessica@secondtail.com') {
    user = mockUsers.staff3
  }
  
  // If expectedRole is provided, validate it matches
  if (user && expectedRole && user.role !== expectedRole) {
    return null
  }
  
  return user
}

export function getCurrentUser(): User | null {
  // In real app, check session/token
  const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  if (stored) {
    return JSON.parse(stored)
  }
  return null
}

export function setCurrentUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentUser', JSON.stringify(user))
  }
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser')
  }
}
