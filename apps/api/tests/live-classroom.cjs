const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const { JaasService } = require('../dist/modules/classes/jaas.service')
const { ClassesService } = require('../dist/modules/classes/classes.service')
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' })
const user = { id: 'student', email: 'student@example.test', name: 'Student', role: 'Student' }

function configure() {
  process.env.JAAS_APP_ID = 'vpaas-magic-cookie-test'
  process.env.JAAS_API_KEY_ID = 'vpaas-magic-cookie-test/key'
  process.env.JAAS_PRIVATE_KEY = pem
}

test('signed participants are scoped to one literal room and students are not moderators', () => {
  configure()
  const service = new JaasService()
  const result = service.buildParticipantToken(user, 'class-1', false)
  const payload = jwt.verify(result.token, publicKey, { algorithms: ['RS256'], audience: 'jitsi', issuer: 'chat' })
  assert.equal(payload.room, 'EchoFreelance-class-1')
  assert.equal(payload.context.room.regex, false)
  assert.equal(payload.context.user.moderator, 'false')
  assert.equal(payload.context.features.recording, false)
  assert.equal(new URL(result.roomUrl).searchParams.get('jwt'), result.token)
})

test('escaped PEM signs correctly; mismatched app/key ids fail configuration', () => {
  configure()
  process.env.JAAS_PRIVATE_KEY = `"${pem.replace(/\n/g, '\\n')}"`
  const service = new JaasService()
  assert.equal(service.isConfigured(), true)
  assert.doesNotThrow(() => service.buildParticipantToken(user, 'class-1', true))
  process.env.JAAS_API_KEY_ID = 'another-app/key'
  assert.equal(service.isConfigured(), false)
  assert.throws(() => service.buildParticipantToken(user, 'class-1', false))
})

test('non-RSA keys are rejected before any meeting is created', () => {
  configure()
  const keys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  process.env.JAAS_PRIVATE_KEY = keys.privateKey.export({ type: 'pkcs8', format: 'pem' })
  assert.equal(new JaasService().isConfigured(), false)
})

function mockRoom(detail, sign = () => ({ roomUrl: 'https://8x8.vc/app/room?jwt=signed' })) {
  const writes = []
  const prisma = {
    virtualClass: { update: async args => { writes.push(['class', args]); return args } },
    classAttendance: { upsert: async args => { writes.push(['attendance', args]); return args } },
  }
  const jaas = { isHostRole: u => u.role === 'Admin' || u.id === 'host', buildParticipantToken: sign, meetingUrlForClass: () => 'https://8x8.vc/app/room' }
  const service = new ClassesService(prisma, {}, jaas)
  service.findOne = async () => ({ endsAt: new Date(Date.now() + 3600000), host: { id: 'host' }, meetingUrl: 'https://8x8.vc/app/room', ...detail })
  return { service, writes }
}

test('ended and cancelled rooms refuse admission without writes', async () => {
  for (const detail of [{ status: 'Completed' }, { status: 'Cancelled' }, { status: 'Live', endsAt: new Date(0) }]) {
    const { service, writes } = mockRoom({ canEnterRoom: true, ...detail })
    await assert.rejects(service.enterRoom('class-1', user), /ended or was cancelled/)
    assert.equal(writes.length, 0)
  }
})

test('registered students wait for tutor; failed signing leaves status and attendance unchanged', async () => {
  const waiting = mockRoom({ status: 'Scheduled', registered: true, canEnterRoom: false })
  await assert.rejects(waiting.service.enterRoom('class-1', user), /tutor has not started/)
  assert.equal(waiting.writes.length, 0)
  const broken = mockRoom({ status: 'Scheduled', canEnterRoom: true }, () => { throw new Error('signing failed') })
  await assert.rejects(broken.service.enterRoom('class-1', { ...user, id: 'host', role: 'Tutor' }), /signing failed/)
  assert.equal(broken.writes.length, 0)
})

test('authorized host starts a scheduled room with moderator token', async () => {
  let moderator
  const { service, writes } = mockRoom({ status: 'Scheduled', canEnterRoom: true }, (u, id, mod) => { moderator = mod; return { roomUrl: 'signed-room' } })
  const result = await service.enterRoom('class-1', { ...user, id: 'host', role: 'Tutor' })
  assert.equal(result.status, 'Live')
  assert.equal(moderator, true)
  assert.equal(writes[0][1].data.status, 'Live')
})

test('registration alone does not let students start a scheduled class', async () => {
  const detail = { id: 'class-1', courseId: 'course-1', hostId: 'host', status: 'Scheduled', endsAt: new Date(Date.now() + 3600000), course: {}, host: { id: 'host' }, _count: { attendances: 1 } }
  const service = new ClassesService({ virtualClass: { findUnique: async () => detail }, enrollment: { findUnique: async () => ({}) }, classAttendance: { findUnique: async () => ({}) } }, {}, {})
  assert.equal((await service.findOne('class-1', user)).canEnterRoom, false)
  detail.status = 'Live'
  assert.equal((await service.findOne('class-1', user)).canEnterRoom, true)
})
