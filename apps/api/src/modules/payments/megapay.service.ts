import { Injectable, ServiceUnavailableException } from '@nestjs/common'

export function normalizePhone(phone: string) {
  const value = phone.replace(/^\+/, '').replace(/^0/, '254')
  if (!/^254[71]\d{8}$/.test(value)) throw new Error('Use a Kenyan M-Pesa number.')
  return value
}

@Injectable()
export class MegapayService {
  configured() { return Boolean(process.env.MEGAPAY_API_KEY && process.env.MEGAPAY_EMAIL) }
  private async call(endpoint: 'initiatestk' | 'transactionstatus', body: Record<string, unknown>) {
    if (!this.configured()) throw new ServiceUnavailableException('M-Pesa is not connected yet. Please contact the school.')
    const response = await fetch(`https://megapay.co.ke/backend/v1/${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.MEGAPAY_API_KEY, email: process.env.MEGAPAY_EMAIL, ...body }),
      signal: AbortSignal.timeout(8000), redirect: 'error',
    })
    if (!response.ok) throw new Error('Payment provider temporarily unavailable')
    return await response.json() as Record<string, unknown>
  }
  initiate(amountKes: number, phone: string, reference: string) {
    return this.call('initiatestk', { amount: amountKes, msisdn: phone, reference })
  }
  status(providerId: string) { return this.call('transactionstatus', { transaction_request_id: providerId }) }
}
