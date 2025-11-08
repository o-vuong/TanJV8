export type Orientation = 'north' | 'south' | 'east' | 'west' | 'northeast' | 'southeast' | 'southwest' | 'northwest'

export interface WallAssembly {
  id: string
  area: number
  rValue: number
  orientation: Orientation
}

export interface WindowAssembly {
  id: string
  area: number
  rValue: number
  shgc: number
  orientation: Orientation
  shading?: {
    factor: number
  }
}

export interface DoorAssembly {
  id: string
  area: number
  rValue: number
  orientation: Orientation
}

export interface RoofAssembly {
  id: string
  area: number
  rValue: number
}

export interface FoundationAssembly {
  id: string
  area: number
  rValue: number
}

export interface OccupancyInputs {
  count: number
  sensibleGainPerPerson: number
  latentGainPerPerson: number
}

export interface LightingInputs {
  totalWattage: number
}

export interface ApplianceInput {
  type: string
  wattage: number
  usageFactor: number
}

export type ApplianceInputs = ApplianceInput[]

export interface DuctworkInputs {
  location: 'conditioned' | 'unconditioned' | 'exterior'
  insulation: 'none' | 'minimal' | 'standard' | 'high'
}

export interface DiversityFactors {
  occupancy: number
  lighting: number
  appliances: Record<string, number>
}

export interface SolarFactors {
  orientationFactors: Record<Orientation, number>
  coolingLoadFactors: Record<number, number>
}

export interface BuildingInputs {
  climateZone: string
  designTemperatureDifference: number
  buildingVolume: number
  infiltrationClass: 'tight' | 'average' | 'loose'
  windSpeed: number
  stackEffect: number
  solarFactors: SolarFactors
  walls: WallAssembly[]
  windows: WindowAssembly[]
  doors: DoorAssembly[]
  roof: RoofAssembly
  foundation: FoundationAssembly
  occupancy: OccupancyInputs
  lighting: LightingInputs
  appliances: ApplianceInputs
  ductwork: DuctworkInputs
  diversityFactors: DiversityFactors
}

export interface LoadBreakdown {
  conduction: number
  solar: number
  infiltration: number
  internalGains: number
  ductLosses: number
}

export interface LoadResults {
  sensible: number
  latent: number
  total: number
  breakdown: LoadBreakdown
}

export interface VentilationResults {
  cfm: number
  freshAirRequirement: number
}

export interface EquipmentSizing {
  cooling: {
    btuh: number
    tonnage: number
  }
  heating: {
    btuh: number
  }
  airflow: {
    cfm: number
  }
}

export interface CalculationSummary {
  totalCoolingCapacity: number
  totalHeatingCapacity: number
  airflowRequirement: number
  efficiencyMetrics: {
    sensibleHeatRatio: number
    latentFraction: number
  }
}

export interface CalculationResults {
  coolingLoad: LoadResults
  heatingLoad: LoadResults
  ventilationRequirements: VentilationResults
  equipmentSizing: EquipmentSizing
  summary: CalculationSummary
}
