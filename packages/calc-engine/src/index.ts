export interface BuildingInputs {
  climateZone: string
  designTemperatureDifference: number
}

export function placeholder(): BuildingInputs {
  return {
    climateZone: '0',
    designTemperatureDifference: 0,
  }
}
