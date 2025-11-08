import type { DoorAssembly, FoundationAssembly, RoofAssembly, WallAssembly, WindowAssembly } from './types'

interface ConductionResult {
  id: string
  load: number
}

function calculateAssemblyLoad(area: number, rValue: number, deltaT: number): number {
  if (area <= 0) return 0
  if (rValue <= 0) {
    throw new Error('R-value cannot be zero or negative')
  }
  const uValue = 1 / rValue
  return uValue * area * deltaT
}

export function calculateConduction(
  assemblies: Array<WallAssembly | WindowAssembly | DoorAssembly | RoofAssembly | FoundationAssembly>,
  deltaT: number,
): number {
  return assemblies.reduce((total, assembly) => {
    return total + calculateAssemblyLoad(assembly.area, assembly.rValue, deltaT)
  }, 0)
}

export function calculateWallConduction(walls: WallAssembly[], deltaT: number): {
  total: number
  breakdown: ConductionResult[]
} {
  const breakdown = walls.map((wall) => ({
    id: wall.id,
    load: calculateAssemblyLoad(wall.area, wall.rValue, deltaT),
  }))
  const total = breakdown.reduce((sum, item) => sum + item.load, 0)
  return { total, breakdown }
}
