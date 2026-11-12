import { CommandDeck, RadialMetric } from '@/components/ui/studio'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowRight, BadgeCheck, CheckCircle2, Circle, FileSearch, ImageIcon, Package, Star, Tag, FilePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarRows, DataTable, Empty, Failed, Kpi, Loading, Panel, Pill, Progress, ScreenHeader, td, type BarRow } from '@/components/kit'
import { useProviderContext } from '@/features/organizations/provider-context'
import { useProvider, useProviderDashboard, useProviderListings } from '@/features/organizations/use-organizations'
import { useProviderRfqs } from '@/features/rfqs/use-rfqs'
import { formatDate, formatDateTime } from '@/lib/format'
import { imageSrc } from '@/lib/media'
import { LISTING_STATUS_LABELS, priceText, ratingText } from '@/lib/organizations'

export function DashboardPage() {
  const { provider } = useProviderContext()
  const id = provider!.id
  const sales = useQuery({queryKey:['commerce','summary',id],queryFn:()=>api<{paymentReview:number;toShip:number;quotes:number;salesByCurrency:Record<string,number>}>(`/providers/${id}/commerce/summary`),refetchOnWindowFocus:true})
  const amounts = Object.entries(sales.data?.salesByCurrency??{}).map(([currency,total])=>`${currency} ${total.toFixed(2)}`).join(' / ')
  const dash = useProviderDashboard(id)
  const detail = useProvider(id)
  const rfqs = useProviderRfqs(id)
  const recent = useProviderListings(id, {}, 5)
  const d = dash.data
  const p = detail.data ?? provider!

  // Solicitudes que todavía aceptan cotización y a las que no he enviado una vigente.
  const toAnswer = (rfqs.data ?? []).filter((r) => r.status === 'OPEN' && r.acceptsQuotes && r.myQuote?.status !== 'SUBMITTED')
  const open = (rfqs.data ?? []).filter((r) => r.status === 'OPEN' && r.acceptsQuotes)

  const checklist: Array<{ label: string; done: boolean }> = [
    { label: 'Descripción de la empresa', done: !!p.description },
    { label: 'Ciudad', done: !!p.city },
    { label: 'Sitio web', done: !!p.website },
    { label: 'Correo de contacto', done: !!p.contactEmail },
    { label: 'Logo', done: !!p.logoUrl },
    { label: 'Certificaciones', done: p.certifications.length > 0 },
    { label: 'Etapas que cubres', done: p.stages.length > 0 },
    { label: 'Familias de equipos que atiendes', done: p.families.length > 0 },
  ]
  const doneCount = checklist.filter((c) => c.done).length
  const pct = Math.round((doneCount / checklist.length) * 100)

  const rows: BarRow[] = [
    { key: 'ACTIVE', label: 'Publicados', value: d?.listingsActive ?? 0, color: 'var(--fur-green-500)', icon: CheckCircle2 },
    { key: 'DRAFT', label: 'Borradores', value: d?.listingsDraft ?? 0, color: 'var(--fur-steel-500)', icon: FilePen },
    { key: 'ARCHIVED', label: 'Archivados', value: d?.listingsArchived ?? 0, color: 'var(--fur-orange-500)', icon: Package },
  ]

  return (
    <div className="studio-dashboard seller-dashboard">
      <ScreenHeader title="Centro de ventas" description={`Estado de ${provider!.organizationName} en el marketplace.`} />

      <CommandDeck eyebrow="Marketplace FUR / Portal de vendedores" title="Tu tienda, en un solo lugar." description="Productos propios, pedidos y cotizaciones. Dale seguimiento a cada venta y prepara tu siguiente entrega." metric={<><RadialMetric value={doneCount} total={checklist.length} label="Perfil comercial completo" /><span className="radial-caption">Tu perfil comercial</span></>} actions={[
        {to:'/products/new',title:'Publicar un producto',description:'Crea tu ficha, variantes e inventario',icon:Package},
        {to:'/orders',title:'Gestionar pedidos',description:'Revisa cobros, conversaciones y entregas',icon:FileSearch},
        {to:'/shop-settings',title:'Configurar mi tienda',description:'Transferencias y zonas de envío',icon:Tag},
      ]} />
      {sales.isError ? <p className="mb-5 text-sm text-muted-foreground">No se pudieron cargar los indicadores de pedidos. <button className="underline" onClick={()=>void sales.refetch()}>Reintentar</button></p> : <div className="seller-sales-grid mb-5"><Kpi label="Cobros por verificar" value={sales.isLoading?'—':sales.data?.paymentReview??0} icon={FileSearch} to="/orders" hint="Transferencias informadas por compradores" /><Kpi label="Preparar y despachar" value={sales.isLoading?'—':sales.data?.toShip??0} icon={Package} to="/orders" /><Kpi label="Ventas con pago confirmado" value={sales.isLoading?'—':amounts||'Sin cobros confirmados'} icon={Tag} to="/orders" hint="Incluye envíos; no incluye reembolsos confirmados" /><Kpi label="Cotizaciones del marketplace" value={sales.isLoading?'—':sales.data?.quotes??0} icon={FileSearch} to="/orders" /></div>}
      <div className="seller-health-grid">
        <Kpi label="Publicados" value={d?.listingsActive ?? '—'} icon={Package} to="/products" tone="ok" hint="Visibles en el marketplace" />
        <Kpi label="Borradores" value={d?.listingsDraft ?? '—'} icon={FilePen} to="/products" tone={d && d.listingsDraft > 0 ? 'warning' : 'default'} hint={d && d.listingsDraft > 0 ? 'Pendientes de publicar' : 'Sin pendientes'} />
        <Kpi label="A cotizar" value={d?.onRequestPricing ?? '—'} icon={Tag} hint="Productos sin precio publicado" />
        <Kpi label="Cotizaciones por responder" value={rfqs.data ? toAnswer.length : '—'} icon={FileSearch} to="/rfqs" tone={toAnswer.length > 0 ? 'warning' : 'ok'} hint={rfqs.data ? `${open.length} abierta${open.length === 1 ? "" : "s"} en total` : undefined} />
        <Kpi label="Calificación" value={p.rating === null ? '—' : p.rating.toFixed(1)} icon={Star} hint={ratingText(p.rating)} />
        <Kpi label="Verificación" value={p.verified ? 'Verificada' : 'Sin verificar'} icon={BadgeCheck} tone={p.verified ? 'ok' : 'default'} hint={p.verified ? 'Sello del administrador' : 'La concede el administrador'} />
      </div>

      <div className="seller-operations-grid">
        <Panel title="Tus productos por estado">{dash.isLoading ? <Loading rows={3} /> : dash.isError ? <Failed onRetry={() => void dash.refetch()} /> : <BarRows rows={rows} empty="Aún no tienes productos" />}</Panel>

        <Panel title="Perfil de la empresa" subtitle={`${doneCount} de ${checklist.length} datos completos`} action={<Link to="/profile" className="inline-flex items-center gap-1 text-xs font-semibold text-fur-navy-900 hover:underline">Completar <ArrowRight className="size-3.5" /></Link>}>
          <Progress pct={pct} label="Perfil completo" />
          <ul className="mt-3 space-y-1.5 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                {c.done ? <CheckCircle2 className="size-4 text-fur-green-500" aria-hidden /> : <Circle className="size-4 text-fur-gray-300" aria-hidden />}
                <span className={c.done ? 'text-fur-gray-800' : 'text-muted-foreground'}>{c.label}</span>
                <span className="sr-only">{c.done ? 'completo' : 'pendiente'}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Solicitudes de cotización" subtitle="Abiertas, de las plantas del ecosistema" flush action={<Link to="/rfqs" className="inline-flex items-center gap-1 text-xs font-semibold text-fur-navy-900 hover:underline">Ver todas <ArrowRight className="size-3.5" /></Link>}>
          {rfqs.isLoading ? (
            <div className="p-4"><Loading rows={3} /></div>
          ) : rfqs.isError ? (
            <Failed onRetry={() => void rfqs.refetch()} />
          ) : open.length > 0 ? (
            <ul className="divide-y divide-border">
              {open.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="fur-code block text-xs text-muted-foreground">{r.code}</span>
                    <span className="block truncate font-medium text-fur-navy-900">{r.plant.name}</span>
                    <span className="text-xs text-muted-foreground">Vence {formatDateTime(r.deadlineAt)}</span>
                  </span>
                  {r.myQuote?.status === 'SUBMITTED' ? <Pill label="Cotizada" color="var(--fur-green-500)" icon={CheckCircle2} /> : <Pill label="Por responder" color="var(--fur-orange-500)" />}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No hay solicitudes abiertas.</Empty>
          )}
        </Panel>
      </div>

      <Panel title="Últimos productos" className="mt-6" flush action={<Link to="/products" className="inline-flex items-center gap-1 text-xs font-semibold text-fur-navy-900 hover:underline">Gestionar productos <ArrowRight className="size-3.5" /></Link>}>
        {recent.isLoading ? (
          <div className="p-4"><Loading rows={3} /></div>
        ) : recent.data && recent.data.items.length > 0 ? (
          <DataTable head={['Foto', 'Producto', { label: 'Precio', right: true }, 'Estado', 'Actualizado']}>
            {recent.data.items.map((l) => {
              const img = imageSrc(l.imageUrl)
              return (
                <tr key={l.id}>
                  <td className={td}>
                    <span className="grid size-10 place-items-center overflow-hidden rounded-md border border-border bg-white">
                      {img ? <img src={img} alt="" loading="lazy" className="size-full object-contain" /> : <ImageIcon className="size-4 text-fur-gray-500" aria-hidden />}
                    </span>
                  </td>
                  <td className={`${td} font-medium text-fur-navy-900`}>{l.title}<p className="text-xs font-normal text-muted-foreground">{l.family.name}</p></td>
                  <td className={`${td} text-right tabular-nums`}>{priceText(l.price, l.currency)}</td>
                  <td className={td}><Pill label={LISTING_STATUS_LABELS[l.status]} color={l.status === 'ACTIVE' ? 'var(--fur-green-500)' : l.status === 'DRAFT' ? 'var(--fur-steel-500)' : 'var(--fur-orange-500)'} /></td>
                  <td className={td}>{formatDate(l.updatedAt)}</td>
                </tr>
              )
            })}
          </DataTable>
        ) : recent.isError ? <Failed what="los productos" onRetry={() => void recent.refetch()} /> : (
          <Empty>Aún no tienes productos. <Link to="/products" className="font-semibold text-fur-navy-900 underline">Crea el primero</Link>.</Empty>
        )}
      </Panel>
    </div>
  )
}
