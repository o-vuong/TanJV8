import type { DuctworkInputs } from './types'

export interface DuctLossResults {
  ductLosses: number
  totalLoadWithDucts: number
  lossFactor: number
  breakdown: {
    location: DuctworkInputs['location']
    insulation: DuctworkInputs['insulation']
    locationFactor: number
    insulationReduction: number
  }
}

const LOCATION_FACTORS: Record<DuctworkInputs['location'], number> = {
  conditioned: 0.05,
  unconditioned: 0.15,
  exterior: 0.25,
}

const INSULATION_FACTORS: Record<DuctworkInputs['insulation'], number> = {
  none: 1,
  minimal: 0.8,
  standard: 0.6,
  high: 0.4,
}

export function calculateDuctLosses(
  systemLoad: number,
  ductwork: DuctworkInputs,
): DuctLossResults {
  const locationFactor = LOCATION_FACTORS[ductwork.location]
  const insulationFactor = INSULATION_FACTORS[ductwork.insulation]
  const lossFactor = locationFactor * insulationFactor
  const ductLosses = systemLoad * lossFactor
  return {
    ductLosses,
    totalLoadWithDucts: systemLoad + ductLosses,
    lossFactor,
    breakdown: {
      location: ductwork.location,
      insulation: ductwork.insulation,
      locationFactor,
      insulationReduction: 1 - insulationFactor,
    },
  }
}
