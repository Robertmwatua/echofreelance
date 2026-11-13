import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as validator from 'class-validator'
import * as transformer from 'class-transformer'

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api')
  const origins = (process.env.CORS_ORIGINS || (process.env.NODE_ENV === 'production' ? 'https://echofreelance-web.vercel.app' : 'http://localhost:3000')).split(',').map(s => s.trim()).filter(Boolean)
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0)
  if (Number.isInteger(proxyHops) && proxyHops > 0) app.getHttpAdapter().getInstance().set('trust proxy', proxyHops)
  app.enableCors({ origin: origins, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true, validatorPackage: validator, transformerPackage: transformer }))
}
