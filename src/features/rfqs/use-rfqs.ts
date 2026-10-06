import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, jsonBody } from '@/lib/api'

export type QuoteStatus = 'SUBMITTED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN'

/** Solicitud de cotización recibida. El proveedor ve solo líneas, cantidades y fecha requerida: nunca la justificación ni precios estimados. */
export type ProviderRfq = {
  id: string
  code: string
  status: 'OPEN' | 'AWARDED' | 'CANCELLED'
  deadlineAt: string
  acceptsQuotes: boolean
  priority: string
  neededBy: string | null
  plant: { name: string; countryCode: string | null }
  lines: Array<{ id: string; description: string; quantity: number; uom: string }>
  myQuote: { id: string; currency: string; totalAmount: number; deliveryDays: number; conditions: string | null; status: QuoteStatus } | null
}

export type QuoteInput = { currency: string; totalAmount: number; deliveryDays: number; conditions?: string }

export const useProviderRfqs = (providerId: string | undefined) =>
  useQuery({ queryKey: ['org', 'provider', providerId, 'rfqs'], queryFn: () => api<ProviderRfq[]>(`/providers/${providerId}/rfqs`), enabled: !!providerId })

export function useSubmitQuote(providerId: string, rfqId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: QuoteInput) => api<ProviderRfq>(`/providers/${providerId}/rfqs/${rfqId}/quote`, { method: 'POST', ...jsonBody(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', 'provider', providerId, 'rfqs'] }),
  })
}

export function useWithdrawQuote(providerId: string, rfqId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<ProviderRfq>(`/providers/${providerId}/rfqs/${rfqId}/quote`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', 'provider', providerId, 'rfqs'] }),
  })
}
