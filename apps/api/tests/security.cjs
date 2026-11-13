const { test } = require('node:test')
const assert = require('node:assert/strict')
const { requireCourseAccess } = require('../dist/common/course-access')
const { AssignmentsService } = require('../dist/modules/assignments/assignments.service')
const { CampusService } = require('../dist/modules/campus/campus.service')
const { JwtStrategy } = require('../dist/modules/auth/jwt.strategy')
const { jwtSecret } = require('../dist/modules/auth/jwt-secret')
const { AuthRateGuard } = require('../dist/modules/auth/auth-rate.guard')
const { UsersService } = require('../dist/modules/users/users.service')
const bcrypt = require('bcryptjs')
const student = { id: 'student', role: 'Student', email: 'student@example.test' }
const tutor = { id: 'owner', role: 'Tutor', email: 'owner@example.test' }
const config = { get: key => key === 'JWT_SECRET' ? 'x'.repeat(64) : 'production' }
const course = { id: 'c1', tutorId: 'owner', published: true }
function db(enrolled = false) { return { course: { findUnique: async () => course }, enrollment: { findUnique: async () => enrolled ? {} : null } } }

test('course materials require enrollment or ownership, not just Tutor role', async () => {
  await assert.rejects(requireCourseAccess(db(), 'c1', null), /Sign in/)
  await assert.rejects(requireCourseAccess(db(), 'c1', { ...tutor, id: 'other' }), /Enroll/)
  assert.equal((await requireCourseAccess(db(), 'c1', tutor)).canManage, true)
  assert.equal((await requireCourseAccess(db(true), 'c1', student)).canManage, false)
})

test('assignment drafts are only returned to course managers', async () => {
  let query
  const prisma = db(true)
  prisma.assignment = { findMany: async args => { query = args; return [] } }
  const service = new AssignmentsService(prisma, {})
  await service.listForCourse('c1', { ...tutor, id: 'other' })
  assert.equal(query.where.published, true)
  await service.listForCourse('c1', tutor)
  assert.equal(query.where.published, undefined)
})

test('grades exceeding assignment maximum never reach a database write', async () => {
  let written = false
  const service = new AssignmentsService({ assignmentSubmission: { findUnique: async () => ({ assignment: { maxPoints: 20, course: { tutorId: 'owner' } } }), update: async () => { written = true } } }, {})
  await assert.rejects(service.grade('s1', tutor, { grade: 21 }), /maximum/)
  assert.equal(written, false)
})

test('lesson resources cannot bypass enrollment; public certificate excludes email', async () => {
  const prisma = db()
  prisma.lesson = { findUnique: async () => ({ courseId: 'c1' }) }
  const service = new CampusService(prisma, {})
  await assert.rejects(service.listResources('l1', student), /Enroll/)
  let query
  prisma.certificate = { findUnique: async args => { query = args; return { code: 'cert' } } }
  await service.getCertificate('cert')
  assert.equal(query.include.user.select.email, undefined)
})

test('revoked and malformed login tokens are rejected', async () => {
  const strategy = new JwtStrategy(config, { user: { findUnique: async () => ({ ...student, sessionVersion: 2 }) } })
  await assert.rejects(strategy.validate({ sub: 'student', version: 1 }), /Session revoked/)
  await assert.rejects(strategy.validate({ version: 2 }), /Unauthorized/)
  assert.equal((await strategy.validate({ sub: 'student', version: 2 })).id, 'student')
})

test('password changes increment session version; incorrect current password is not a 401', async () => {
  let update
  const service = new UsersService({ user: { findUnique: async () => ({ passwordHash: await bcrypt.hash('old-password', 4) }), update: async args => { update = args } } })
  await assert.rejects(service.changePassword('student', { currentPassword: 'incorrect-password', newPassword: 'new-password' }), err => err.getStatus() === 400)
  await service.changePassword('student', { currentPassword: 'old-password', newPassword: 'new-password' })
  assert.deepEqual(update.data.sessionVersion, { increment: 1 })
})

test('production refuses missing/weak JWT secrets', () => {
  assert.throws(() => jwtSecret({ get: key => key === 'NODE_ENV' ? 'production' : 'short' }), /32 characters/)
  assert.equal(jwtSecret(config), 'x'.repeat(64))
})

test('authentication rate limit returns 429 and retry information', () => {
  const guard = new AuthRateGuard()
  const headers = {}
  const context = { switchToHttp: () => ({ getRequest: () => ({ ip: '127.0.0.1', socket: {} }), getResponse: () => ({ setHeader: (k, v) => { headers[k] = v } }) }) }
  for (let i = 0; i < 10; i++) assert.equal(guard.canActivate(context), true)
  assert.throws(() => guard.canActivate(context), err => err.getStatus() === 429)
  assert.ok(Number(headers['Retry-After']) > 0)
})

test('priced courses cannot be unlocked with an unpaid enrollment request', async () => {
  const { CoursesService } = require('../dist/modules/courses/courses.service')
  const service = new CoursesService({ course: { findFirst: async () => ({ priceCents: 1000 }) } }, {})
  await assert.rejects(service.enroll('c1', 'student'), /verified payment/)
})
