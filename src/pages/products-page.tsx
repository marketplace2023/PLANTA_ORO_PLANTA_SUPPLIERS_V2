import { Archive, ImageIcon, Pencil, Plus, Search, Send, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckGroup } from '@/components/check-group'
import { FormDialog, type Values } from '@/components/form-dialog'
import { ImagePicker } from '@/components/image-picker'
import { DataTable, Empty, Failed, Loading, Panel, Pill, ScreenHeader, Segmented, td } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFamilies, useStageMasters } from '@/features/catalog/use-catalog'
import { useProviderContext } from '@/features/organizations/provider-context'
import {
  useCreateListing,
  useProviderDashboard,
  useProviderListings,
  useRemoveListingImage,
  useUpdateListing,
  useUploadListingImage,
  type Availability,
  type Listing,
  type ListingStatus,
} from '@/features/organizations/use-organizations'
import { ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/forms'
import { NO_IMAGE_CHANGE, type ImageChange } from '@/lib/image-file'
import { imageSrc } from '@/lib/media'
import { AVAILABILITY_LABELS, LISTING_STATUS_LABELS, priceText } from '@/lib/organizations'
import { useDebouncedValue } from '@/lib/use-debounced-value'

type View = 'ALL' | ListingStatus

const CURRENCIES = ['USD', 'PEN', 'CLP', 'ARS', 'EUR']
const STATUS_STYLE: Record<ListingStatus, string> = { ACTIVE: 'var(--fur-green-500)', DRAFT: 'var(--fur-steel-500)', ARCHIVED: 'var(--fur-orange-500)' }
const AVAILABILITY_COLOR: Record<Availability, string> = { IN_STOCK: 'var(--fur-green-500)', ON_REQUEST: 'var(--fur-blue-500)', OUT_OF_STOCK: 'var(--fur-red-500)' }

const opt = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const nul = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** Alta o edición de un producto. Se crea como borrador; se publica desde la lista (exige al menos una etapa). */
function ProductFormDialog({ providerId, listing, onClose }: { providerId: string; listing?: Listing; onClose: () => void }) {
  const create = useCreateListing(providerId)
  const update = useUpdateListing(providerId)
  const stages = useStageMasters()
  const families = useFamilies()
  const [stageCodes, setStageCodes] = useState<string[]>(listing?.stages.map((s) => s.code) ?? [])
  const upload = useUploadListingImage(providerId)
  const removeImage = useRemoveListingImage(providerId)
  const [image, setImage] = useState<ImageChange>(NO_IMAGE_CHANGE)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /** Guarda el producto y, después, aplica el cambio de foto. Si la foto falla, el producto ya quedó guardado y se avisa. */
  async function submit(v: Values) {
    setSaving(true)
    setSaveError(null)
    try {
      const price = String(v.price).trim() === '' ? undefined : Number(v.price)
      let id = listing?.id
      if (listing) {
        await update.mutateAsync({
          id: listing.id,
          title: String(v.title).trim(),
          description: nul(v.description),
          assetFamilyCode: String(v.assetFamilyCode),
          price: price ?? null,
          currency: String(v.currency),
          availability: v.availability as Availability,
          stockText: nul(v.stockText),
          stageCodes,
        })
      } else {
        id = (
          await create.mutateAsync({
            title: String(v.title).trim(),
            description: opt(v.description),
            assetFamilyCode: String(v.assetFamilyCode),
            price,
            currency: String(v.currency),
            availability: v.availability as Availability,
            stockText: opt(v.stockText),
            stageCodes,
          })
        ).id
      }
      try {
        if (id && image.file) await upload.mutateAsync({ id, file: image.file })
        else if (id && image.remove) await removeImage.mutateAsync(id)
      } catch (e) {
        toast.error(`${listing ? 'Producto actualizado' : 'Producto creado como borrador'}, pero la foto no se pudo guardar: ${errorMessage(e) ?? 'error desconocido'}`)
        onClose()
        return
      }
      toast.success(listing ? 'Producto actualizado' : 'Producto creado como borrador')
      onClose()
    } catch (e) {
      setSaveError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title={listing ? 'Editar producto' : 'Nuevo producto'}
      description="Los productos del marketplace son tuyos: no dependen de los modelos del catálogo del ecosistema."
      fields={[
        { name: 'title', label: 'Nombre del producto', required: true, wide: true },
        { name: 'assetFamilyCode', label: 'Categoría', type: 'select', required: true, options: (families.data ?? []).map((f) => ({ value: f.code, label: f.name })), hint: 'Cómo lo encontrarán los compradores.' },
        { name: 'availability', label: 'Disponibilidad', type: 'select', required: true, options: Object.entries(AVAILABILITY_LABELS).map(([value, label]) => ({ value, label })) },
        { name: 'price', label: 'Precio', type: 'number', min: 0, step: '0.01', hint: 'Déjalo vacío para publicarlo «a cotizar».' },
        { name: 'currency', label: 'Moneda', type: 'select', required: true, options: CURRENCIES.map((c) => ({ value: c, label: c })) },
        { name: 'stockText', label: 'Stock comercial', placeholder: '40 unidades' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      initial={
        listing
          ? { title: listing.title, assetFamilyCode: listing.family.code, availability: listing.availability, price: listing.price === null ? '' : String(listing.price), currency: listing.currency, stockText: listing.stockText ?? '', description: listing.description ?? '' }
          : { availability: 'ON_REQUEST', currency: 'USD' }
      }
      submitLabel={listing ? 'Guardar cambios' : 'Crear producto'}
      busy={saving}
      error={saveError}
      extra={
        <>
        <ImagePicker label="Foto del producto" currentUrl={listing?.imageUrl ?? null} value={image} onChange={setImage} />
        <CheckGroup
          legend="Etapas relacionadas"
          options={(stages.data ?? []).map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))}
          value={stageCodes}
          onChange={setStageCodes}
          help="Para publicar el producto necesitas al menos una etapa."
        />
        </>
      }
      onClose={onClose}
      onSubmit={(v) => void submit(v)}
    />
  )
}

export function ProductsPage() {
  const { provider } = useProviderContext()
  const providerId = provider!.id
  const active = provider!.status === 'ACTIVE'
  const dash = useProviderDashboard(providerId)
  const update = useUpdateListing(providerId)
  const [view, setView] = useState<View>('ALL')
  const [search, setSearch] = useState('')
  const q = useDebouncedValue(search.trim())
  const [form, setForm] = useState<{ listing?: Listing } | null>(null)
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
          <Button onClick={() => setForm({})} disabled={!active} title={active ? undefined : 'Disponible cuando el administrador apruebe tu empresa'}>
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
                        <Button size="xs" variant="outline" aria-label={`Editar ${l.title}`} onClick={() => setForm({ listing: l })}>
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

      {form && <ProductFormDialog providerId={providerId} listing={form.listing} onClose={() => setForm(null)} />}
    </>
  )
}
