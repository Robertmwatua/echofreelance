export type Role = 'Student' | 'Tutor' | 'Admin'

export interface UserProfile {
  id: string
  email: string
  name?: string | null
  role: Role
  bio?: string | null
  headline?: string | null
  createdAt?: string
}

export type ClassStatus = 'Scheduled' | 'Live' | 'Completed' | 'Cancelled'

export interface CourseSummary {
  id: string
  title: string
  description: string
  category: string
  level: string
  priceCents: number
  published: boolean
  tutorId: string
  tutor?: Pick<UserProfile, 'id' | 'name' | 'email' | 'headline'>
  enrollmentCount?: number
  lessonCount?: number
  enrolled?: boolean
}

export interface VirtualClassSummary {
  id: string
  title: string
  description?: string | null
  startsAt: string
  endsAt: string
  status: ClassStatus
  meetingUrl?: string
  course?: { id: string; title: string; category?: string }
  host?: Pick<UserProfile, 'id' | 'name' | 'email'>
  attendanceCount?: number
  registered?: boolean
}

export interface AuthResponse {
  accessToken: string
  user: UserProfile
}

export interface ApiError {
  statusCode: number
  message: string | string[]
  error?: string
}
