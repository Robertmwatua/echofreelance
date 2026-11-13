const test = require('node:test')
const assert = require('node:assert/strict')
const { requestDatabase } = require('../dist/prisma/request-database')
const { PrismaService } = require('../dist/prisma/prisma.service')

test('concurrent Worker events use their own database client through singleton services', async () => {
  const service = new PrismaService()
  const first = { user: { findUnique: async () => ({ id: 'first' }) }, $transaction: async function () { return this.user.findUnique() } }
  const second = { user: { findUnique: async () => ({ id: 'second' }) }, $transaction: async function () { return this.user.findUnique() } }
  let release
  const barrier = new Promise(resolve => { release = resolve })
  const one = requestDatabase.run(first, async () => {
    await barrier
    assert.equal((await service.user.findUnique({})).id, 'first')
    assert.equal((await service.$transaction()).id, 'first')
  })
  const two = requestDatabase.run(second, async () => {
    assert.equal((await service.user.findUnique({})).id, 'second')
    release()
    await Promise.resolve()
    assert.equal((await service.user.findUnique({})).id, 'second')
  })
  await Promise.all([one, two])
  assert.equal(requestDatabase.getStore(), undefined)
  await service.$disconnect()
})

test('database event scope is cleared after a failed request', async () => {
  await assert.rejects(requestDatabase.run({}, async () => { throw new Error('request failed') }), /request failed/)
  assert.equal(requestDatabase.getStore(), undefined)
})
