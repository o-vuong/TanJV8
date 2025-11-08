import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { createApiClient } from '../api/client'

export const climateDataSchema = z.object({
  climateRefId: z.string(),
  variables: z.object({
    summerDesignTemp: z.number(),
    winterDesignTemp: z.number(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  revision: z.number().optional(),
})

export type ClimateData = z.infer<typeof climateDataSchema>

const apiClient = createApiClient({ baseUrl: '/api/location' })

export function useResolveLocation(zipCode: string | undefined) {
  return useQuery<ClimateData, Error>({
    queryKey: ['location', 'resolve', zipCode],
    enabled: Boolean(zipCode && /^\d{5}$/.test(zipCode)),
    queryFn: async () => {
      if (!zipCode) {
        throw new Error('ZIP code is required')
      }
      const data = await apiClient.get<unknown>('/resolve', {
        params: { zipCode },
      })
      return climateDataSchema.parse(data)
    },
    staleTime: 24 * 60 * 60 * 1000,
  })
}
