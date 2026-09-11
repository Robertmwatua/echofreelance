import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Role } from '@prisma/client'
import * as jwt from 'jsonwebtoken'
import { AuthUser } from '../../common/current-user.decorator'

@Injectable()
export class JaasService {
  private appId() {
    return process.env.JAAS_APP_ID?.trim() || ''
  }

  private keyId() {
    return process.env.JAAS_API_KEY_ID?.trim() || ''
  }

  /** Normalize PEM from Render/env (quotes, literal \\n, missing headers). */
  private privateKey() {
    let raw = process.env.JAAS_PRIVATE_KEY || ''
    raw = raw.trim()
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1)
    }
    raw = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n').trim()

    const isPkcs1 = /BEGIN RSA PRIVATE KEY/.test(raw)
    const isPkcs8 = /BEGIN PRIVATE KEY/.test(raw) && !isPkcs1

    if (!isPkcs1 && !isPkcs8 && raw.length > 80) {
      const body = raw.replace(/\s+/g, '')
      const lines = body.match(/.{1,64}/g)?.join('\n') || body
      // 8x8 JaaS keys are usually PKCS#8
      raw = `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`
    }

    return raw
  }

  isConfigured() {
    const key = this.privateKey()
    return Boolean(
      this.appId() &&
        this.keyId() &&
        key.includes('BEGIN') &&
        key.includes('PRIVATE KEY'),
    )
  }

  roomNameForClass(classId: string) {
    return `EchoFreelance-${classId}`
  }

  meetingUrlForClass(classId: string) {
    const appId = this.appId()
    if (!appId) {
      throw new ServiceUnavailableException(
        'Live classroom is not configured (missing JAAS_APP_ID on the API).',
      )
    }
    return `https://8x8.vc/${appId}/${this.roomNameForClass(classId)}`
  }

  buildParticipantToken(user: AuthUser, classId: string, isModerator: boolean) {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Live classroom is not configured. Set JAAS_APP_ID, JAAS_API_KEY_ID, and JAAS_PRIVATE_KEY on the API (Render).',
      )
    }

    const appId = this.appId()
    const now = Math.floor(Date.now() / 1000)
    const room = this.roomNameForClass(classId)

    const payload = {
      aud: 'jitsi',
      iss: 'chat',
      iat: now,
      nbf: now - 10,
      exp: now + 60 * 60 * 3,
      sub: appId,
      room: '*',
      context: {
        user: {
          id: user.id,
          name: user.name || user.email.split('@')[0] || 'Host',
          email: user.email,
          moderator: isModerator ? 'true' : 'false',
        },
        features: {
          livestreaming: false,
          recording: isModerator,
          transcription: false,
          'outbound-call': false,
        },
      },
    }

    let token: string
    try {
      token = jwt.sign(payload, this.privateKey(), {
        algorithm: 'RS256',
        header: {
          alg: 'RS256',
          kid: this.keyId(),
          typ: 'JWT',
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'JWT sign failed'
      throw new ServiceUnavailableException(
        `Could not sign live-classroom token. On Render, set JAAS_PRIVATE_KEY to the full PEM (BEGIN/END lines), with newlines as \\n. (${msg})`,
      )
    }

    // JWT uses room: '*'; URL still targets this class room
    const roomUrl = `https://8x8.vc/${appId}/${room}?jwt=${token}`
    return { token, roomUrl, room }
  }

  /** Safe diagnostics for tutors — never returns secret material. */
  status() {
    const key = this.privateKey()
    return {
      configured: this.isConfigured(),
      appIdSet: Boolean(this.appId()),
      keyIdSet: Boolean(this.keyId()),
      privateKeyLooksValid: key.includes('BEGIN') && key.includes('PRIVATE KEY'),
      privateKeyLineCount: key ? key.split('\n').length : 0,
    }
  }

  isHostRole(user: AuthUser, hostId: string) {
    return user.id === hostId || user.role === Role.Admin
  }
}
