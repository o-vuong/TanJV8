import type { ApplianceInputs, DiversityFactors, LightingInputs, OccupancyInputs } from './types'

export interface InternalGainsResults {
  occupants: {
    sensible: number
    latent: number
    total: number
  }
  lighting: {
    sensible: number
    latent: number
    total: number
  }
  appliances: {
    sensible: number
    latent: number
    total: number
  }
  total: {
    sensible: number
    latent: number
    total: number
  }
}

export function calculateInternalGains(
  occupancy: OccupancyInputs,
  lighting: LightingInputs,
  appliances: ApplianceInputs,
  diversityFactors: DiversityFactors,
): InternalGainsResults {
  const occupantSensible = occupancy.count * occupancy.sensibleGainPerPerson * diversityFactors.occupancy
  const occupantLatent = occupancy.count * occupancy.latentGainPerPerson * diversityFactors.occupancy

  const lightingLoad = lighting.totalWattage * 3.41 * diversityFactors.lighting

  const applianceLoad = appliances.reduce((total, appliance) => {
    const diversity = diversityFactors.appliances[appliance.type] ?? 1
    return total + appliance.wattage * 3.41 * appliance.usageFactor * diversity
  }, 0)

  const applianceSensible = applianceLoad * 0.8
  const applianceLatent = applianceLoad * 0.2

  return {
    occupants: {
      sensible: occupantSensible,
      latent: occupantLatent,
      total: occupantSensible + occupantLatent,
    },
    lighting: {
      sensible: lightingLoad,
      latent: 0,
      total: lightingLoad,
    },
    appliances: {
      sensible: applianceSensible,
      latent: applianceLatent,
      total: applianceLoad,
    },
    total: {
      sensible: occupantSensible + lightingLoad + applianceSensible,
      latent: occupantLatent + applianceLatent,
      total: occupantSensible + occupantLatent + lightingLoad + applianceLoad,
    },
  }
}
