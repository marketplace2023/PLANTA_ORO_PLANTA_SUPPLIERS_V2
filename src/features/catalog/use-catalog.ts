import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type StageMaster = { id: string; code: string; name: string; stageGroup: string }
export type Family = { id: string; code: string; name: string }

/** Etapas del proceso y familias de equipos del ecosistema: sirven para clasificar productos y declarar la cobertura. */
export const useStageMasters = () => useQuery({ queryKey: ['catalog', 'stages'], queryFn: () => api<StageMaster[]>('/stages/catalog'), staleTime: 5 * 60_000 })
export const useFamilies = () => useQuery({ queryKey: ['catalog', 'families'], queryFn: () => api<Family[]>('/catalog/families'), staleTime: 5 * 60_000 })
