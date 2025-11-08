export interface InfiltrationResults {
  airChangesPerHour: number
  volumetricFlowRate: number
  sensibleLoad: number
  latentLoad: number
  totalLoad: number
  breakdown: {
    stackEffect: number
    windEffect: number
    infiltrationClass: 'tight' | 'average' | 'loose'
  }
}

const BASE_RATES: Record<'tight' | 'average' | 'loose', number> = {
  tight: 0.25,
  average: 0.5,
  loose: 1.0,
}

function getAirChangesPerHour(
  infiltrationClass: 'tight' | 'average' | 'loose',
  windSpeed: number,
  stackEffect: number,
): number {
  const base = BASE_RATES[infiltrationClass]
  const windFactor = 1 + windSpeed * 0.02
  const stackFactor = 1 + Math.abs(stackEffect) * 0.01
  return base * windFactor * stackFactor
}

function calculateHumidityDifference(stackEffect: number): number {
  const base = 0.003
  return base + Math.abs(stackEffect) * 0.0002
}

function calculateStackEffectComponent(volume: number, stackEffect: number): number {
  return volume * Math.abs(stackEffect) * 0.02
}

function calculateWindEffectComponent(volume: number, windSpeed: number): number {
  return volume * windSpeed * 0.01
}

export function calculateInfiltration(
  buildingVolume: number,
  infiltrationClass: 'tight' | 'average' | 'loose',
  windSpeed: number,
  stackEffect: number,
  deltaT: number,
): InfiltrationResults {
  const ach = getAirChangesPerHour(infiltrationClass, windSpeed, stackEffect)
  const volumetricFlowRate = (buildingVolume * ach) / 60
  const airDensity = 0.075
  const specificHeat = 0.24

  const sensibleLoad = volumetricFlowRate * airDensity * specificHeat * deltaT
  const humidityDifference = calculateHumidityDifference(stackEffect)
  const latentHeat = 1076
  const latentLoad = volumetricFlowRate * airDensity * humidityDifference * latentHeat

  return {
    airChangesPerHour: ach,
    volumetricFlowRate,
    sensibleLoad,
    latentLoad,
    totalLoad: sensibleLoad + latentLoad,
    breakdown: {
      stackEffect: calculateStackEffectComponent(buildingVolume, stackEffect),
      windEffect: calculateWindEffectComponent(buildingVolume, windSpeed),
      infiltrationClass,
    },
  }
}
