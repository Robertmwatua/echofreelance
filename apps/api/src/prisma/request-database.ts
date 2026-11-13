import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Workers TCP connections must belong to the request that created them.
export const requestDatabase = new AsyncLocalStorage<PrismaClient>()

export function createDatabaseClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL must be configured')
  return new PrismaClient({ adapter: new PrismaPg({
    connectionString,
    max: process.env.CLOUDFLARE_WORKER === 'true' ? 2 : 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  }) })
}
