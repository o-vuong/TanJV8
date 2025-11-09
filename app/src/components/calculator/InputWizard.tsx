import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import type { ClimateData } from '../../lib/queries/location'
import type { BuildingInputs, CalculationResults } from '@manualj/calc-engine'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { getManualJWorker } from '../../lib/workers/manualj-client'

const schema = z.object({
  floorArea: z.coerce.number().positive('Floor area must be positive'),
  ceilingHeight: z.coerce.number().positive('Ceiling height must be positive'),
  wallAreaNorth: z.coerce.number().nonnegative(),
  wallAreaSouth: z.coerce.number().nonnegative(),
  wallAreaEast: z.coerce.number().nonnegative(),
  wallAreaWest: z.coerce.number().nonnegative(),
  wallRValue: z.coerce.number().positive(),
  roofArea: z.coerce.number().positive(),
  roofRValue: z.coerce.number().positive(),
  windowAreaSouth: z.coerce.number().nonnegative(),
  windowAreaNorth: z.coerce.number().nonnegative(),
  windowRValue: z.coerce.number().positive(),
  windowShgc: z.coerce.number().min(0).max(1),
  doorArea: z.coerce.number().nonnegative(),
  doorRValue: z.coerce.number().positive(),
  stackEffect: z.coerce.number(),
  windSpeed: z.coerce.number().nonnegative(),
  infiltrationClass: z.enum(['tight', 'average', 'loose']),
  occupants: z.coerce.number().int().nonnegative(),
  lightingWatts: z.coerce.number().nonnegative(),
  refrigeratorWatts: z.coerce.number().nonnegative(),
  dishwasherWatts: z.coerce.number().nonnegative(),
  ductLocation: z.enum(['conditioned', 'unconditioned', 'exterior']),
  ductInsulation: z.enum(['none', 'minimal', 'standard', 'high']),
})

type FormValues = z.infer<typeof schema>

const fieldValidators = schema.shape as Record<keyof FormValues, z.ZodTypeAny>

interface InputWizardProps {
  climateData: ClimateData
  onComplete: (inputs: BuildingInputs, results: CalculationResults) => void
  onBack: () => void
}

const OCCUPANT_SENSIBLE = 230
const OCCUPANT_LATENT = 190

const SOLAR_FACTORS = {
  orientationFactors: {
    north: 0.6,
    south: 1.1,
    east: 0.9,
    west: 1.0,
    northeast: 0.7,
    southeast: 1.0,
    southwest: 1.05,
    northwest: 0.65,
  },
  coolingLoadFactors: {
    15: 1.1,
  },
}

export function InputWizard({ climateData, onComplete, onBack }: InputWizardProps) {
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const form = useForm<FormValues>({
    defaultValues: {
      floorArea: 2400,
      ceilingHeight: 8,
      wallAreaNorth: 200,
      wallAreaSouth: 200,
      wallAreaEast: 150,
      wallAreaWest: 150,
      wallRValue: 13,
      roofArea: 2400,
      roofRValue: 38,
      windowAreaSouth: 80,
      windowAreaNorth: 60,
      windowRValue: 3,
      windowShgc: 0.35,
      doorArea: 40,
      doorRValue: 5,
      stackEffect: 12,
      windSpeed: 7,
      infiltrationClass: 'average',
      occupants: 4,
      lightingWatts: 2000,
      refrigeratorWatts: 400,
      dishwasherWatts: 1200,
      ductLocation: 'unconditioned',
      ductInsulation: 'standard',
    },
    validatorAdapter: zodValidator,
    onSubmit: async ({ value }) => {
      setIsCalculating(true)
      setProgress(0)
      setError(null)

      try {
        const indoorCooling = 75
        const designDelta = climateData.variables.summerDesignTemp - indoorCooling
        const volume = value.floorArea * value.ceilingHeight

        const inputs: BuildingInputs = {
          climateZone: climateData.climateRefId ?? 'unknown',
          designTemperatureDifference: designDelta,
          buildingVolume: volume,
          infiltrationClass: value.infiltrationClass,
          windSpeed: value.windSpeed,
          stackEffect: value.stackEffect,
          solarFactors: SOLAR_FACTORS,
          walls: [
            { id: 'north', area: value.wallAreaNorth, rValue: value.wallRValue, orientation: 'north' },
            { id: 'south', area: value.wallAreaSouth, rValue: value.wallRValue, orientation: 'south' },
            { id: 'east', area: value.wallAreaEast, rValue: value.wallRValue, orientation: 'east' },
            { id: 'west', area: value.wallAreaWest, rValue: value.wallRValue, orientation: 'west' },
          ],
          windows: [
            {
              id: 'south-windows',
              area: value.windowAreaSouth,
              rValue: value.windowRValue,
              shgc: value.windowShgc,
              orientation: 'south',
            },
            {
              id: 'north-windows',
              area: value.windowAreaNorth,
              rValue: value.windowRValue,
              shgc: value.windowShgc,
              orientation: 'north',
            },
          ],
          doors: [
            {
              id: 'main-door',
              area: value.doorArea,
              rValue: value.doorRValue,
              orientation: 'south',
            },
          ],
          roof: {
            id: 'roof',
            area: value.roofArea,
            rValue: value.roofRValue,
          },
          foundation: {
            id: 'foundation',
            area: value.floorArea,
            rValue: 10,
          },
          occupancy: {
            count: value.occupants,
            sensibleGainPerPerson: OCCUPANT_SENSIBLE,
            latentGainPerPerson: OCCUPANT_LATENT,
          },
          lighting: {
            totalWattage: value.lightingWatts,
          },
          appliances: [
            { type: 'refrigerator', wattage: value.refrigeratorWatts, usageFactor: 0.4 },
            { type: 'dishwasher', wattage: value.dishwasherWatts, usageFactor: 0.1 },
          ],
          ductwork: {
            location: value.ductLocation,
            insulation: value.ductInsulation,
          },
          diversityFactors: {
            occupancy: 0.85,
            lighting: 0.9,
            appliances: {
              refrigerator: 1,
              dishwasher: 0.7,
            },
          },
        }

        const worker = getManualJWorker()
        const results = await worker.calculate(inputs, {
          onProgress: (p) => setProgress(p),
        })

        onComplete(inputs, results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Calculation failed')
      } finally {
        setIsCalculating(false)
        setProgress(null)
      }
    },
  })

  const renderNumberField = (
    name: keyof FormValues,
    label: string,
    props?: InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <form.Field name={name} validators={{ onChange: fieldValidators[name] }}>
      {(field) => (
        <div className="space-y-2">
          <Label htmlFor={String(name)}>{label}</Label>
          <Input
            id={String(name)}
            type="number"
            value={field.state.value}
            onChange={(event) => field.handleChange(Number(event.target.value))}
            onBlur={field.handleBlur}
            {...props}
          />
          {field.state.meta.errors?.[0] && (
            <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
          )}
        </div>
      )}
    </form.Field>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Describe the building</CardTitle>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <CardContent className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            {renderNumberField('floorArea', 'Floor area (sq ft)', { min: 1 })}
            {renderNumberField('ceilingHeight', 'Ceiling height (ft)', { min: 1 })}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Wall assemblies</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {renderNumberField('wallAreaNorth', 'North walls (sq ft)', { min: 0 })}
              {renderNumberField('wallAreaSouth', 'South walls (sq ft)', { min: 0 })}
              {renderNumberField('wallAreaEast', 'East walls (sq ft)', { min: 0 })}
              {renderNumberField('wallAreaWest', 'West walls (sq ft)', { min: 0 })}
              {renderNumberField('wallRValue', 'Wall R-value', { min: 1, step: 0.1 })}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            {renderNumberField('roofArea', 'Roof area (sq ft)', { min: 0 })}
            {renderNumberField('roofRValue', 'Roof R-value', { min: 1, step: 0.1 })}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {renderNumberField('windowAreaSouth', 'South window area (sq ft)', { min: 0 })}
            {renderNumberField('windowAreaNorth', 'North window area (sq ft)', { min: 0 })}
            {renderNumberField('windowShgc', 'Window SHGC', { step: 0.05, min: 0, max: 1 })}
            {renderNumberField('windowRValue', 'Window R-value', { min: 1, step: 0.1 })}
            {renderNumberField('doorArea', 'Door area (sq ft)', { min: 0 })}
            {renderNumberField('doorRValue', 'Door R-value', { min: 1, step: 0.1 })}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {renderNumberField('occupants', 'Occupants', { min: 0, step: 1 })}
            {renderNumberField('lightingWatts', 'Lighting (watts)', { min: 0, step: 10 })}
            {renderNumberField('refrigeratorWatts', 'Refrigerator (watts)', { min: 0, step: 10 })}
            {renderNumberField('dishwasherWatts', 'Dishwasher (watts)', { min: 0, step: 10 })}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <form.Field name="infiltrationClass" validators={{ onChange: fieldValidators.infiltrationClass }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="infiltrationClass">Infiltration class</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as FormValues['infiltrationClass'])}
                  >
                    <SelectTrigger id="infiltrationClass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tight">Tight</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="loose">Loose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            {renderNumberField('windSpeed', 'Wind speed (mph)', { min: 0, step: 0.5 })}
            {renderNumberField('stackEffect', 'Stack effect (°F)', { step: 0.5 })}
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <form.Field name="ductLocation" validators={{ onChange: fieldValidators.ductLocation }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="ductLocation">Duct location</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as FormValues['ductLocation'])}
                  >
                    <SelectTrigger id="ductLocation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conditioned">Conditioned space</SelectItem>
                      <SelectItem value="unconditioned">Unconditioned space</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
            <form.Field name="ductInsulation" validators={{ onChange: fieldValidators.ductInsulation }}>
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="ductInsulation">Duct insulation</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value as FormValues['ductInsulation'])}
                  >
                    <SelectTrigger id="ductInsulation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="minimal">Minimal (R-4)</SelectItem>
                      <SelectItem value="standard">Standard (R-6)</SelectItem>
                      <SelectItem value="high">High (R-8+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {typeof progress === 'number' && (
            <p className="text-sm text-muted-foreground">Calculating… {progress}%</p>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={isCalculating}>
            Back
          </Button>
          <Button type="submit" disabled={isCalculating}>
            {isCalculating ? 'Calculating…' : 'Generate results'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
