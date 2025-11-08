import { describe, expect, it } from 'vitest'
import { calculateManualJ } from '../src'
import smallCase from './golden/case-small.json'

describe('Manual J golden cases', () => {
  it('matches expected output for small house', () => {
    const results = calculateManualJ(smallCase.inputs)
    expect(results.coolingLoad.total).toBeCloseTo(smallCase.expected.cooling.total, -1)
    expect(results.coolingLoad.sensible).toBeCloseTo(smallCase.expected.cooling.sensible, -1)
    expect(results.coolingLoad.latent).toBeCloseTo(smallCase.expected.cooling.latent, -1)
    expect(results.equipmentSizing.cooling.tonnage).toBeCloseTo(smallCase.expected.cooling.tonnage)
    expect(results.heatingLoad.total).toBeCloseTo(smallCase.expected.heating.total, -1)
  })

  it('reduces conduction load when R-value increases', () => {
    const lowR = calculateManualJ({
      ...smallCase.inputs,
      walls: smallCase.inputs.walls.map((wall) => ({ ...wall, rValue: wall.rValue / 2 })),
    })

    const highR = calculateManualJ({
      ...smallCase.inputs,
      walls: smallCase.inputs.walls.map((wall) => ({ ...wall, rValue: wall.rValue * 1.5 })),
    })

    expect(lowR.coolingLoad.total).toBeGreaterThan(highR.coolingLoad.total)
  })

  it('increases solar load with higher SHGC', () => {
    const lowShgc = calculateManualJ({
      ...smallCase.inputs,
      windows: smallCase.inputs.windows.map((window) => ({ ...window, shgc: 0.3 })),
    })

    const highShgc = calculateManualJ({
      ...smallCase.inputs,
      windows: smallCase.inputs.windows.map((window) => ({ ...window, shgc: 0.8 })),
    })

    expect(highShgc.coolingLoad.total).toBeGreaterThan(lowShgc.coolingLoad.total)
  })
})
