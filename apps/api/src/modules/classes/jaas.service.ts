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

  private privateKey() {
    const raw = process.env.JAAS_PRIVATE_KEY || ''
    return raw.replace(/\\n/g, '\n').trim()
  }

  isConfigured() {
    return Boolean(this.appId() && this.keyId() && this.privateKey())
  }

  roomNameForClass(classId: string) {
    return `EchoFreelance-${classId}`
  }

  /** Base meeting URL stored on VirtualClass (no JWT — tokens are per-user). */
  meetingUrlForClass(classId: string) {
    const appId = this.appId()
    if (!appId) {
      throw new ServiceUnavailableException('Live classroom is not configured (JAAS_APP_ID)')
    }
    return `https://8x8.vc/${appId}/${this.roomNameForClass(classId)}`
  }

  buildParticipantToken(user: AuthUser, classId: string, isModerator: boolean) {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Live classroom is not configured. Set JAAS_APP_ID, JAAS_API_KEY_ID, and JAAS_PRIVATE_KEY.',
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
      room,
      context: {
        user: {
          id: user.id,
          name: user.name || user.email,
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

    const token = jwt.sign(payload, this.privateKey(), {
      algorithm: 'RS256',
      header: {
        alg: 'RS256',
        kid: this.keyId(),
        typ: 'JWT',
      },
    })

    const roomUrl = `https://8x8.vc/${appId}/${room}?jwt=${token}`
    return { token, roomUrl, room }
  }

  isHostRole(user: AuthUser, hostId: string) {
    return user.id === hostId || user.role === Role.Admin
  }
}
