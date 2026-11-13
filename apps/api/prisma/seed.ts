import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const host = new URL(process.env.DATABASE_URL || '').hostname
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', 'db', '::1', '[::1]'].includes(host)) {
    throw new Error('Development seed is destructive and is blocked for production or remote databases')
  }
  await prisma.discussionPost.deleteMany()
  await prisma.lessonNote.deleteMany()
  await prisma.challengeSolve.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.courseReview.deleteMany()
  await prisma.courseAnnouncement.deleteMany()
  await prisma.lessonResource.deleteMany()
  await prisma.assignmentSubmission.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.classAttendance.deleteMany()
  await prisma.virtualClass.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  await prisma.user.create({
    data: {
      email: 'admin@echofreelance.dev',
      name: 'Campus Admin',
      role: Role.Admin,
      passwordHash,
      headline: 'School administration',
    },
  })

  await prisma.user.create({
    data: {
      email: 'tutor@echofreelance.dev',
      name: 'Lead Tutor',
      role: Role.Tutor,
      passwordHash,
      headline: 'Cybersecurity & cloud',
      bio: 'Create courses and live classes from the Tutor desk.',
    },
  })

  await prisma.user.create({
    data: {
      email: 'student@echofreelance.dev',
      name: 'Demo Student',
      role: Role.Student,
      passwordHash,
      headline: 'Learner',
    },
  })

  console.log('Seed complete — campus accounts ready (no sample courses).')
  console.log('  admin@echofreelance.dev / password123')
  console.log('  tutor@echofreelance.dev / password123')
  console.log('  student@echofreelance.dev / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
