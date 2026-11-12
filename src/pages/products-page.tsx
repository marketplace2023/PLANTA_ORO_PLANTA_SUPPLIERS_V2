import { Archive, ImageIcon, Pencil, Plus, Search, Send, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable, Empty, Failed, Loading, Panel, Pill, ScreenHeader, Segmented, td } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProviderContext } from '@/features/organizations/provider-context'
import {
  useProviderDashboard,
  useProviderListings,
  useUpdateListing,
  type Availability,
  type Listing,
  type ListingStatus,
} from '@/features/organizations/use-organizations'
import { ApiError } from '@/lib/api'
import { imageSrc } from '@/lib/media'
import { AVAILABILITY_LABELS, LISTING_STATUS_LABELS, priceText } from '@/lib/organizations'
import { useDebouncedValue } from '@/lib/use-debounced-value'

type View = 'ALL' | ListingStatus

const STATUS_STYLE: Record<ListingStatus, string> = { ACTIVE: 'var(--fur-green-500)', DRAFT: 'var(--fur-steel-500)', ARCHIVED: 'var(--fur-orange-500)' }
const AVAILABILITY_COLOR: Record<Availability, string> = { IN_STOCK: 'var(--fur-green-500)', ON_REQUEST: 'var(--fur-blue-500)', OUT_OF_STOCK: 'var(--fur-red-500)' }

export function ProductsPage() {
  const { provider } = useProviderContext()
  const providerId = provider!.id
  const active = provider!.status === 'ACTIVE'
  const dash = useProviderDashboard(providerId)
  const update = useUpdateListing(providerId)
  const [view, setView] = useState<View>('ALL')
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim())
  const navigate = useNavigate()
  const list = useProviderListings(providerId, { status: view, search: q || undefined })
  const d = dash.data

  const setStatus = (l: Listing, status: ListingStatus, ok: string) =>
    update.mutate(
      { id: l.id, status },
      {
        onSuccess: () => toast.success(ok),
        onError: (e) => toast.error(e instanceof ApiError ? (e.fieldErrors[0]?.message ?? e.message) : 'No se pudo actualizar el producto'),
      },
    )

  return (
    <>
      <ScreenHeader
        title="Mis productos"
        description="Lo que ofreces en el marketplace. Un producto en borrador no es visible; al publicarlo aparece en el mercado."
        actions={
          <Button onClick={() => navigate('/products/new')} disabled={!active} title={active ? undefined : 'Disponible cuando el administrador apruebe tu empresa'}>
            <Plus /> Nuevo producto
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<View>
          label="Estado"
          value={view}
          onChange={setView}
          options={[
            { value: 'ALL', label: 'Todos', count: d ? d.listingsActive + d.listingsDraft + d.listingsArchived : undefined },
            { value: 'ACTIVE', label: 'Publicados', count: d?.listingsActive },
            { value: 'DRAFT', label: 'Borradores', count: d?.listingsDraft },
            { value: 'ARCHIVED', label: 'Archivados', count: d?.listingsArchived },
          ]}
        />
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fur-gray-500" aria-hidden />
          <Input className="w-64 pl-9" placeholder="Buscar producto" aria-label="Buscar productos" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Panel className="mt-3" flush>
        {list.isLoading ? (
          <div className="p-4"><Loading rows={5} /></div>
        ) : list.isError ? (
          <Failed what="tus productos" onRetry={() => void list.refetch()} />
        ) : list.data && list.data.items.length > 0 ? (
          <>
            <DataTable head={['Foto', 'Producto', 'Etapas', { label: 'Precio', right: true }, 'Disponibilidad', 'Estado', { label: 'Acciones', right: true }]}>
              {list.data.items.map((l) => {
                const img = imageSrc(l.imageUrl)
                return (
                  <tr key={l.id}>
                    <td className={td}>
                      <span className="grid size-12 place-items-center overflow-hidden rounded-md border border-border bg-white">
                        {img ? <img src={img} alt={`Foto de ${l.title}`} loading="lazy" className="size-full object-contain" /> : <ImageIcon className="size-5 text-fur-gray-500" aria-label="Sin foto" />}
                      </span>
                    </td>
                    <td className={td}>
                      <p className="max-w-72 truncate font-medium text-fur-navy-900" title={l.title}>{l.title}</p>
                      <p className="text-xs text-muted-foreground">{l.family.name}{l.stockText ? ` · ${l.stockText}` : ''}</p>
                    </td>
                    <td className={td}>
                      {l.stages.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Sin etapas</span>
                      ) : (
                        <span className="text-xs" title={l.stages.map((s) => s.name).join(', ')}>{l.stages.slice(0, 2).map((s) => s.code).join(', ')}{l.stages.length > 2 ? ` +${l.stages.length - 2}` : ''}</span>
                      )}
                    </td>
                    <td className={`${td} text-right whitespace-nowrap tabular-nums`}>{priceText(l.price, l.currency)}</td>
                    <td className={td}><Pill label={AVAILABILITY_LABELS[l.availability]} color={AVAILABILITY_COLOR[l.availability]} /></td>
                    <td className={td}>
                      <Pill label={LISTING_STATUS_LABELS[l.status]} color={STATUS_STYLE[l.status]} />
                      {l.isFeatured && <span className="ml-1.5 text-xs font-semibold text-fur-gold-600">Destacado</span>}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button size="xs" variant="outline" aria-label={`Editar ${l.title}`} onClick={() => navigate(`/products/${l.id}/edit`)}>
                          <Pencil /> Editar
                        </Button>
                        {l.status !== 'ACTIVE' ? (
                          <Button size="xs" variant="secondary" disabled={update.isPending || !active} aria-label={`${l.status === 'ARCHIVED' ? 'Reactivar' : 'Publicar'} ${l.title}`} onClick={() => setStatus(l, 'ACTIVE', 'Producto publicado en el marketplace')}>
                            {l.status === 'ARCHIVED' ? <Undo2 /> : <Send />} {l.status === 'ARCHIVED' ? 'Reactivar' : 'Publicar'}
                          </Button>
                        ) : (
                          <Button size="xs" variant="secondary" disabled={update.isPending} aria-label={`Archivar ${l.title}`} onClick={() => setStatus(l, 'ARCHIVED', 'Producto archivado: ya no es visible')}>
                            <Archive /> Archivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </DataTable>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">Mostrando {list.data.items.length} de {list.data.total} productos.</p>
          </>
        ) : (
          <Empty>{view === 'ALL' && !q ? 'Aún no tienes productos. Crea el primero.' : 'No hay productos con estos filtros.'}</Empty>
        )}
      </Panel>

    </>
  )
}
