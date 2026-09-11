const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export type Role = 'Student' | 'Tutor' | 'Admin' | 'Instructor'

export type UserProfile = {
  id: string
  email: string
  name?: string | null
  role: Role
  bio?: string | null
  headline?: string | null
}

export type Lesson = {
  id: string
  title: string
  content?: string
  order: number
  durationMinutes: number
  videoUrl?: string | null
  locked?: boolean
  completed?: boolean
  resources?: LessonResource[]
}

export type LessonResource = {
  id: string
  title: string
  url: string
  kind: string
  lessonId: string
}

export type CourseProgress = {
  total: number
  completed: number
  percent: number
}

export type Course = {
  id: string
  title: string
  description: string
  category: string
  level: string
  priceCents: number
  published: boolean
  tutorId: string
  tutor?: Pick<UserProfile, 'id' | 'name' | 'email' | 'headline'>
  instructor?: Pick<UserProfile, 'id' | 'name' | 'email'>
  enrollmentCount?: number
  lessonCount?: number
  classCount?: number
  enrolled?: boolean
  canManage?: boolean
  lessons?: Lesson[]
  progress?: CourseProgress
  avgRating?: number | null
  reviewCount?: number
}

export type CourseReview = {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; name?: string | null }
}

export type CourseAnnouncement = {
  id: string
  title: string
  body: string
  createdAt: string
  author?: { id: string; name?: string | null }
}

export type AppNotification = {
  id: string
  title: string
  body: string
  href?: string | null
  read: boolean
  createdAt: string
}

export type Certificate = {
  id: string
  code: string
  issuedAt: string
  course: { id: string; title: string; category?: string; level?: string }
  user?: { id: string; name?: string | null; email: string }
}

export type Assignment = {
  id: string
  courseId: string
  title: string
  instructions: string
  dueAt?: string | null
  maxPoints: number
  published: boolean
  submissionCount?: number
  mySubmission?: {
    id: string
    content: string
    linkUrl?: string | null
    status: string
    grade?: number | null
    feedback?: string | null
  } | null
}

export type Challenge = {
  id: string
  title: string
  slug: string
  category: string
  difficulty: string
  points: number
  description: string
  hint?: string | null
  course?: { id: string; title: string } | null
  author?: { id: string; name?: string | null }
  solveCount?: number
  solved?: boolean
}

export type LeaderboardRow = {
  rank: number
  user: { id: string; name?: string | null; email: string }
  points: number
  solves: number
}

export type ClassRoster = {
  classId: string
  title: string
  registered: number
  entered: number
  attendees: {
    id: string
    name?: string | null
    email: string
    registeredAt: string
    enteredAt?: string | null
    attended: boolean
  }[]
}

export type VirtualClass = {
  id: string
  title: string
  description?: string | null
  startsAt: string
  endsAt: string
  status: string
  meetingUrl?: string
  recordingUrl?: string | null
  roomUrl?: string
  course?: { id: string; title: string; category?: string }
  host?: Pick<UserProfile, 'id' | 'name' | 'email'>
  attendanceCount?: number
  registered?: boolean
  enrolled?: boolean
  canManage?: boolean
  canEnterRoom?: boolean
}

export type AuthResponse = {
  accessToken: string
  user: UserProfile
}

export type AdminStats = {
  students: number
  tutors: number
  admins: number
  courses: number
  publishedCourses: number
  enrollments: number
  upcomingClasses: number
}

export type AdminUser = UserProfile & {
  createdAt?: string
  _count?: { enrollments: number; coursesTaught: number }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ef_token')
}

export function normalizeRole(role: Role): 'Student' | 'Tutor' | 'Admin' {
  if (role === 'Instructor') return 'Tutor'
  return role
}

export function homeForRole(role: Role) {
  const r = normalizeRole(role)
  if (r === 'Admin') return '/admin'
  if (r === 'Tutor') return '/tutor'
  return '/student'
}

export function setAuth(token: string, user: UserProfile) {
  localStorage.setItem('ef_token', token)
  localStorage.setItem('ef_user', JSON.stringify({ ...user, role: normalizeRole(user.role) }))
}

export function clearAuth() {
  localStorage.removeItem('ef_token')
  localStorage.removeItem('ef_user')
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('ef_user')
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as UserProfile
    return { ...user, role: normalizeRole(user.role) }
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || res.statusText
    throw new Error(message)
  }

  return data as T
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  register: (body: { email: string; password: string; name?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<UserProfile>('/users/me'),
  updateProfile: (body: { name?: string; headline?: string; bio?: string }) =>
    request<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean; message: string }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  adminStats: () => request<AdminStats>('/users/stats'),
  adminUsers: () => request<AdminUser[]>('/users'),
  setUserRole: (id: string, role: Role) =>
    request<UserProfile>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: normalizeRole(role) }),
    }),
  adminResetPassword: (id: string, newPassword: string) =>
    request<{ ok: boolean }>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),
  adminUpdateUser: (
    id: string,
    body: { name?: string; email?: string; newPassword?: string },
  ) => request<UserProfile>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  courses: (opts?: { category?: string; q?: string }) => {
    const params = new URLSearchParams()
    if (opts?.category) params.set('category', opts.category)
    if (opts?.q) params.set('q', opts.q)
    const qs = params.toString()
    return request<Course[]>(qs ? `/courses?${qs}` : '/courses')
  },
  course: (id: string) => request<Course>(`/courses/${id}`),
  myCourses: () => request<Course[]>('/courses/mine'),
  taughtCourses: () => request<Course[]>('/courses/taught'),
  enroll: (id: string) => request(`/courses/${id}/enroll`, { method: 'POST' }),
  createCourse: (body: {
    title: string
    description: string
    category?: string
    level?: string
    priceCents?: number
    published?: boolean
  }) => request<Course>('/courses', { method: 'POST', body: JSON.stringify(body) }),
  updateCourse: (
    id: string,
    body: Partial<{
      title: string
      description: string
      category: string
      level: string
      priceCents: number
      published: boolean
    }>,
  ) => request<Course>(`/courses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCourse: (id: string) => request(`/courses/${id}`, { method: 'DELETE' }),
  addLesson: (
    courseId: string,
    body: {
      title: string
      content: string
      order?: number
      durationMinutes?: number
      videoUrl?: string
    },
  ) => request<Lesson>(`/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(body) }),
  classes: () => request<VirtualClass[]>('/classes'),
  myClasses: () => request<VirtualClass[]>('/classes/mine'),
  class: (id: string) => request<VirtualClass>(`/classes/${id}`),
  createClass: (body: {
    courseId: string
    title: string
    description?: string
    startsAt: string
    endsAt: string
    meetingUrl?: string
  }) => request<VirtualClass>('/classes', { method: 'POST', body: JSON.stringify(body) }),
  updateClass: (
    id: string,
    body: Partial<{
      title: string
      description: string
      startsAt: string
      endsAt: string
      meetingUrl: string
      recordingUrl: string
      status: string
    }>,
  ) => request<VirtualClass>(`/classes/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  registerClass: (id: string) => request(`/classes/${id}/register`, { method: 'POST' }),
  enterClass: (id: string) => request<VirtualClass>(`/classes/${id}/enter`, { method: 'POST' }),
  startInstantMeeting: (body: {
    courseId: string
    title?: string
    description?: string
    durationMinutes?: number
  }) =>
    request<VirtualClass>('/classes/instant', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  classRoster: (id: string) => request<ClassRoster>(`/classes/${id}/roster`),
  myProgress: () =>
    request<Array<{ courseId: string; title: string; category: string; total: number; completed: number; percent: number }>>(
      '/progress/me',
    ),
  completeLesson: (lessonId: string) =>
    request<{ certificate?: Certificate | null }>(`/lessons/${lessonId}/complete`, {
      method: 'POST',
    }),
  courseAssignments: (courseId: string) =>
    request<Assignment[]>(`/courses/${courseId}/assignments`),
  createAssignment: (body: {
    courseId: string
    title: string
    instructions: string
    dueAt?: string
    maxPoints?: number
  }) => request<Assignment>('/assignments', { method: 'POST', body: JSON.stringify(body) }),
  submitAssignment: (id: string, body: { content: string; linkUrl?: string }) =>
    request(`/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(body) }),
  assignmentSubmissions: (id: string) => request(`/assignments/${id}/submissions`),
  gradeSubmission: (id: string, body: { grade: number; feedback?: string }) =>
    request(`/submissions/${id}/grade`, { method: 'PATCH', body: JSON.stringify(body) }),
  challenges: (category?: string) =>
    request<Challenge[]>(
      category ? `/challenges?category=${encodeURIComponent(category)}` : '/challenges',
    ),
  challenge: (slug: string) => request<Challenge>(`/challenges/${slug}`),
  submitFlag: (slug: string, flag: string) =>
    request<{ ok: boolean; message: string; points: number }>(`/challenges/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ flag }),
    }),
  leaderboard: () => request<LeaderboardRow[]>('/challenges/leaderboard'),
  createChallenge: (body: {
    title: string
    category: string
    description: string
    flag: string
    hint?: string
    difficulty?: string
    points?: number
    courseId?: string
  }) => request<Challenge>('/challenges', { method: 'POST', body: JSON.stringify(body) }),
  myChallenges: () => request(`/challenges/mine`),
  notifications: () => request<AppNotification[]>('/notifications'),
  unreadNotifications: () => request<{ count: number }>('/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ ok: boolean }>('/notifications/read', { method: 'PATCH' }),
  courseReviews: (courseId: string) =>
    request<{ average: number; count: number; reviews: CourseReview[] }>(
      `/courses/${courseId}/reviews`,
    ),
  postReview: (courseId: string, body: { rating: number; comment?: string }) =>
    request(`/courses/${courseId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  courseAnnouncements: (courseId: string) =>
    request<CourseAnnouncement[]>(`/courses/${courseId}/announcements`),
  createAnnouncement: (body: { courseId: string; title: string; body: string }) =>
    request('/announcements', { method: 'POST', body: JSON.stringify(body) }),
  addResource: (body: { lessonId: string; title: string; url: string; kind?: string }) =>
    request<LessonResource>('/resources', { method: 'POST', body: JSON.stringify(body) }),
  myCertificates: () => request<Certificate[]>('/certificates/mine'),
  claimCertificate: (courseId: string) =>
    request<Certificate>(`/courses/${courseId}/certificate`, { method: 'POST' }),
  getCertificate: (code: string) => request<Certificate>(`/certificates/${code}`),
}

export function formatPrice(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const CATEGORIES = [
  'Cybersecurity',
  'Software Engineering',
  'Cloud',
  'Networking',
  'Data',
  'Career',
] as const

export const CTF_CATEGORIES = ['Pwn', 'Web', 'Crypto', 'Forensics', 'Reverse', 'Misc'] as const
