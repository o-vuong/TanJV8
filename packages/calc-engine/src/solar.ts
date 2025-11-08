import type { Orientation, SolarFactors, WindowAssembly } from './types'

interface SolarGainBreakdown {
  windowId: string
  orientation: Orientation
  area: number
  solarLoad: number
  components: {
    shgc: number
    orientationFactor: number
    shadingFactor: number
    clfFactor: number
  }
}

export interface SolarGainResults {
  total: number
  breakdown: SolarGainBreakdown[]
}

export function calculateSolarGain(
  windows: WindowAssembly[],
  solarFactors: SolarFactors,
  hour = 15,
): SolarGainResults {
  const results = windows.map((window) => {
    const orientationFactor = solarFactors.orientationFactors[window.orientation] ?? 1
    const shadingFactor = window.shading?.factor ?? 1
    const clfFactor = solarFactors.coolingLoadFactors[hour] ?? 1
    const solarLoad = window.area * window.shgc * orientationFactor * shadingFactor * clfFactor

    return {
      windowId: window.id,
      orientation: window.orientation,
      area: window.area,
      solarLoad,
      components: {
        shgc: window.shgc,
        orientationFactor,
        shadingFactor,
        clfFactor,
      },
    }
  })

  const total = results.reduce((sum, result) => sum + result.solarLoad, 0)

  return { total, breakdown: results }
}
