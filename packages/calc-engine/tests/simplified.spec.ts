import { describe, expect, it } from 'vitest'
import { calculateSimplifiedManualJ } from '../src'
import type { ManualJInputs } from '../src/types'
import simplifiedCase from './golden/case-simplified.json'

describe('Simplified Manual J calculations', () => {
  it('calculates load for medium-sized home', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const results = calculateSimplifiedManualJ(inputs)

    expect(results.sensible).toBeGreaterThan(simplifiedCase.expected.sensible.min)
    expect(results.sensible).toBeLessThan(simplifiedCase.expected.sensible.max)
    expect(results.latent).toBeGreaterThan(simplifiedCase.expected.latent.min)
    expect(results.latent).toBeLessThan(simplifiedCase.expected.latent.max)
    expect(results.total).toBeGreaterThan(simplifiedCase.expected.total.min)
    expect(results.total).toBeLessThan(simplifiedCase.expected.total.max)
    expect(results.tonnage).toBeGreaterThanOrEqual(simplifiedCase.expected.tonnage.min)
    expect(results.tonnage).toBeLessThanOrEqual(simplifiedCase.expected.tonnage.max)
    expect(results.cfm).toBeGreaterThanOrEqual(simplifiedCase.expected.cfm.min)
    expect(results.cfm).toBeLessThanOrEqual(simplifiedCase.expected.cfm.max)
  })

  it('returns proper breakdown structure', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const results = calculateSimplifiedManualJ(inputs)

    expect(results.breakdown).toBeDefined()
    expect(results.breakdown.conduction).toBeDefined()
    expect(results.breakdown.conduction.walls).toBeGreaterThan(0)
    expect(results.breakdown.conduction.roof).toBeGreaterThan(0)
    expect(results.breakdown.conduction.windows).toBeGreaterThan(0)
    expect(results.breakdown.solar).toBeGreaterThan(0)
    expect(results.breakdown.infiltration).toBeGreaterThan(0)
    expect(results.breakdown.internalGains).toBeGreaterThan(0)
    expect(results.breakdown.ductLosses).toBeGreaterThanOrEqual(0)
  })

  it('rounds tonnage to nearest 0.5 ton', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const results = calculateSimplifiedManualJ(inputs)

    expect(results.tonnage % 0.5).toBe(0)
  })

  it('rounds CFM to nearest 50', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const results = calculateSimplifiedManualJ(inputs)

    expect(results.cfm % 50).toBe(0)
  })

  it('increases load with higher design temperature', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const baseResults = calculateSimplifiedManualJ(inputs)

    const hotterInputs: ManualJInputs = {
      ...inputs,
      climate: {
        ...inputs.climate,
        summerDesignTemp: 105,
      },
    }
    const hotterResults = calculateSimplifiedManualJ(hotterInputs)

    expect(hotterResults.total).toBeGreaterThan(baseResults.total)
  })

  it('increases load with lower wall R-value', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const baseResults = calculateSimplifiedManualJ(inputs)

    const lowerRInputs: ManualJInputs = {
      ...inputs,
      envelope: {
        ...inputs.envelope,
        wallR: 7,
      },
    }
    const lowerRResults = calculateSimplifiedManualJ(lowerRInputs)

    expect(lowerRResults.breakdown.conduction.walls).toBeGreaterThan(
      baseResults.breakdown.conduction.walls,
    )
  })

  it('increases solar gain with higher SHGC', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const baseResults = calculateSimplifiedManualJ(inputs)

    const higherShgcInputs: ManualJInputs = {
      ...inputs,
      envelope: {
        ...inputs.envelope,
        windowSHGC: 0.7,
      },
    }
    const higherShgcResults = calculateSimplifiedManualJ(higherShgcInputs)

    expect(higherShgcResults.breakdown.solar).toBeGreaterThan(
      baseResults.breakdown.solar,
    )
  })

  it('increases infiltration load with loose construction', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const baseResults = calculateSimplifiedManualJ(inputs)

    const looseInputs: ManualJInputs = {
      ...inputs,
      infiltration: {
        ...inputs.infiltration,
        class: 'loose',
      },
    }
    const looseResults = calculateSimplifiedManualJ(looseInputs)

    expect(looseResults.breakdown.infiltration).toBeGreaterThan(
      baseResults.breakdown.infiltration,
    )
  })

  it('increases duct losses when ducts are in unconditioned space', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs

    const conditionedInputs: ManualJInputs = {
      ...inputs,
      ducts: {
        location: 'conditioned',
        efficiency: 0.85,
      },
    }
    const conditionedResults = calculateSimplifiedManualJ(conditionedInputs)

    const unconditionedInputs: ManualJInputs = {
      ...inputs,
      ducts: {
        location: 'unconditioned',
        efficiency: 0.85,
      },
    }
    const unconditionedResults = calculateSimplifiedManualJ(unconditionedInputs)

    expect(unconditionedResults.breakdown.ductLosses).toBeGreaterThan(
      conditionedResults.breakdown.ductLosses,
    )
  })

  it('increases internal gains with more occupants', () => {
    const inputs = simplifiedCase.inputs as ManualJInputs
    const baseResults = calculateSimplifiedManualJ(inputs)

    const moreOccupantsInputs: ManualJInputs = {
      ...inputs,
      internal: {
        ...inputs.internal,
        occupants: 8,
      },
    }
    const moreOccupantsResults = calculateSimplifiedManualJ(moreOccupantsInputs)

    expect(moreOccupantsResults.breakdown.internalGains).toBeGreaterThan(
      baseResults.breakdown.internalGains,
    )
  })
})





