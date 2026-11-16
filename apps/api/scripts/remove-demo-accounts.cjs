// Target only the original seeded identities; preserve school content and never reset data.
const path = require('node:path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()
const apply = process.argv.includes('--apply')
const removeAdmin = process.argv.includes('--remove-admin')
async function main() {
  const result = await prisma.$transaction(async tx => {
    const owner = await tx.user.findUnique({ where: { email: 'favourmwatua@gmail.com' } })
    if (!owner || !['Tutor', 'Admin'].includes(owner.role)) throw new Error('The real school owner must exist as Tutor or Admin.')
    const emails = ['tutor@echofreelance.dev', 'student@echofreelance.dev', ...(removeAdmin ? ['admin@echofreelance.dev'] : [])]
    const users = await tx.user.findMany({ where: { email: { in: emails } }, include: { _count: true } })
    if (removeAdmin && owner.role !== 'Admin') throw new Error('A real administrator is required before deleting the seeded administrator.')
    for (const u of users) {
      if (!await bcrypt.compare('password123', u.passwordHash)) throw new Error(`Account ${u.email} no longer uses its seed password; inspect manually.`)
      const permitted = new Set(['coursesTaught','hostedClasses','challengesCreated','notifications','classAttendances'])
      if (Object.entries(u._count).some(([key, count]) => count > 0 && !permitted.has(key))) throw new Error(`Account ${u.email} has activity requiring review.`)
    }
    if (apply) for (const u of users) {
      await tx.course.updateMany({ where: { tutorId: u.id }, data: { tutorId: owner.id } })
      await tx.virtualClass.updateMany({ where: { hostId: u.id }, data: { hostId: owner.id } })
      await tx.challenge.updateMany({ where: { authorId: u.id }, data: { authorId: owner.id } })
      await tx.user.delete({ where: { id: u.id } })
    }
    return { mode: apply ? 'apply' : 'dry-run', accounts: users.map(u => u.email), coursesPreserved: users.reduce((n,u) => n + u._count.coursesTaught,0), classesPreserved: users.reduce((n,u) => n + u._count.hostedClasses,0), challengesPreserved: users.reduce((n,u) => n + u._count.challengesCreated,0) }
  }, { timeout: 30000 })
  console.log(JSON.stringify(result,null,2))
}
main().catch(e => { console.error(e.message); process.exitCode=1 }).finally(() => prisma.$disconnect())
