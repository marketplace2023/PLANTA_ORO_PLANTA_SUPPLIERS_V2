import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, formBody, jsonBody } from '@/lib/api'

export type Tag = { code: string; name: string }
export type OrgStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
export type Availability = 'IN_STOCK' | 'ON_REQUEST' | 'OUT_OF_STOCK'
export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number }

export type Provider = {
  id: string
  organizationName: string
  countryCode: string
  city: string | null
  description: string | null
  logoUrl: string | null
  certifications: string[]
  status: OrgStatus
  verified: boolean
  /** null = sin calificaciones (no se inventa un valor). */
  rating: number | null
  website: string | null
  contactEmail: string | null
  stages: Tag[]
  families: Tag[]
  activeListings: number
}
export type ProviderDetail = Provider & { taxId: string | null; canManage: boolean; myRole: string | null }
export type MyProvider = Provider & { myRole: 'OWNER' | 'MEMBER' }

/** Producto del marketplace de un proveedor (independiente de los modelos del catálogo del administrador). */
export type Listing = {
  id: string
  title: string
  description: string | null
  price: number | null
  currency: string
  availability: Availability
  stockText: string | null
  /** URL externa o ruta relativa a la API (foto subida): resolver con `imageSrc`. */
  imageUrl: string | null
  status: ListingStatus
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  family: Tag
  type: Tag | null
  model: { id: string; name: string; manufacturer: { id: string; name: string } | null } | null
  provider: { id: string; name: string; verified: boolean; rating: number | null; countryCode: string }
  stages: Tag[]
}

export type OrgMember = { userId: string; email: string; firstName: string; lastName: string; role: 'OWNER' | 'MEMBER'; createdAt: string }
export type ProviderDashboard = { listingsActive: number; listingsDraft: number; listingsArchived: number; featured: number; onRequestPricing: number }
export type Filters = Record<string, string | undefined>

const toQuery = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

// Todo cuelga de ['org', …] para invalidarse junto al editar.
export const useMyProviders = (enabled: boolean) =>
  useQuery({ queryKey: ['org', 'mine'], queryFn: () => api<MyProvider[]>('/providers/mine'), enabled, staleTime: 30_000 })

export const useProvider = (id: string | undefined) =>
  useQuery({ queryKey: ['org', 'provider', id], queryFn: () => api<ProviderDetail>(`/providers/${id}`), enabled: !!id, retry: false })

export const useProviderDashboard = (id: string | undefined) =>
  useQuery({ queryKey: ['org', 'provider', id, 'dashboard'], queryFn: () => api<ProviderDashboard>(`/providers/${id}/dashboard`), enabled: !!id })

export const useProviderListings = (id: string | undefined, filters: Filters, pageSize = 25) =>
  useQuery({
    queryKey: ['org', 'provider', id, 'listings', filters, pageSize],
    queryFn: () => api<Page<Listing>>(`/providers/${id}/listings${toQuery({ ...filters, pageSize })}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })

export const useMembers = (id: string | undefined) =>
  useQuery({ queryKey: ['org', 'provider', id, 'members'], queryFn: () => api<OrgMember[]>(`/providers/${id}/members`), enabled: !!id, retry: false })

function useInvalidateOrgs() {
  const queryClient = useQueryClient()
  return () => void queryClient.invalidateQueries({ queryKey: ['org'] })
}

export type ProviderInput = {
  organizationName: string
  taxId?: string
  countryCode: string
  city?: string
  description?: string
  website?: string
  contactEmail?: string
  certifications?: string[]
  /** El registro lo hace la propia persona: queda pendiente de aprobación y ella es la responsable. */
  selfRegistration?: boolean
}

/** Solicitud de registro: queda PENDIENTE hasta que el administrador del ecosistema la apruebe. */
export function useCreateProvider() {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (input: ProviderInput) => api<ProviderDetail>('/providers', { method: 'POST', ...jsonBody(input) }), onSuccess: invalidate })
}

/** Lo que un miembro puede cambiar: nombre, NIF, estado, verificación y calificación son del administrador. */
export type ProviderPatch = {
  city?: string | null
  description?: string | null
  website?: string | null
  contactEmail?: string | null
  logoUrl?: string | null
  certifications?: string[]
  stageCodes?: string[]
  familyCodes?: string[]
}

export function useUpdateProvider(id: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (input: ProviderPatch) => api<ProviderDetail>(`/providers/${id}`, { method: 'PATCH', ...jsonBody(input) }), onSuccess: invalidate })
}

export type ListingInput = {
  title: string
  description?: string
  price?: number
  currency?: string
  availability?: Availability
  stockText?: string
  imageUrl?: string
  stageCodes?: string[]
  assetFamilyCode?: string
}
export type ListingPatch = Partial<Omit<ListingInput, 'description' | 'price' | 'stockText' | 'imageUrl'>> & {
  description?: string | null
  price?: number | null
  stockText?: string | null
  imageUrl?: string | null
  status?: ListingStatus
}

export function useCreateListing(providerId: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (input: ListingInput) => api<Listing>(`/providers/${providerId}/listings`, { method: 'POST', ...jsonBody(input) }), onSuccess: invalidate })
}

export function useUpdateListing(providerId: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & ListingPatch) => api<Listing>(`/providers/${providerId}/listings/${id}`, { method: 'PATCH', ...jsonBody(input) }),
    onSuccess: invalidate,
  })
}

export function useAddMember(id: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (input: { email: string; role: 'OWNER' | 'MEMBER' }) => api<OrgMember[]>(`/providers/${id}/members`, { method: 'POST', ...jsonBody(input) }), onSuccess: invalidate })
}

export function useRemoveMember(id: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (userId: string) => api<void>(`/providers/${id}/members/${userId}`, { method: 'DELETE' }), onSuccess: invalidate })
}

/** Foto del producto (reemplaza la anterior). */
export function useUploadListingImage(providerId: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: ({ id, file }: { id: string; file: File }) => api<Listing>(`/providers/${providerId}/listings/${id}/image`, { method: 'POST', ...formBody({}, file) }), onSuccess: invalidate })
}
export function useRemoveListingImage(providerId: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (id: string) => api<void>(`/providers/${providerId}/listings/${id}/image`, { method: 'DELETE' }), onSuccess: invalidate })
}

/** Logo de la empresa (reemplaza el anterior). */
export function useUploadLogo(id: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: (file: File) => api<ProviderDetail>(`/providers/${id}/logo`, { method: 'POST', ...formBody({}, file) }), onSuccess: invalidate })
}
export function useRemoveLogo(id: string) {
  const invalidate = useInvalidateOrgs()
  return useMutation({ mutationFn: () => api<void>(`/providers/${id}/logo`, { method: 'DELETE' }), onSuccess: invalidate })
}
