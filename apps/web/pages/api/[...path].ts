import type { NextApiRequest, NextApiResponse } from 'next'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const config = { api: { bodyParser: false, responseLimit: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { env } = getCloudflareContext()
  const api = (env as unknown as { API: { fetch: typeof fetch } }).API
  if (!api) return res.status(503).json({ message: 'The API service is not configured.' })
  const headers = new Headers()
  for (const name of ['authorization', 'content-type', 'accept', 'cf-connecting-ip']) {
    const value = req.headers[name]
    if (typeof value === 'string') headers.set(name, value)
  }
  // Do not forward cookies or browser-supplied forwarding headers.
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += data.length
    if (size > 1024 * 1024) return res.status(413).json({ message: 'Request body is too large.' })
    chunks.push(data)
  }
  const method = req.method || 'GET'
  try {
    const response = await api.fetch(new Request(`https://api.internal${req.url}`, {
      method, headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : Buffer.concat(chunks),
      redirect: 'manual',
    }))
    res.status(response.status)
    for (const name of ['content-type', 'retry-after']) {
      const value = response.headers.get(name)
      if (value) res.setHeader(name, value)
    }
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(Buffer.from(await response.arrayBuffer()))
  } catch {
    res.status(502).json({ message: 'The learning service is temporarily unavailable. Please try again.' })
  }
}
