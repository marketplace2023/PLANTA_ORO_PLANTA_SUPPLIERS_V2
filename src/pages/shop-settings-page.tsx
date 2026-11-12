import { ShippingZonesEditor } from '@/components/shipping-zones-editor'
import type { ShippingZone } from '@/lib/commerce'
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, jsonBody } from '@/lib/api';
import { useProviderContext } from '@/features/organizations/provider-context';
import { Failed, Loading, Panel, ScreenHeader } from '@/components/kit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
type Settings = {
    shippingZones?:ShippingZone[];
    bank: string;
    beneficiary: string;
    account: string;
    instructions: string;
    currency: string;
    shippingFee: number;
    coverage: string;
};
export function ShopSettingsPage() { const { provider } = useProviderContext(); const path = `/providers/${provider!.id}/commerce/settings`; const q = useQuery({ queryKey: ['commerce', 'settings', provider!.id], queryFn: () => api<{
        settings: Settings | null;
    }>(path) }); if (q.isLoading)
    return <Loading rows={5}/>; if (q.isError)
    return <Failed what="la configuración" onRetry={() => void q.refetch()}/>; return <Editor key={path} path={path} settings={q.data?.settings ?? null}/>; }
function Editor({ path, settings }: {
    path: string;
    settings: Settings | null;
}) { const [value, setValue] = useState<Settings>(settings ?? { bank: '', beneficiary: '', account: '', instructions: '', currency: 'USD', shippingFee: 0, coverage: '' }), [error, setError] = useState(''), [saved, setSaved] = useState(false); const save = useMutation({ mutationFn: () => api(path, { method: 'PATCH', ...jsonBody({...value,shippingZones:(value.shippingZones??[]).map(z=>({...z,cities:z.cities.map(c=>c.trim()).filter(Boolean)}))}) }), onSuccess: () => { setSaved(true); setError(''); }, onError: (e: Error) => setError(e.message) }); return <><ScreenHeader title="Transferencias y entregas" description="Los compradores reciben estas instrucciones al crear su pedido. Tu tienda verifica y confirma cada transferencia."/><Panel title="Datos de la tienda"><form className="grid max-w-3xl gap-5" onSubmit={e => { e.preventDefault(); setSaved(false); save.mutate(); }}>{(['bank', 'beneficiary', 'account'] as const).map(key => <label key={key} className="space-y-2 text-sm font-medium">{{ bank: 'Banco', beneficiary: 'Titular / beneficiario', account: 'Cuenta y datos para transferir' }[key]}<Input required maxLength={key === 'account' ? 160 : 200} value={value[key]} onChange={e => setValue(v => ({ ...v, [key]: e.target.value }))}/></label>)}<div className="grid gap-4 sm:grid-cols-2"><label className="space-y-2 text-sm">Moneda<select className="shop-select" value={value.currency} onChange={e => setValue(v => ({ ...v, currency: e.target.value }))}>{['USD', 'VES', 'PEN', 'EUR', 'CLP', 'ARS'].map(c => <option key={c}>{c}</option>)}</select></label><label className="space-y-2 text-sm">Costo fijo de envío<Input type="number" required min={0} step="0.01" value={value.shippingFee} onChange={e => setValue(v => ({ ...v, shippingFee: Number(e.target.value) }))}/></label></div><label className="space-y-2 text-sm">Cobertura y condiciones de entrega<Textarea required rows={4} value={value.coverage} onChange={e => setValue(v => ({ ...v, coverage: e.target.value }))} placeholder="Ciudades o regiones atendidas, transportistas y condiciones de entrega."/></label><label className="space-y-2 text-sm">Instrucciones de pago<Textarea rows={4} value={value.instructions} onChange={e => setValue(v => ({ ...v, instructions: e.target.value }))} placeholder="Qué referencia debe indicar el comprador y cómo verificas el pago."/></label><ShippingZonesEditor zones={value.shippingZones??[]} onChange={shippingZones=>setValue(v=>({...v,shippingZones}))}/><p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">Los pedidos conservan una copia de los datos vigentes al comprarlos. Cambiar la cuenta no modifica las instrucciones de pedidos anteriores. Los productos de compra directa deben usar la misma moneda de esta configuración.</p>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}{saved && <p role="status" className="text-sm text-green-600">Configuración guardada</p>}<Button disabled={save.isPending} type="submit">{save.isPending ? 'Guardando…' : 'Guardar configuración'}</Button></form></Panel></>; }
