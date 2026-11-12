import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, ImagePlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useFamilies } from '@/features/catalog/use-catalog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Panel } from '@/components/kit';
type Preview = {
    fingerprint: string;
    issues: Array<{
        sheet: string;
        row: number;
        message: string;
    }>;
    summary?: {
        products: number;
        variants: number;
        specifications: number;
        images: number;
    };
    rows: Array<{
        reference?: string;
        title: string;
        family?: string;
        file?: string;
        sku?: string;
        replacing?: boolean;
        variants?: Array<{
            sku: string;
            name: string;
            price: number;
            stock: number;
        }>;
    }>;
    created?: Array<{
        id: string;
        reference: string;
        title: string;
    }>;
    uploaded?: number;
};
function Photo({ file }: {
    file: File;
}) { const [url] = useState(() => URL.createObjectURL(file)); useEffect(() => () => URL.revokeObjectURL(url), [url]); return <img src={url} alt={file.name} className="size-14 shrink-0 rounded-lg bg-muted object-contain"/>; }
export function ShopImportPanel({ providerId, imagesOnly = false }: {
    providerId: string;
    imagesOnly?: boolean;
}) {
    const client = useQueryClient(), families = useFamilies();
    const [file, setFile] = useState<File | null>(null), [images, setImages] = useState<File[]>([]), [replace, setReplace] = useState(false), [preview, setPreview] = useState<Preview | null>(null), [error, setError] = useState(''), [confirmed, setConfirmed] = useState(false);
    const path = `/providers/${providerId}/commerce/imports${imagesOnly ? '/images' : ''}`;
    const mutation = useMutation({ mutationFn: (commit: boolean) => { const body = new FormData(); if (file && !imagesOnly)
            body.append('file', file); for (const photo of images)
            body.append('images', photo); if (imagesOnly)
            body.append('replace', String(replace)); if (commit && preview)
            body.append('fingerprint', preview.fingerprint); return api<Preview>(path + (commit ? '' : '/preview'), { method: 'POST', body }); }, onSuccess: (result, commit) => { setPreview(result); setError(''); setConfirmed(commit); if (commit) {
            void client.invalidateQueries({ queryKey: ['org'] });
            void client.invalidateQueries({ queryKey: ['commerce'] });
        } }, onError: (e: Error) => { setError(e.message); setPreview(null); } });
    const reset = () => { setPreview(null); setConfirmed(false); setError(''); mutation.reset(); };
    const selectImages = (files: FileList | null) => { reset(); const next = Array.from(files ?? []); if (next.length > 40 || next.some(f => f.size > 5 * 1024 * 1024) || next.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024) {
        setError('Máximo 40 imágenes, 5 MB por archivo y 50 MB por lote.');
        setImages([]);
        return;
    } setImages(next); };
    return <Panel title={imagesOnly ? 'Portadas para productos existentes' : 'Importación Excel de productos'} subtitle={imagesOnly ? 'Relaciona cada foto con el SKU de una variante de tu tienda.' : 'Un análisis completo antes de guardar. Los productos se crean como borradores.'}>
  <div className="space-y-5">
   <div className="flex items-start gap-3 rounded-xl bg-muted p-4 text-sm"><span className="rounded-lg bg-card p-2">{imagesOnly ? <ImagePlus className="size-5"/> : <FileSpreadsheet className="size-5"/>}</span><p className="leading-relaxed">{imagesOnly ? 'Nombra cada archivo con su SKU: BOMBA-001.jpg. El sistema busca únicamente en tus productos. Puedes revisar las coincidencias antes de confirmar.' : 'Completa las hojas Productos, Variantes, Especificaciones e Imagenes. Cada producto requiere una variante, una especificación técnica y una portada. No se crean ni modifican modelos del catálogo.'}</p></div>
   {!imagesOnly && <><Button variant="outline" asChild><a href="/templates/plantilla-productos-tienda.xlsx" download><Download /> Descargar plantilla Excel</a></Button><details className="rounded-xl border border-border p-4 text-sm"><summary className="cursor-pointer font-medium">Instrucciones y códigos de categoría</summary><div className="mt-3 space-y-3 text-muted-foreground"><p>Máximo 200 productos. Conserva las hojas y columnas; usa números en precio y stock. Las fórmulas, SKU duplicados, referencias desconocidas e imágenes faltantes bloquean la carga completa.</p><p>Tipos técnicos: NUMBER, TEXT, BOOLEAN, LIST y RANGE. En LIST, RANGE y BOOLEAN utiliza JSON, como indica la plantilla. El archivo debe ser .xlsx de hasta 5 MB.</p>{families.isError ? <p>No se pudieron cargar las categorías.</p> : <ul className="max-h-48 space-y-1 overflow-y-auto">{families.data?.map(f => <li key={f.code}><code className="font-semibold text-foreground">{f.code}</code> — {f.name}</li>)}</ul>}</div></details><label className="block space-y-2 text-sm font-medium">Archivo Excel<Input type="file" accept=".xlsx" disabled={mutation.isPending} onChange={e => { reset(); const next = e.target.files?.[0] ?? null; if (next && next.size > 5 * 1024 * 1024) {
        setFile(null);
        setError('El Excel admite hasta 5 MB.');
    }
    else
        setFile(next); }}/></label></>}
   <label className="block space-y-2 text-sm font-medium">{imagesOnly ? 'Imágenes por SKU' : 'Imágenes indicadas en el Excel'}<Input type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={mutation.isPending} onChange={e => selectImages(e.target.files)}/></label>
   <p className="text-xs text-muted-foreground">JPG, PNG o WebP, hasta 5 MB cada una. Máximo 40 archivos y 50 MB por lote. Las fotos se adjuntan por separado; no uses imágenes incrustadas ni enlaces externos en Excel.</p>
   {!!images.length && <ul className="grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">{images.map((photo, i) => <li key={`${photo.name}:${photo.lastModified}:${photo.size}:${i}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-2"><Photo file={photo}/><span className="truncate text-xs" title={photo.name}>{photo.name}</span></li>)}</ul>}
   {imagesOnly && <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={mutation.isPending} checked={replace} onChange={e => { reset(); setReplace(e.target.checked); }}/>Reemplazar portadas existentes. Requiere volver a analizar las imágenes.</label>}
   {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">{error}</p>}
   {preview && <div className="space-y-4" aria-live="polite">{preview.summary && <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-4">{[['Productos', preview.summary.products], ['Variantes', preview.summary.variants], ['Especificaciones', preview.summary.specifications], ['Imágenes', preview.summary.images]].map(([label, value]) => <p key={label}><strong className="block text-xl tabular-nums">{value}</strong>{label}</p>)}</div>}
    {preview.issues.length ? <div role="alert" className="space-y-2 rounded-xl border border-red-500/30 p-4"><strong className="text-sm">Corrige {preview.issues.length} errores para continuar</strong><ul className="max-h-64 space-y-2 overflow-y-auto text-sm">{preview.issues.map((issue, i) => <li key={i}><span className="font-semibold">{issue.sheet} · fila {issue.row}:</span> {issue.message}</li>)}</ul></div> : <p className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300"><CheckCircle2 className="size-4"/>{confirmed ? 'Carga completada.' : 'Análisis correcto. Revisa los productos y confirma la carga.'}</p>}
    <div className="max-h-80 overflow-auto rounded-xl border border-border"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-muted"><tr><th className="p-3">{imagesOnly ? 'Archivo / SKU' : 'Referencia'}</th><th className="p-3">Producto</th><th className="p-3">{imagesOnly ? 'Acción' : 'Variantes / precio / stock'}</th></tr></thead><tbody>{preview.rows.map((row, i) => <tr key={i} className="border-t border-border"><td className="p-3">{imagesOnly ? `${row.file} / ${row.sku}` : row.reference}</td><td className="p-3">{row.title}<small className="block text-muted-foreground">{row.family}</small></td><td className="p-3">{imagesOnly ? (row.replacing ? 'Reemplazar portada' : 'Agregar portada') : row.variants?.map(v => <p key={v.sku}>{v.sku} · {v.name} · {v.price} · {v.stock} unidades</p>)}</td></tr>)}</tbody></table></div>
    {!!preview.created?.length && <ul className="space-y-2 text-sm">{preview.created.map(p => <li key={p.id}><Link className="inline-flex items-center gap-2 font-medium underline" to={`/products/${p.id}/edit`}>{p.title} <ArrowRight className="size-3"/></Link></li>)}</ul>}
   </div>}
   <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={mutation.isPending || (!imagesOnly && !file) || (imagesOnly && !images.length) || confirmed} onClick={() => mutation.mutate(false)}>{mutation.isPending ? 'Procesando…' : 'Analizar archivos'}</Button><Button disabled={!preview || !!preview.issues.length || mutation.isPending || confirmed} onClick={() => mutation.mutate(true)}>{confirmed ? 'Carga completada' : 'Confirmar carga'}</Button></div>
   <p className="text-xs text-muted-foreground">Se comprueban nuevamente archivos, permisos y datos al confirmar. Un error cancela el lote completo. Cambiar el Excel, las imágenes o la opción de reemplazo invalida el análisis anterior.</p>
  </div>
 </Panel>;
}
