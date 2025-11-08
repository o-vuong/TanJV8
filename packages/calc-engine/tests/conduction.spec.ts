import { describe, expect, it } from 'vitest'
import { calculateConduction, calculateWallConduction } from '../src/conduction'
import type { WallAssembly } from '../src/types'

describe('conduction calculations', () => {
  const wall: WallAssembly = {
    id: 'wall-1',
    area: 100,
    rValue: 20,
    orientation: 'north',
  }

  it('calculates load using Q = U × A × ΔT', () => {
    const deltaT = 25
    const expected = (1 / 20) * 100 * 25
    expect(calculateConduction([wall], deltaT)).toBe(expected)
  })

  it('throws when R-value is zero', () => {
    expect(() =>
      calculateConduction(
        [
          {
            ...wall,
            rValue: 0,
          },
        ],
        30,
      ),
    ).toThrow('R-value cannot be zero or negative')
  })

  it('provides wall breakdown totals', () => {
    const result = calculateWallConduction(
      [
        wall,
        {
          ...wall,
          id: 'wall-2',
          area: 80,
          rValue: 15,
        },
      ],
      30,
    )

    expect(result.breakdown).toHaveLength(2)
    expect(result.total).toBeCloseTo(310)
  })
})
