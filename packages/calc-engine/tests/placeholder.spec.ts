import { describe, expect, it } from 'vitest'
import { placeholder } from '../src/index'

describe('placeholder', () => {
  it('returns default building inputs', () => {
    expect(placeholder()).toEqual({
      climateZone: '0',
      designTemperatureDifference: 0,
    })
  })
})
