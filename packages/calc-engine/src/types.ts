// Simplified Manual J Input Types
export interface ManualJInputs {
  area: number
  climateRefId: string
  envelope: {
    wallArea: number
    wallR: number
    roofArea: number
    roofR: number
    windowArea: number
    windowU: number
    windowSHGC: number
  }
  infiltration: {
    class: 'tight' | 'average' | 'loose'
    volume: number
  }
  internal: {
    occupants: number
    lighting: number // watts
    appliances: number // watts
  }
  ducts: {
    location: 'conditioned' | 'unconditioned'
    efficiency: number // 0-1
  }
  climate: {
    summerDesignTemp: number
    winterDesignTemp: number
    indoorTemp: number
  }
}

// Simplified Manual J Results Types
export interface LoadBreakdown {
  conduction: {
    walls: number
    roof: number
    windows: number
  }
  solar: number
  infiltration: number
  internalGains: number
  ductLosses: number
}

export interface ManualJResults {
  sensible: number
  latent: number
  total: number
  tonnage: number // rounded to nearest 0.5
  cfm: number // rounded to nearest 50
  breakdown: LoadBreakdown
}

// Legacy types kept for backward compatibility during migration
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

export interface LoadResults {
  sensible: number
  latent: number
  total: number
  breakdown: {
    conduction: number
    solar: number
    infiltration: number
    internalGains: number
    ductLosses: number
  }
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
