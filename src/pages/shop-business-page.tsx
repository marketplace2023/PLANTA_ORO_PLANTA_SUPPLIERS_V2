import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, apiBlob, jsonBody } from '@/lib/api';
import { useProviderContext } from '@/features/organizations/provider-context';
import { Button } from '@/components/ui/button';
import { ScreenHeader, Panel } from '@/components/kit';
import { ShopImportPanel } from '@/components/shop-import-panel';
export function ShopBusinessPage() {
    const { provider } = useProviderContext();
    const [error, setError] = useState('');
    const path = `/providers/${provider!.id}/commerce`;
    const staff = useQuery({ queryKey: ['commerce', 'staff', provider!.id], queryFn: () => api<Array<{
            userId: string;
            name: string;
            email: string;
            membership: string;
            role: string | null;
        }>>(`${path}/staff`), retry: false });
    const role = useMutation({ mutationFn: ({ userId, role }: {
            userId: string;
            role: string;
        }) => api(`${path}/staff/${userId}`, { method: 'PATCH', ...jsonBody({ role }) }), onSuccess: () => void staff.refetch(), onError: (e: Error) => setError(e.message) });
    async function download(kind: string) {
        try {
            const blob = await apiBlob(`${path}/reports?kind=${kind}`), url = URL.createObjectURL(blob), a = document.createElement('a');
            a.href = url;
            a.download = `${kind}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo exportar');
        }
    }
    return <div className="space-y-6"><ScreenHeader title="Herramientas de la tienda" description="Importación, reportes y acceso del equipo."/>{error && <p role="alert" className="rounded-xl bg-muted p-4 text-sm text-red-600">{error}</p>}<ShopImportPanel key={`${provider!.id}:excel`} providerId={provider!.id}/><ShopImportPanel key={`${provider!.id}:images`} providerId={provider!.id} imagesOnly/><Panel title="Reportes descargables"><p className="mb-4 text-sm text-muted-foreground">CSV con los últimos 10.000 pedidos o variantes. Los reportes no incluyen datos bancarios ni contactos de compradores.</p><div className="flex gap-3"><Button variant="outline" onClick={() => void download('orders')}>Exportar pedidos</Button><Button variant="outline" onClick={() => void download('inventory')}>Exportar inventario</Button></div></Panel><Panel title="Permisos del equipo"><p className="mb-4 text-sm text-muted-foreground">El responsable administra estos permisos. Añade personas desde Equipo y asigna aquí su función. Los miembros anteriores conservan su acceso hasta que asignes un rol.</p>{staff.isError ? <p className="text-sm text-muted-foreground">Solo el responsable o administrador puede modificar roles.</p> : staff.isLoading ? <p>Cargando equipo…</p> : <div className="space-y-3">{staff.data?.map(member => <label key={member.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"><span className="text-sm">{member.name}<small className="block text-muted-foreground">{member.email}</small></span>{member.membership === 'OWNER' ? <strong className="text-sm">Responsable · acceso completo</strong> : <select className="shop-select max-w-64" aria-label={`Rol de ${member.name}`} value={member.role ?? ''} disabled={role.isPending} onChange={e => role.mutate({ userId: member.userId, role: e.target.value })}><option value="" disabled>Acceso anterior sin limitar</option><option value="CATALOG">Catálogo y productos</option><option value="SALES">Ventas, atención y reportes</option><option value="FINANCE">Pagos y reportes</option><option value="SUPPORT">Atención y garantías</option><option value="VIEWER">Solo consulta</option></select>}</label>)}</div>}</Panel></div>;
}
