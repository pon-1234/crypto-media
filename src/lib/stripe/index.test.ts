import { describe, it, expect } from 'vitest'
import * as stripeExports from './index'

describe('stripe/index.ts', () => {
  it('stripe と MONTHLY_PRICE_ID をエクスポートする', () => {
    expect(stripeExports).toHaveProperty('stripe')
    expect(stripeExports).toHaveProperty('MONTHLY_PRICE_ID')
  })
})