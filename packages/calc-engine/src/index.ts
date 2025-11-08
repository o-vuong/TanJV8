import { calculateConduction } from './conduction'
import { calculateSolarGain } from './solar'
import { calculateInfiltration } from './infiltration'
import { calculateInternalGains } from './internal'
import { calculateDuctLosses } from './ducts'
import type {
  BuildingInputs,
  CalculationResults,
  EquipmentSizing,
  LoadResults,
  CalculationSummary,
  VentilationResults,
} from './types'

function calculateHeatingLoad(inputs: BuildingInputs): LoadResults {
  const deltaT = inputs.designTemperatureDifference
  const conduction = calculateConduction(
    [...inputs.walls, ...inputs.windows, ...inputs.doors, inputs.roof, inputs.foundation],
    deltaT,
  )
  const infiltration = calculateInfiltration(
    inputs.buildingVolume,
    inputs.infiltrationClass,
    inputs.windSpeed,
    inputs.stackEffect,
    deltaT,
  )
  const internal = calculateInternalGains(
    inputs.occupancy,
    inputs.lighting,
    inputs.appliances,
    inputs.diversityFactors,
  )
  const sensible = conduction + infiltration.sensibleLoad + internal.total.sensible * 0.4
  const latent = infiltration.latentLoad + internal.total.latent * 0.2
  const total = sensible + latent
  return {
    sensible,
    latent,
    total,
    breakdown: {
      conduction,
      solar: 0,
      infiltration: infiltration.sensibleLoad,
      internalGains: internal.total.sensible,
      ductLosses: 0,
    },
  }
}

function calculateVentilationRequirements(inputs: BuildingInputs): VentilationResults {
  const baseCfm = Math.max(60, inputs.buildingVolume * 0.01)
  return {
    cfm: Math.round(baseCfm),
    freshAirRequirement: Math.round(baseCfm * 1.3),
  }
}

function calculateEquipmentSizing({
  coolingLoad,
  heatingLoad,
  ventilationLoad,
}: {
  coolingLoad: number
  heatingLoad: number
  ventilationLoad: number
}): EquipmentSizing {
  const coolingTonnage = Math.ceil((coolingLoad / 12000) * 2) / 2
  return {
    cooling: {
      btuh: coolingLoad,
      tonnage: coolingTonnage,
    },
    heating: {
      btuh: heatingLoad,
    },
    airflow: {
      cfm: Math.round(coolingTonnage * 400 + ventilationLoad),
    },
  }
}

function calculateEfficiencyMetrics(sensible: number, latent: number) {
  const total = sensible + latent
  const sensibleHeatRatio = total === 0 ? 0 : sensible / total
  const latentFraction = total === 0 ? 0 : latent / total
  return {
    sensibleHeatRatio: Number(sensibleHeatRatio.toFixed(2)),
    latentFraction: Number(latentFraction.toFixed(2)),
  }
}

export function calculateManualJ(inputs: BuildingInputs): CalculationResults {
  const deltaT = inputs.designTemperatureDifference

  const conductionTotal = calculateConduction(
    [...inputs.walls, ...inputs.windows, ...inputs.doors, inputs.roof, inputs.foundation],
    deltaT,
  )

  const solarResults = calculateSolarGain(inputs.windows, inputs.solarFactors, 15)

  const infiltrationResults = calculateInfiltration(
    inputs.buildingVolume,
    inputs.infiltrationClass,
    inputs.windSpeed,
    inputs.stackEffect,
    deltaT,
  )

  const internalResults = calculateInternalGains(
    inputs.occupancy,
    inputs.lighting,
    inputs.appliances,
    inputs.diversityFactors,
  )

  const sensibleLoad =
    conductionTotal +
    solarResults.total +
    infiltrationResults.sensibleLoad +
    internalResults.total.sensible

  const latentLoad = infiltrationResults.latentLoad + internalResults.total.latent

  const ductResults = calculateDuctLosses(sensibleLoad + latentLoad, inputs.ductwork)

  const coolingResults: LoadResults = {
    sensible: sensibleLoad,
    latent: latentLoad,
    total: ductResults.totalLoadWithDucts,
    breakdown: {
      conduction: conductionTotal,
      solar: solarResults.total,
      infiltration: infiltrationResults.sensibleLoad,
      internalGains: internalResults.total.sensible,
      ductLosses: ductResults.ductLosses,
    },
  }

  const heatingResults = calculateHeatingLoad(inputs)
  const ventilationRequirements = calculateVentilationRequirements(inputs)
  const equipmentSizing = calculateEquipmentSizing({
    coolingLoad: coolingResults.total,
    heatingLoad: heatingResults.total,
    ventilationLoad: ventilationRequirements.cfm,
  })

  const summary: CalculationSummary = {
    totalCoolingCapacity: equipmentSizing.cooling.tonnage,
    totalHeatingCapacity: equipmentSizing.heating.btuh,
    airflowRequirement: equipmentSizing.airflow.cfm,
    efficiencyMetrics: calculateEfficiencyMetrics(coolingResults.sensible, coolingResults.latent),
  }

  return {
    coolingLoad: coolingResults,
    heatingLoad: heatingResults,
    ventilationRequirements,
    equipmentSizing,
    summary,
  }
}

export * from './types'
export * from './conduction'
export * from './solar'
export * from './infiltration'
export * from './internal'
export * from './ducts'
