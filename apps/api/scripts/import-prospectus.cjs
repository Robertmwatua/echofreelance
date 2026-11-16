// Additive import only: never seeds, deletes, or overwrites existing courses.
const path = require('node:path')
const { PrismaClient } = require('@prisma/client')
const manifest = require('../prisma/prospectus-courses.json')
const apply = process.argv.includes('--apply')
const email = process.argv.find(a => a.startsWith('--owner='))?.slice(8)
if (!email) throw new Error('Pass --owner=existing-tutor@example.com')
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true })
const prisma = new PrismaClient()
async function main() {
  const owner = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } })
  if (!owner || !['Tutor', 'Admin'].includes(owner.role)) throw new Error('Owner must be an existing Tutor or Admin. No account or role was changed.')
  await prisma.$transaction(async tx => {
    const existing = await tx.course.findMany({ select: { title: true } })
    const titles = new Set(existing.map(c => c.title.trim().toLowerCase()))
    const missing = manifest.filter(c => !titles.has(c.title.trim().toLowerCase()))
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', programs: manifest.length, existing: manifest.length - missing.length, toCreate: missing.map(c => c.title) }, null, 2))
    if (apply) {
      await tx.course.createMany({ data: missing.map(course => ({
        title: course.title,
        category: course.pathway,
        description: `${course.description}\n\n${course.pathway}. Listed in the Eco Freelance Tech School prospectus. Fees, duration, intake dates and lesson content are awaiting confirmation.`,
        level: 'Not specified',
        priceCents: 0, // Required schema field; unpublished until real pricing is confirmed.
        published: false,
        tutorId: owner.id,
      })) })
      console.log(`Created ${missing.length} unpublished drafts; existing courses were left unchanged.`)
    }
  }, { timeout: 20000 })
}
main().catch(e => { console.error(e.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database URL redacted]')); process.exitCode = 1 }).finally(() => prisma.$disconnect())
