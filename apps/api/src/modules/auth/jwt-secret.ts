import { ConfigService } from '@nestjs/config'

export function jwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET')
  if (config.get<string>('NODE_ENV') === 'production' && (!secret || secret.length < 32 || secret === 'change_me_to_a_strong_secret')) {
    throw new Error('Production requires a JWT_SECRET of at least 32 characters')
  }
  return secret || 'dev-secret'
}
