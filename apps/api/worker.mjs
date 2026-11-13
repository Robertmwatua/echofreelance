import 'reflect-metadata'
import { handleAsNodeRequest } from 'cloudflare:node'
import { NestFactory } from '@nestjs/core'
import { ExpressAdapter } from '@nestjs/platform-express'
import { AppModule } from './dist/app.module.js'
import { configureApp } from './dist/configure-app.js'
import { createDatabaseClient, requestDatabase } from './dist/prisma/request-database.js'
import { NotificationsService } from './dist/modules/notifications/notifications.service.js'

let application
async function getApplication() {
  if (!application) {
    application = (async () => {
      const app = await NestFactory.create(AppModule, new ExpressAdapter(), { logger: ['error', 'warn'], abortOnError: false })
      configureApp(app)
      await app.listen(8080)
      return app
    })().catch(error => { application = undefined; throw error })
  }
  return application
}

async function withDatabase(work) {
  const client = createDatabaseClient()
  try { return await requestDatabase.run(client, work) }
  finally { await client.$disconnect() }
}

export default {
  async fetch(request) {
    const app = await getApplication()
    return withDatabase(async () => {
      // Only Cloudflare's trusted edge header supplies the client IP; ignore forwarded spoofing.
      const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1'
      const headers = new Headers(request.headers)
      headers.set('X-Forwarded-For', ip)
      const response = await handleAsNodeRequest(8080, new Request(request, { headers }))
      // Complete the Node response inside its database scope before releasing connections.
      return new Response(await response.arrayBuffer(), { status: response.status, statusText: response.statusText, headers: response.headers })
    })
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil((async () => {
      const app = await getApplication()
      await withDatabase(() => app.get(NotificationsService).deliverDue())
    })())
  },
}
