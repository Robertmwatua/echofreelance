import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { requestDatabase } from './request-database'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 5 }) })
    // Keep existing typed services while resolving a fresh database client for each Worker event.
    return new Proxy(this, {
      get(target, property, receiver) {
        const scoped = requestDatabase.getStore()
        if (scoped && property !== 'onModuleInit' && property !== 'onModuleDestroy') {
          const value = Reflect.get(scoped, property, scoped)
          return typeof value === 'function' ? value.bind(scoped) : value
        }
        return Reflect.get(target, property, receiver)
      },
    })
  }

  async onModuleInit() {
    if (process.env.CLOUDFLARE_WORKER !== 'true') await this.$connect()
  }

  async onModuleDestroy() {
    if (process.env.CLOUDFLARE_WORKER !== 'true') await this.$disconnect()
  }
}
