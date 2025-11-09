import { useEffect, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import type { ClimateData } from '../../lib/queries/location'
import { useResolveLocation } from '../../lib/queries/location'

const locationSchema = z.object({
  zipCode: z
    .string()
    .regex(/^\d{5}$/u, 'ZIP code must be 5 digits'),
})

type LocationResolverProps = {
  onComplete: (data: ClimateData) => void
}

export function LocationResolver({ onComplete }: LocationResolverProps) {
  const [submittedZip, setSubmittedZip] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      zipCode: '',
    },
    validatorAdapter: zodValidator,
    onSubmit: ({ value }) => {
      setSubmittedZip(value.zipCode)
    },
  })

  const currentZip = submittedZip ?? form.state.values.zipCode
  const { data, isLoading, error } = useResolveLocation(
    currentZip && /^\d{5}$/u.test(currentZip) ? currentZip : undefined,
  )

  useEffect(() => {
    if (data && submittedZip && /^\d{5}$/u.test(submittedZip)) {
      onComplete(data)
    }
  }, [data, submittedZip, onComplete])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Locate the property</CardTitle>
        <CardDescription>
          Enter the project ZIP code to load climate design conditions.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <CardContent className="space-y-4">
          <form.Field name="zipCode" validators={{ onChange: locationSchema.shape.zipCode }}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>ZIP code</Label>
                <Input
                  id={field.name}
                  inputMode="numeric"
                  maxLength={5}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value.slice(0, 5))}
                  onBlur={field.handleBlur}
                  placeholder="e.g. 30301"
                  autoFocus
                />
                {field.state.meta.errors?.[0] && (
                  <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {error && (
            <p className="text-sm text-destructive">{error.message}</p>
          )}

          {isLoading && (
            <p className="text-sm text-muted-foreground">Resolving climate data…</p>
          )}

          {data && (
            <dl className="grid gap-2 rounded-lg border bg-muted/40 p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Summer design (°F)</dt>
                <dd className="font-medium">{data.variables.summerDesignTemp}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Winter design (°F)</dt>
                <dd className="font-medium">{data.variables.winterDesignTemp}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Latitude</dt>
                <dd className="font-medium">{data.variables.latitude.toFixed(4)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Longitude</dt>
                <dd className="font-medium">{data.variables.longitude.toFixed(4)}</dd>
              </div>
            </dl>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            disabled={form.state.isValidating || form.state.isSubmitting || isLoading}
          >
            {data && /^\d{5}$/u.test(currentZip ?? '') ? 'Continue' : 'Resolve location'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
