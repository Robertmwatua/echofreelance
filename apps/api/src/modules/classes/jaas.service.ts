import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { Role } from '@prisma/client'
import * as crypto from 'crypto'
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

  /**
   * Rebuild a clean PEM from whatever Render/env mangling happened.
   * Accepts: multiline PEM, single-line with \n, body-only base64, quoted values.
   */
  private normalizePem(rawInput: string): string {
    let raw = (rawInput || '').trim()
    if (
      (raw.startsWith('"') && raw.endsWith('"')) ||
      (raw.startsWith("'") && raw.endsWith("'"))
    ) {
      raw = raw.slice(1, -1).trim()
    }
    // Render / dotenv often store real newlines as the two chars \ + n
    raw = raw.replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\r\n/g, '\n').trim()

    if (/BEGIN\s+PUBLIC\s+KEY/.test(raw) || /BEGIN\s+RSA\s+PUBLIC\s+KEY/.test(raw)) {
      throw new ServiceUnavailableException(
        'JAAS_PRIVATE_KEY looks like a PUBLIC key. Paste the private key file (.key / .pem with BEGIN PRIVATE KEY), not the .pub file.',
      )
    }

    if (/BEGIN\s+OPENSSH\s+PRIVATE\s+KEY/.test(raw)) {
      throw new ServiceUnavailableException(
        'JAAS_PRIVATE_KEY is OpenSSH format. Convert to PEM: openssl rsa -in key -out key.pem  (or generate a PEM key pair for JaaS).',
      )
    }

    let label = 'PRIVATE KEY'
    if (/BEGIN\s+RSA\s+PRIVATE\s+KEY/.test(raw)) {
      label = 'RSA PRIVATE KEY'
    }

    const beginRe = /-----BEGIN [^-]+-----/
    const endRe = /-----END [^-]+-----/
    const begin = raw.match(beginRe)
    const end = raw.match(endRe)

    let body: string
    if (begin && end) {
      body = raw.slice(begin.index! + begin[0].length, end.index).replace(/\s+/g, '')
    } else {
      // Body-only paste from JaaS / openssl
      body = raw.replace(/\s+/g, '')
    }

    if (!body || body.length < 80) {
      throw new ServiceUnavailableException(
        'JAAS_PRIVATE_KEY is too short or empty. Paste the full private key from your JaaS key pair (usually 4096-bit RSA PEM).',
      )
    }

    // Reject obvious non-base64 junk (e.g. pasted Key ID / App ID)
    if (!/^[A-Za-z0-9+/=]+$/.test(body)) {
      throw new ServiceUnavailableException(
        'JAAS_PRIVATE_KEY is not valid base64 PEM content. Re-copy the private key file from JaaS / openssl.',
      )
    }

    const lines = body.match(/.{1,64}/g) || [body]
    return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`
  }

  private privateKeyPem() {
    return this.normalizePem(process.env.JAAS_PRIVATE_KEY || '')
  }

  /** Parsed KeyObject — what jsonwebtoken needs for RS256. */
  private privateKeyObject(): crypto.KeyObject {
    const pem = this.privateKeyPem()
    try {
      return crypto.createPrivateKey({ key: pem, format: 'pem' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'invalid key'
      // Try PKCS#1 ↔ PKCS#8 label swap once (common paste mismatch)
      try {
        const swapped = pem.includes('RSA PRIVATE KEY')
          ? pem
              .replace('BEGIN RSA PRIVATE KEY', 'BEGIN PRIVATE KEY')
              .replace('END RSA PRIVATE KEY', 'END PRIVATE KEY')
          : pem
              .replace('BEGIN PRIVATE KEY', 'BEGIN RSA PRIVATE KEY')
              .replace('END PRIVATE KEY', 'END RSA PRIVATE KEY')
        return crypto.createPrivateKey({ key: swapped, format: 'pem' })
      } catch {
        throw new ServiceUnavailableException(
          `JAAS_PRIVATE_KEY could not be parsed as an RSA private key (${msg}). On Render, paste the full PEM private key (BEGIN/END), then Manual Deploy.`,
        )
      }
    }
  }

  isConfigured() {
    if (!this.appId() || !this.keyId() || !(process.env.JAAS_PRIVATE_KEY || '').trim()) {
      return false
    }
    try {
      this.privateKeyObject()
      return true
    } catch {
      return false
    }
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
    if (!this.appId() || !this.keyId()) {
      throw new ServiceUnavailableException(
        'Live classroom is not configured. Set JAAS_APP_ID, JAAS_API_KEY_ID, and JAAS_PRIVATE_KEY on the API (Render).',
      )
    }

    const key = this.privateKeyObject()
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
      token = jwt.sign(payload, key, {
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
        `Could not sign live-classroom token (${msg}). Check JAAS_PRIVATE_KEY is the RSA private key matching your JaaS API key id.`,
      )
    }

    const roomUrl = `https://8x8.vc/${appId}/${room}?jwt=${token}`
    return { token, roomUrl, room }
  }

  /** Safe diagnostics — never returns secret material. */
  status() {
    const raw = process.env.JAAS_PRIVATE_KEY || ''
    let privateKeyParseOk = false
    let privateKeyHint = 'not set'
    let privateKeyLineCount = 0

    if (!raw.trim()) {
      privateKeyHint = 'missing'
    } else if (/PUBLIC KEY/.test(raw)) {
      privateKeyHint = 'looks like PUBLIC key — need private key'
    } else if (/OPENSSH/.test(raw)) {
      privateKeyHint = 'OpenSSH format — convert to PEM'
    } else {
      try {
        const pem = this.normalizePem(raw)
        privateKeyLineCount = pem.split('\n').length
        crypto.createPrivateKey({ key: pem, format: 'pem' })
        privateKeyParseOk = true
        privateKeyHint = 'ok'
      } catch (err) {
        privateKeyHint =
          err instanceof ServiceUnavailableException
            ? String((err.getResponse() as { message?: string }).message || err.message)
            : err instanceof Error
              ? err.message
              : 'parse failed'
      }
    }

    return {
      configured: this.isConfigured(),
      appIdSet: Boolean(this.appId()),
      keyIdSet: Boolean(this.keyId()),
      privateKeySet: Boolean(raw.trim()),
      privateKeyParseOk,
      privateKeyHint,
      privateKeyLineCount,
      privateKeyCharCount: raw.trim().length,
    }
  }

  isHostRole(user: AuthUser, hostId: string) {
    return user.id === hostId || user.role === Role.Admin
  }
}
