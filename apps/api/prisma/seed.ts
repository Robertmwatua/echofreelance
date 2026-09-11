import { ChallengeCategory, PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  await prisma.challengeSolve.deleteMany()
  await prisma.assignmentSubmission.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.lessonProgress.deleteMany()
  await prisma.classAttendance.deleteMany()
  await prisma.virtualClass.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.course.deleteMany()

  await prisma.user.upsert({
    where: { email: 'admin@echofreelance.dev' },
    update: {
      role: Role.Admin,
      name: 'Campus Admin',
      headline: 'School administrator',
      passwordHash,
    },
    create: {
      email: 'admin@echofreelance.dev',
      name: 'Campus Admin',
      role: Role.Admin,
      passwordHash,
      headline: 'School administrator',
    },
  })

  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@echofreelance.dev' },
    update: {
      role: Role.Tutor,
      name: 'Maya Okonkwo',
      headline: 'Cybersecurity tutor',
      bio: 'Create courses, labs, and CTF challenges from the Tutor desk.',
      passwordHash,
    },
    create: {
      email: 'tutor@echofreelance.dev',
      name: 'Maya Okonkwo',
      role: Role.Tutor,
      passwordHash,
      headline: 'Cybersecurity tutor',
      bio: 'Create courses, labs, and CTF challenges from the Tutor desk.',
    },
  })

  await prisma.user.upsert({
    where: { email: 'student@echofreelance.dev' },
    update: {
      role: Role.Student,
      name: 'Jordan Blake',
      headline: 'Student',
      passwordHash,
    },
    create: {
      email: 'student@echofreelance.dev',
      name: 'Jordan Blake',
      role: Role.Student,
      passwordHash,
      headline: 'Student',
    },
  })

  // Starter CTF board (tutors can add more). Flags are hashed.
  const challenges = [
    {
      title: 'Warmup: Echo Flag',
      slug: 'warmup-echo-flag',
      category: ChallengeCategory.Misc,
      difficulty: 'Easy',
      points: 50,
      description:
        'Welcome to the campus CTF. The flag is literally written here for onboarding: EF{welcome_to_campus}. Submit it to score.',
      hint: 'Copy the flag from the description.',
      flag: 'EF{welcome_to_campus}',
    },
    {
      title: 'Pwn: Stack Snack',
      slug: 'pwn-stack-snack',
      category: ChallengeCategory.Pwn,
      difficulty: 'Easy',
      points: 100,
      description:
        'Classic buffer overflow mindset challenge (theory lab). Imagine a vulnerable `gets()` binary. The “win” string for this exercise is EF{stack_smashing_detected}. No remote binary required — practice the workflow.',
      hint: 'Think overflow → control EIP → win().',
      flag: 'EF{stack_smashing_detected}',
    },
    {
      title: 'Web: Hidden Parameter',
      slug: 'web-hidden-parameter',
      category: ChallengeCategory.Web,
      difficulty: 'Easy',
      points: 100,
      description:
        'You find `?debug=false` on a campus portal. Flip the mental switch — the intended flag for this lab is EF{idor_is_not_a_feature}.',
      hint: 'Inspect params / force browse.',
      flag: 'EF{idor_is_not_a_feature}',
    },
    {
      title: 'Crypto: Caesar Shift',
      slug: 'crypto-caesar-shift',
      category: ChallengeCategory.Crypto,
      difficulty: 'Easy',
      points: 75,
      description:
        'Ciphertext: `LM{jhlzhy_pz_uv_ylhs_zljyla}`. Decode with ROT-7.',
      hint: 'ROT-7: L→E, M→F…',
      flag: 'EF{caesar_is_no_real_secret}',
    },
  ]

  for (const ch of challenges) {
    await prisma.challenge.create({
      data: {
        title: ch.title,
        slug: ch.slug,
        category: ch.category,
        difficulty: ch.difficulty,
        points: ch.points,
        description: ch.description,
        hint: ch.hint,
        flagHash: await bcrypt.hash(ch.flag, 10),
        published: true,
        authorId: tutor.id,
      },
    })
  }

  console.log('Seed complete — accounts + starter CTF board (no courses).')
  console.log('  admin@echofreelance.dev / password123')
  console.log('  tutor@echofreelance.dev / password123')
  console.log('  student@echofreelance.dev / password123')
  console.log('CTF flags use EF{...} format — try /challenges')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
