// ============================================================================
// MANUAL J HVAC LOAD CALCULATION ENGINE - PROFESSIONAL EDITION
// ACCA Manual J 8th Edition Compliant with CLTD Method, Psychrometrics, and Solar Calculations
// ============================================================================

// PSYCHROMETRIC CONSTANTS
const PSYCHROMETRIC = {
  // 1.08 BTU/hr per CFM per °F (sensible heat)
  sensibleCfmFactor: 1.08,
  // 4840 BTU/hr per CFM per grains of moisture (latent heat)
  latentCfmFactor: 4840,
  // Standard air density at sea level, 70°F
  airDensity: 0.075, // lb/ft³
  // Specific heat of air
  specificHeat: 0.24, // BTU/lb·°F
} as const;

// ============================================================================
// SOLAR HEAT GAIN COEFFICIENTS (SHGC)
// ============================================================================

export interface SolarData {
  latitude: number;
  elevation: number;
  month: number;
  cloudCover: "clear" | "partly_cloudy" | "cloudy";
  surfaceOrientation: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "H";
}

// ACCA Manual J solar radiation data (Btu/h·ft²) - based on ASHRAE clear-sky tables
const ACCA_SOLAR_RADIATION: Record<string, number[]> = {
  N: [22, 28, 40, 55, 75, 88, 85, 73, 55, 42, 28, 20],
  NE: [52, 62, 80, 95, 105, 113, 112, 103, 88, 76, 60, 48],
  E: [87, 99, 120, 125, 125, 128, 130, 125, 118, 110, 95, 80],
  SE: [102, 108, 120, 120, 110, 110, 115, 120, 125, 125, 110, 95],
  S: [95, 105, 110, 105, 90, 85, 95, 110, 125, 130, 115, 98],
  SW: [80, 95, 110, 120, 125, 125, 120, 112, 100, 95, 85, 75],
  W: [48, 65, 90, 110, 125, 130, 125, 110, 88, 70, 55, 45],
  NW: [22, 35, 58, 82, 105, 118, 112, 90, 62, 42, 28, 18],
  H: [180, 190, 210, 220, 230, 235, 230, 220, 200, 180, 165, 160],
};

// CLTD (Cooling Load Temperature Difference) for walls & roofs
// Varies by construction type, orientation, and time of day
export interface CLTDData {
  constructionType: "light" | "medium" | "heavy";
  orientation: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "H";
  timeOfPeakLoad: number; // 3 PM standard
}

const CLTD_WALLS: Record<string, number[][]> = {
  light: [
    [11, 10, 9, 8, 8, 9, 11, 14, 17, 19, 20, 19], // N
    [11, 10, 10, 10, 11, 13, 16, 19, 21, 21, 20, 18], // NE
    [10, 10, 11, 13, 16, 19, 21, 21, 20, 18, 14, 11], // E
    [9, 9, 11, 14, 17, 19, 20, 19, 17, 14, 11, 9], // SE
    [8, 8, 9, 11, 13, 14, 15, 14, 13, 11, 9, 8], // S
    [9, 9, 10, 12, 14, 16, 17, 17, 15, 12, 10, 9], // SW
    [10, 10, 11, 13, 16, 19, 21, 21, 20, 18, 14, 11], // W
    [11, 11, 12, 14, 17, 20, 22, 21, 19, 16, 13, 11], // NW
  ],
  medium: [
    [11, 10, 9, 8, 8, 9, 11, 13, 15, 17, 18, 17], // N
    [10, 10, 10, 10, 11, 13, 15, 17, 18, 18, 16, 15], // NE
    [9, 9, 10, 12, 15, 17, 18, 18, 17, 15, 12, 10], // E
    [8, 8, 10, 12, 14, 16, 17, 16, 15, 13, 10, 8], // SE
    [7, 7, 8, 9, 11, 12, 13, 12, 11, 9, 8, 7], // S
    [8, 8, 9, 11, 13, 15, 16, 15, 13, 11, 9, 8], // SW
    [9, 9, 10, 12, 15, 17, 18, 18, 17, 15, 12, 10], // W
    [10, 10, 11, 13, 16, 18, 20, 19, 17, 14, 12, 10], // NW
  ],
  heavy: [
    [11, 10, 9, 9, 9, 9, 10, 11, 12, 13, 14, 13], // N
    [10, 10, 10, 10, 10, 11, 12, 13, 14, 14, 13, 12], // NE
    [9, 9, 9, 11, 13, 14, 15, 15, 14, 13, 11, 9], // E
    [8, 8, 9, 10, 12, 13, 14, 13, 12, 11, 9, 8], // SE
    [7, 7, 7, 8, 9, 10, 10, 10, 9, 8, 7, 7], // S
    [8, 8, 8, 10, 12, 13, 14, 13, 12, 10, 8, 8], // SW
    [9, 9, 9, 11, 13, 14, 15, 15, 14, 13, 11, 9], // W
    [10, 10, 10, 12, 14, 15, 16, 16, 15, 13, 11, 10], // NW
  ],
};

// CLTD for roofs (more significant)
const CLTD_ROOFS: Record<string, number[]> = {
  light: [33, 35, 37, 40, 43, 46, 48, 48, 46, 42, 38, 34],
  medium: [28, 30, 32, 35, 37, 40, 41, 41, 39, 36, 32, 29],
  heavy: [20, 21, 23, 25, 27, 28, 29, 28, 27, 25, 23, 20],
};

// ============================================================================
// WINDOW PROPERTIES & SOLAR HEAT GAIN
// ============================================================================

export interface WindowType {
  name: string;
  uValue: number; // BTU/hr·°F·sq ft
  shgc: number; // Solar Heat Gain Coefficient (0-1)
  vt: number; // Visible Transmittance
  frameArea: number; // % of total window area
}

export const WINDOW_TYPES: Record<string, WindowType> = {
  single_clear: {
    name: "Single Pane Clear",
    uValue: 1.04,
    shgc: 0.86,
    vt: 0.87,
    frameArea: 0.15,
  },
  double_clear: {
    name: "Double Pane Clear",
    uValue: 0.48,
    shgc: 0.76,
    vt: 0.81,
    frameArea: 0.15,
  },
  double_lowE_optimized: {
    name: "Double Low-E (Optimized)",
    uValue: 0.31,
    shgc: 0.23,
    vt: 0.51,
    frameArea: 0.15,
  },
  triple_lowE: {
    name: "Triple Low-E",
    uValue: 0.18,
    shgc: 0.27,
    vt: 0.46,
    frameArea: 0.15,
  },
};

// ============================================================================
// CONSTRUCTION TYPES & THERMAL MASS
// ============================================================================

export interface ConstructionAssembly {
  name: string;
  rValue: number; // Total thermal resistance
  mass: number; // Thermal mass (Btu/°F·sq ft) - affects CLTD
  absorptance: number; // Solar absorptance (0-1)
}

export const WALL_CONSTRUCTIONS: Record<string, ConstructionAssembly> = {
  light_frame: {
    name: "Light Wood Frame (R-13)",
    rValue: 13,
    mass: 1.2,
    absorptance: 0.6,
  },
  medium_frame: {
    name: "Medium Wood Frame (R-19)",
    rValue: 19,
    mass: 1.8,
    absorptance: 0.6,
  },
  heavy_concrete: {
    name: "Heavy Concrete (R-10)",
    rValue: 10,
    mass: 12,
    absorptance: 0.8,
  },
};

export const ROOF_CONSTRUCTIONS: Record<string, ConstructionAssembly> = {
  light: {
    name: "Light Wood Joist (R-19)",
    rValue: 19,
    mass: 2,
    absorptance: 0.75,
  },
  medium: {
    name: "Medium Insulation (R-30)",
    rValue: 30,
    mass: 3,
    absorptance: 0.75,
  },
  heavy: {
    name: "Heavy Concrete (R-15)",
    rValue: 15,
    mass: 15,
    absorptance: 0.85,
  },
};

// ============================================================================
// AIR INFILTRATION & EXFILTRATION
// ============================================================================

export interface InfiltrationMethod {
  acH: number; // Air changes per hour at 50 Pa
  cfmPerPerson: number;
  ventilationMinimum: number; // Minimum CFM per ASHRAE 62.2 (referenced by ACCA Manual J)
}

export const INFILTRATION_RATES = {
  tight: { acH: 3, cfmPerPerson: 15, ventilationMinimum: 0.15 },
  average: { acH: 7, cfmPerPerson: 20, ventilationMinimum: 0.2 },
  loose: { acH: 12, cfmPerPerson: 30, ventilationMinimum: 0.3 },
};

// Conversion from 50 Pa to design conditions using n exponent
const INFILTRATION_EXPONENT = 0.65;

function convertInfiltrationRate(
  acH50: number,
  deltaPressure: number,
  designDeltaP: number = 0.1
): number {
  // Indoor/outdoor pressure difference (in Pa)
  const designPa = designDeltaP * 125; // 0.1 in WC ≈ 25 Pa
  return acH50 * Math.pow(designPa / 50, INFILTRATION_EXPONENT);
}

// ============================================================================
// LATENT LOAD CALCULATIONS (PSYCHROMETRIC)
// ============================================================================

export interface PsychrometricPoint {
  dryBulb: number; // °F
  wetBulb: number; // °F
  relativeHumidity: number; // %
  humidity: number; // Grains of moisture per lb dry air
  enthalpy: number; // BTU/lb dry air
  specificVolume: number; // ft³/lb dry air
}

// Magnus formula for humidity ratio
function calculateHumidityRatio(dryBulb: number, wetBulb: number): number {
  const Ws =
    (0.62198 * 6.112 * Math.exp((17.67 * wetBulb) / (243.5 + wetBulb))) /
    (101.325 - 6.112 * Math.exp((17.67 * wetBulb) / (243.5 + wetBulb)));

  const W =
    ((2501 - 2.326 * wetBulb) * Ws - 1.006 * (dryBulb - wetBulb)) /
    (2501 + 1.86 * dryBulb - 4.186 * wetBulb);

  return W * 7000; // Convert to grains/lb
}

// Enthalpy calculation
function calculateEnthalpy(dryBulb: number, humidity: number): number {
  // h = 0.24 * T + W * (1061 + 0.444 * T)
  const W = humidity / 7000; // Convert back to lb/lb
  return 0.24 * dryBulb + W * (1061 + 0.444 * dryBulb);
}

export function getPsychrometricPoint(
  dryBulb: number,
  relativeHumidity: number
): PsychrometricPoint {
  // Saturation pressure
  const Psat = 6.112 * Math.exp((17.67 * dryBulb) / (243.5 + dryBulb));
  const P = (relativeHumidity / 100) * Psat;

  // Humidity ratio
  const W = (0.62198 * P) / (101.325 - P);
  const humidity = W * 7000; // Grains/lb

  // Wet bulb (iterative approximation)
  let wetBulb = dryBulb;
  for (let i = 0; i < 5; i++) {
    const Ws = 6.112 * Math.exp((17.67 * wetBulb) / (243.5 + wetBulb));
    const numerator =
      (2501 - 2.326 * wetBulb) * (0.62198 * Ws) / (101.325 - Ws) -
      1.006 * (dryBulb - wetBulb);
    const denominator = 2501 + 1.86 * dryBulb - 4.186 * wetBulb;
    wetBulb = dryBulb - numerator / denominator;
  }

  const enthalpy = calculateEnthalpy(dryBulb, humidity);
  const specificVolume = 13.33 * (1 + W) * (273.15 + (dryBulb * 5) / 9) / 288.15;

  return {
    dryBulb,
    wetBulb,
    relativeHumidity,
    humidity,
    enthalpy,
    specificVolume,
  };
}

// ============================================================================
// COMPONENT DEFINITIONS
// ============================================================================

export interface SurfaceComponent {
  id: string;
  name: string;
  area: number; // sq ft
  uValue: number; // BTU/hr·°F·sq ft
  construction?: ConstructionAssembly;
}

export interface OpaqueComponent extends SurfaceComponent {
  orientation: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "H";
  absorptance: number;
}

export interface WindowComponent extends SurfaceComponent {
  windowType: WindowType;
  orientation: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "H";
  shading?: {
    internalShading: number; // 0-1
    externalShading: number; // 0-1
    interiorHeatGain: number; // 0-1 (fraction entering space)
  };
  frameFraction: number; // 0-1
}

export interface DoorComponent extends SurfaceComponent {
  orientation: "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "H";
  glazed: boolean; // Glass doors vs solid
  absorptance: number;
}

// ============================================================================
// INTERNAL HEAT GAINS
// ============================================================================

export interface InternalHeatGain {
  source: string;
  sensible: number; // BTU/hr
  latent: number; // BTU/hr
  schedule: number[]; // Hourly fraction (0-1) for 24 hrs
  currentHour: number;
}

export const STANDARD_GAINS = {
  occupant: {
    sensible: 245, // BTU/hr per person (rest/light activity)
    latent: 205, // BTU/hr per person
  },
  lighting: {
    sensible: 1, // BTU/hr per watt (assumes ballast loss)
    latent: 0,
  },
  appliances: {
    cooking: { sensible: 4000, latent: 3000 },
    refrigerator: { sensible: 150, latent: 0 },
    waterHeater: { sensible: 300, latent: 100 },
    television: { sensible: 200, latent: 0 },
  },
};

// ============================================================================
// DUCTWORK & DISTRIBUTION LOSSES
// ============================================================================

export interface DuctSegment {
  location: "conditioned" | "unconditioned" | "exterior";
  length: number; // ft
  diameter: number; // inches
  insulation: number; // R-value
  leakage: number; // % of flow
}

export interface DuctNetwork {
  returnDucts: DuctSegment[];
  supplyDucts: DuctSegment[];
  returnLeakageTotal: number; // %
  supplyLeakageTotal: number; // %
}

export function calculateDuctLosses(
  cfm: number,
  network: DuctNetwork,
  indoorTemp: number,
  outdoorTemp: number
): number {
  const deltaT = Math.abs(indoorTemp - outdoorTemp);

  const supplyLosses = network.supplyDucts.reduce((sum, duct) => {
    const surfaceArea =
      (Math.PI * duct.diameter * duct.length) / 12; // Convert to sq ft
    const uValue = 1 / duct.insulation;
    return sum + uValue * surfaceArea * deltaT;
  }, 0);

  const returnLosses = network.returnDucts.reduce((sum, duct) => {
    const surfaceArea =
      (Math.PI * duct.diameter * duct.length) / 12;
    const uValue = 1 / duct.insulation;
    return sum + uValue * surfaceArea * deltaT;
  }, 0);

  // Leakage effects
  const leakageLoss =
    cfm * PSYCHROMETRIC.sensibleCfmFactor * deltaT *
    ((network.supplyLeakageTotal + network.returnLeakageTotal) / 200);

  return supplyLosses + returnLosses + leakageLoss;
}

// ============================================================================
// ROOM/ZONE DEFINITION
// ============================================================================

export interface Room {
  id: string;
  name: string;
  floorArea: number; // sq ft
  ceilingHeight: number; // ft
  volume: number; // cubic ft (auto-calculated)

  // Surfaces
  walls: OpaqueComponent[];
  windows: WindowComponent[];
  doors: DoorComponent[];
  ceiling: OpaqueComponent;
  floor: OpaqueComponent;

  // Infiltration/Ventilation
  infiltrationAcH: number;
  ventilationCFM: number;

  // Internal gains
  occupants: number;
  internalGains: InternalHeatGain[];

  // Adjacent spaces
  adjacentUnconditioned?: {
    spaceType: string;
    estimatedTemp: number;
  };
}

// ============================================================================
// LOAD CALCULATION ENGINE
// ============================================================================

export interface DetailedLoadBreakdown {
  walls: number;
  roof: number;
  floor: number;
  windows: {
    conduction: number;
    solar: number;
    total: number;
  };
  doors: number;
  infiltration: number;
  ventilation: number;
  internalSensible: number;
  internalLatent: number;
  ductLeakage: number;
  subtotal: number;
  safetyFactor: number;
  total: number;
}

export interface LoadResult {
  heating: DetailedLoadBreakdown;
  cooling: DetailedLoadBreakdown;
}

export class ManualJCalculator {
  private designOutdoorSummer: number; // Design cooling temp (°F)
  private designOutdoorWinter: number; // Design heating temp (°F)
  private designIndoorTemp: number; // Indoor setpoint (°F)
  private designOutdoorHumidity: number; // Summer humidity (%)
  private designIndoorHumidity: number; // Indoor humidity (%)
  private latitude: number;
  private elevation: number;
  private safetyFactor: number; // Typically 1.1-1.15

  constructor(
    designOutdoorSummer: number,
    designOutdoorWinter: number,
    designIndoorTemp: number,
    designOutdoorHumidity: number,
    designIndoorHumidity: number,
    latitude: number,
    elevation: number,
    safetyFactor: number = 1.1
  ) {
    this.designOutdoorSummer = designOutdoorSummer;
    this.designOutdoorWinter = designOutdoorWinter;
    this.designIndoorTemp = designIndoorTemp;
    this.designOutdoorHumidity = designOutdoorHumidity;
    this.designIndoorHumidity = designIndoorHumidity;
    this.latitude = latitude;
    this.elevation = elevation;
    this.safetyFactor = safetyFactor;
  }

  private getSolarRadiation(
    orientation: string,
    month: number = 7
  ): number {
    const radiationMap = ACCA_SOLAR_RADIATION as Record<string, number[]>;
    return radiationMap[orientation]?.[month - 1] || 0;
  }

  private getCLTD(
    orientation: string,
    constructionType: "light" | "medium" | "heavy",
    month: number = 7
  ): number {
    const orientationMap: Record<
      string,
      "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"
    > = {
      N: "N",
      NE: "NE",
      E: "E",
      SE: "SE",
      S: "S",
      SW: "SW",
      W: "W",
      NW: "NW",
      H: "H",
    };

    if (orientation === "H") {
      const roofData = CLTD_ROOFS[constructionType];
      return roofData[month - 1];
    }

    const wallData = CLTD_WALLS[constructionType];
    const orientationIndex: Record<
      "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW",
      number
    > = { N: 0, NE: 1, E: 2, SE: 3, S: 4, SW: 5, W: 6, NW: 7 };

    const mapOrientation = orientationMap[orientation];
    return wallData[orientationIndex[mapOrientation]][month - 1];
  }

  calculateWindowLoad(
    window: WindowComponent,
    month: number = 7,
    isCooling: boolean = true
  ): { conduction: number; solar: number } {
    const conduction =
      window.uValue *
      window.area *
      (this.designOutdoorSummer - this.designIndoorTemp);

    if (!isCooling) {
      return { conduction: -conduction, solar: 0 };
    }

    // Solar heat gain through glass
    const solarRadiation = this.getSolarRadiation(window.orientation, month);

    // Effective SHGC accounting for frame
    const effectiveSHGC =
      window.windowType.shgc * (1 - window.frameFraction) +
      0.1 * window.frameFraction;

    let solarGain =
      solarRadiation * window.area * effectiveSHGC * (1 - window.frameFraction);

    // Apply shading if present
    if (window.shading) {
      solarGain *=
        (1 - window.shading.externalShading) *
        (1 - window.shading.internalShading);
    }

    return {
      conduction,
      solar: solarGain,
    };
  }

  calculateOpaqueLoad(
    component: OpaqueComponent,
    month: number = 7,
    isCooling: boolean = true
  ): number {
    if (!isCooling) {
      // Heating: simple conduction with outdoor design temp
      return (
        component.uValue *
        component.area *
        (this.designIndoorTemp - this.designOutdoorWinter)
      );
    }

    // Cooling: Use CLTD method
    const constructionType = (component.construction?.mass || 1.8) < 3 ? "light" : "medium";
    const cltd = this.getCLTD(
      component.orientation,
      constructionType as "light" | "medium" | "heavy",
      month
    );

    // CLTD correction for indoor/outdoor design conditions
    const baseIndoorTemp = 75;
    const baseOutdoorTemp = 95;
    const correctedCLTD = cltd + (this.designIndoorTemp - baseIndoorTemp) + (this.designOutdoorSummer - baseOutdoorTemp);

    return component.uValue * component.area * correctedCLTD;
  }

  calculateInfiltrationLoad(
    room: Room,
    isCooling: boolean = true
  ): number {
    const volume = room.floorArea * room.ceilingHeight;
    const acH = convertInfiltrationRate(room.infiltrationAcH, 0.1);

    const cfm = (volume * acH) / 60;

    if (!isCooling) {
      return (
        cfm *
        PSYCHROMETRIC.sensibleCfmFactor *
        (this.designIndoorTemp - this.designOutdoorWinter)
      );
    }

    // Cooling: Account for sensible and latent
    const outdoorPoint = getPsychrometricPoint(
      this.designOutdoorSummer,
      this.designOutdoorHumidity
    );
    const indoorPoint = getPsychrometricPoint(
      this.designIndoorTemp,
      this.designIndoorHumidity
    );

    const sensible =
      cfm *
      PSYCHROMETRIC.sensibleCfmFactor *
      (this.designOutdoorSummer - this.designIndoorTemp);

    const latent =
      cfm *
      PSYCHROMETRIC.latentCfmFactor *
      (outdoorPoint.humidity - indoorPoint.humidity) /
      7000;

    return sensible + latent;
  }

  calculateVentilationLoad(
    ventilationCFM: number,
    isCooling: boolean = true
  ): number {
    if (!isCooling) {
      return (
        ventilationCFM *
        PSYCHROMETRIC.sensibleCfmFactor *
        (this.designIndoorTemp - this.designOutdoorWinter)
      );
    }

    const outdoorPoint = getPsychrometricPoint(
      this.designOutdoorSummer,
      this.designOutdoorHumidity
    );
    const indoorPoint = getPsychrometricPoint(
      this.designIndoorTemp,
      this.designIndoorHumidity
    );

    const sensible =
      ventilationCFM *
      PSYCHROMETRIC.sensibleCfmFactor *
      (this.designOutdoorSummer - this.designIndoorTemp);

    const latent =
      ventilationCFM *
      PSYCHROMETRIC.latentCfmFactor *
      (outdoorPoint.humidity - indoorPoint.humidity) /
      7000;

    return sensible + latent;
  }

  calculateInternalGains(room: Room, isCooling: boolean = true): {
    sensible: number;
    latent: number;
  } {
    const occupantSensible =
      room.occupants * STANDARD_GAINS.occupant.sensible * 0.75; // Cooling diversity
    const occupantLatent =
      room.occupants * STANDARD_GAINS.occupant.latent * 0.75;

    const gainsSensible = room.internalGains.reduce((sum, gain) => {
      return sum + gain.sensible * gain.schedule[12]; // Assume peak at noon
    }, occupantSensible);

    const gainsLatent = room.internalGains.reduce((sum, gain) => {
      return sum + gain.latent * gain.schedule[12];
    }, occupantLatent);

    if (!isCooling) {
      return { sensible: -gainsSensible * 0.25, latent: 0 }; // Partial credit in winter
    }

    return { sensible: gainsSensible, latent: gainsLatent };
  }

  calculateRoomLoad(room: Room, isCooling: boolean = true): LoadResult {
    const heating: DetailedLoadBreakdown = {
      walls: 0,
      roof: 0,
      floor: 0,
      windows: { conduction: 0, solar: 0, total: 0 },
      doors: 0,
      infiltration: 0,
      ventilation: 0,
      internalSensible: 0,
      internalLatent: 0,
      ductLeakage: 0,
      subtotal: 0,
      safetyFactor: 0,
      total: 0,
    };

    const cooling: DetailedLoadBreakdown = { ...heating };

    // Walls
    room.walls.forEach((wall) => {
      const load = this.calculateOpaqueLoad(wall, 7, isCooling);
      if (isCooling) {
        cooling.walls += load;
      } else {
        heating.walls += load;
      }
    });

    // Windows
    room.windows.forEach((window) => {
      const load = this.calculateWindowLoad(window, 7, isCooling);
      if (isCooling) {
        cooling.windows.conduction += load.conduction;
        cooling.windows.solar += load.solar;
        cooling.windows.total = cooling.windows.conduction + cooling.windows.solar;
      } else {
        heating.windows.conduction += load.conduction;
        heating.windows.total = heating.windows.conduction;
      }
    });

    // Doors
    room.doors.forEach((door) => {
      const load = this.calculateOpaqueLoad(
        door as unknown as OpaqueComponent,
        7,
        isCooling
      );
      if (isCooling) {
        cooling.doors += load;
      } else {
        heating.doors += load;
      }
    });

    // Ceiling/Roof
    const ceilingLoad = this.calculateOpaqueLoad(room.ceiling, 7, isCooling);
    const floorLoad = this.calculateOpaqueLoad(room.floor, 7, isCooling);

    if (isCooling) {
      cooling.roof += ceilingLoad;
      cooling.floor += floorLoad;
    } else {
      heating.roof += ceilingLoad;
      heating.floor += floorLoad;
    }

    // Infiltration
    const infiltration = this.calculateInfiltrationLoad(room, isCooling);
    if (isCooling) {
      cooling.infiltration = infiltration;
    } else {
      heating.infiltration = infiltration;
    }

    // Ventilation
    const ventilation = this.calculateVentilationLoad(
      room.ventilationCFM,
      isCooling
    );
    if (isCooling) {
      cooling.ventilation = ventilation;
    } else {
      heating.ventilation = ventilation;
    }

    // Internal gains
    const gains = this.calculateInternalGains(room, isCooling);
    if (isCooling) {
      cooling.internalSensible = gains.sensible;
      cooling.internalLatent = gains.latent;
    } else {
      heating.internalSensible = gains.sensible;
    }

    // Subtotal
    heating.subtotal =
      heating.walls +
      heating.roof +
      heating.floor +
      heating.windows.total +
      heating.doors +
      heating.infiltration +
      heating.ventilation +
      heating.internalSensible;

    cooling.subtotal =
      cooling.walls +
      cooling.roof +
      cooling.floor +
      cooling.windows.total +
      cooling.doors +
      cooling.infiltration +
      cooling.ventilation +
      cooling.internalSensible +
      cooling.internalLatent;

    // Safety factor
    heating.safetyFactor = heating.subtotal * (this.safetyFactor - 1);
    cooling.safetyFactor = cooling.subtotal * (this.safetyFactor - 1);

    heating.total = heating.subtotal + heating.safetyFactor;
    cooling.total = cooling.subtotal + cooling.safetyFactor;

    return { heating, cooling };
  }
}

