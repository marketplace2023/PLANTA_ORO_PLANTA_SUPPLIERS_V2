import { CheckCircle2, Clock, FileSearch, Lock, Trophy, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { selectClass } from '@/lib/forms'
import { Empty, Failed, Kpi, Loading, Panel, Pill, ScreenHeader, Segmented } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useProviderContext } from '@/features/organizations/provider-context'
import { useProviderRfqs, useSubmitQuote, useWithdrawQuote, type ProviderRfq, type QuoteStatus } from '@/features/rfqs/use-rfqs'
import { ApiError } from '@/lib/api'
import { formatDate, formatDateTime, formatMoney, formatQuantity } from '@/lib/format'

type View = 'TODO' | 'PENDING' | 'QUOTED' | 'CLOSED'

const CURRENCIES = ['USD', 'PEN', 'CLP', 'ARS', 'EUR']
const PRIORITY: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Prioridad baja', color: 'var(--fur-steel-500)' },
  MEDIUM: { label: 'Prioridad media', color: 'var(--fur-blue-500)' },
  HIGH: { label: 'Prioridad alta', color: 'var(--fur-orange-500)' },
  URGENT: { label: 'Urgente', color: 'var(--fur-red-500)' },
}
const QUOTE_STATUS: Record<QuoteStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  SUBMITTED: { label: 'Cotización enviada', color: 'var(--fur-green-500)', icon: CheckCircle2 },
  AWARDED: { label: 'Adjudicada a ti', color: 'var(--fur-gold-600)', icon: Trophy },
  REJECTED: { label: 'No adjudicada', color: 'var(--fur-steel-500)', icon: XCircle },
  WITHDRAWN: { label: 'Retirada', color: 'var(--fur-steel-500)', icon: XCircle },
}
const RFQ_STATUS: Record<ProviderRfq['status'], string> = { OPEN: 'Abierta', AWARDED: 'Adjudicada', CANCELLED: 'Cancelada' }

function QuoteForm({ providerId, rfq }: { providerId: string; rfq: ProviderRfq }) {
  const submit = useSubmitQuote(providerId, rfq.id)
  const withdraw = useWithdrawQuote(providerId, rfq.id)
  const mine = rfq.myQuote
  const active = mine?.status === 'SUBMITTED'
  const [currency, setCurrency] = useState(mine?.currency ?? 'USD')
  const [total, setTotal] = useState(mine ? String(mine.totalAmount) : '')
  const [days, setDays] = useState(mine ? String(mine.deliveryDays) : '')
  const [conditions, setConditions] = useState(mine?.conditions ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!(Number(total) > 0)) next.totalAmount = 'Indica un monto mayor que cero'
    if (days === '' || !Number.isInteger(Number(days)) || Number(days) < 0) next.deliveryDays = 'Días enteros (0 o más)'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    try {
      await submit.mutateAsync({ currency, totalAmount: Number(total), deliveryDays: Number(days), conditions: conditions.trim() || undefined })
      toast.success(active ? 'Cotización actualizada' : 'Cotización enviada')
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) setErrors(Object.fromEntries(err.fieldErrors.map((f) => [f.path, f.message])))
      else setErrors({ _form: err instanceof ApiError ? err.message : 'No se pudo enviar la cotización.' })
    }
  }

  const err = (k: string) => errors[k] && <p className="text-xs text-fur-red-500">{errors[k]}</p>
  return (
    <form onSubmit={onSubmit} noValidate aria-label={`Cotizar ${rfq.code}`} className="space-y-3 rounded-lg border border-border bg-fur-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor={`cur-${rfq.id}`} className="text-xs">Moneda</Label>
          <select id={`cur-${rfq.id}`} className={selectClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`tot-${rfq.id}`} className="text-xs">Monto total</Label>
          <Input id={`tot-${rfq.id}`} type="number" min={0} step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} aria-invalid={!!errors.totalAmount} />
          {err('totalAmount')}
        </div>
        <div className="space-y-1">
          <Label htmlFor={`day-${rfq.id}`} className="text-xs">Plazo de entrega (días)</Label>
          <Input id={`day-${rfq.id}`} type="number" min={0} step={1} value={days} onChange={(e) => setDays(e.target.value)} aria-invalid={!!errors.deliveryDays} />
          {err('deliveryDays')}
        </div>
        <div className="space-y-1 sm:col-span-4">
          <Label htmlFor={`con-${rfq.id}`} className="text-xs">Condiciones (opcional)</Label>
          <Textarea id={`con-${rfq.id}`} rows={2} value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Forma de pago, garantía, validez de la oferta…" />
        </div>
      </div>
      {errors._form && <p role="alert" className="text-sm text-fur-red-500">{errors._form}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={submit.isPending}>{active ? 'Actualizar cotización' : 'Enviar cotización'}</Button>
        {active && (
          <Button type="button" size="sm" variant="outline" disabled={withdraw.isPending} onClick={() => withdraw.mutate(undefined, { onSuccess: () => toast.success('Cotización retirada'), onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudo retirar') })}>
            Retirar cotización
          </Button>
        )}
      </div>
    </form>
  )
}

function RfqCard({ providerId, rfq }: { providerId: string; rfq: ProviderRfq }) {
  const pr = PRIORITY[rfq.priority] ?? { label: rfq.priority, color: 'var(--fur-steel-500)' }
  const q = rfq.myQuote ? QUOTE_STATUS[rfq.myQuote.status] : null
  const open = rfq.status === 'OPEN' && rfq.acceptsQuotes
  return (
    <Panel
      title={`${rfq.code} · ${rfq.plant.name}${rfq.plant.countryCode ? ` (${rfq.plant.countryCode})` : ''}`}
      subtitle={`Vence ${formatDateTime(rfq.deadlineAt)}${rfq.neededBy ? ` · requerida para ${formatDate(rfq.neededBy)}` : ''}`}
      action={
        <div className="flex flex-wrap justify-end gap-1.5">
          <Pill label={pr.label} color={pr.color} />
          <Pill label={RFQ_STATUS[rfq.status]} color={rfq.status === 'OPEN' ? 'var(--fur-blue-500)' : 'var(--fur-steel-500)'} />
          {q && <Pill label={q.label} color={q.color} icon={q.icon} />}
        </div>
      }
    >
      <ul className="mb-4 divide-y divide-border rounded-lg border border-border text-sm" aria-label="Productos solicitados">
        {rfq.lines.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <span>{l.description}</span>
            <span className="shrink-0 font-semibold text-fur-navy-900 tabular-nums">{formatQuantity(l.quantity)} {l.uom}</span>
          </li>
        ))}
      </ul>
      {open ? (
        <QuoteForm providerId={providerId} rfq={rfq} />
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden />
          {rfq.myQuote ? `Tu cotización: ${formatMoney(rfq.myQuote.totalAmount, rfq.myQuote.currency)} en ${rfq.myQuote.deliveryDays} días.` : 'Esta solicitud ya no acepta cotizaciones.'}
        </p>
      )}
    </Panel>
  )
}

export function RfqsPage() {
  const { provider } = useProviderContext()
  const providerId = provider!.id
  const q = useProviderRfqs(providerId)
  const [view, setView] = useState<View>('PENDING')

  const all = q.data ?? []
  const isOpen = (r: ProviderRfq) => r.status === 'OPEN' && r.acceptsQuotes
  const pending = all.filter((r) => isOpen(r) && r.myQuote?.status !== 'SUBMITTED')
  const quoted = all.filter((r) => r.myQuote?.status === 'SUBMITTED' && isOpen(r))
  const closed = all.filter((r) => !isOpen(r))
  const shown = view === 'TODO' ? all : view === 'PENDING' ? pending : view === 'QUOTED' ? quoted : closed

  return (
    <>
      <ScreenHeader title="Cotizaciones" description="Solicitudes de las plantas a las que te invitaron. Ves solo lo necesario para cotizar: productos, cantidades y fechas." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Por responder" value={q.data ? pending.length : '—'} icon={Clock} tone={pending.length > 0 ? 'warning' : 'ok'} hint="Aceptan cotización" />
        <Kpi label="Cotizadas" value={q.data ? quoted.length : '—'} icon={CheckCircle2} tone="ok" hint="Esperando decisión" />
        <Kpi label="Cerradas" value={q.data ? closed.length : '—'} icon={FileSearch} hint="Adjudicadas o vencidas" />
      </div>

      <div className="mt-6">
        <Segmented<View>
          label="Solicitudes"
          value={view}
          onChange={setView}
          options={[
            { value: 'PENDING', label: 'Por responder', count: pending.length },
            { value: 'QUOTED', label: 'Cotizadas', count: quoted.length },
            { value: 'CLOSED', label: 'Cerradas', count: closed.length },
            { value: 'TODO', label: 'Todas', count: all.length },
          ]}
        />
      </div>

      <div className="mt-3 space-y-4">
        {q.isLoading ? (
          <Loading rows={4} />
        ) : q.isError ? (
          <Panel><Failed what="las solicitudes" onRetry={() => void q.refetch()} /></Panel>
        ) : shown.length > 0 ? (
          shown.map((r) => <RfqCard key={r.id} providerId={providerId} rfq={r} />)
        ) : (
          <Panel><Empty>{all.length === 0 ? 'Aún no has recibido solicitudes de cotización.' : 'No hay solicitudes en esta vista.'}</Empty></Panel>
        )}
      </div>
    </>
  )
}
