import { ImagePlus, Trash2, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { IMAGE_TYPES, NO_IMAGE_CHANGE, validateImageFile, type ImageChange } from '@/lib/image-file'
import { imageSrc } from '@/lib/media'

/**
 * Selector de una imagen (foto de producto o logo): muestra la actual, permite elegir otra, ver cómo quedará y quitarla.
 * No sube nada: entrega el cambio a quien lo usa, que lo envía al guardar.
 */
export function ImagePicker({ label, currentUrl, value, onChange }: { label: string; currentUrl: string | null; value: ImageChange; onChange: (v: ImageChange) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // La vista previa es un object URL: se libera al cambiar de archivo o al cerrar, para no acumular memoria.
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const current = imageSrc(currentUrl)
  const shown = preview ?? (value.remove ? null : current)

  function pick(file: File | undefined) {
    if (!file) return
    const problem = validateImageFile(file)
    setError(problem)
    if (!problem) {
      setPreview(URL.createObjectURL(file))
      onChange({ file, remove: false })
    }
    if (input.current) input.current.value = ''
  }

  function discard() {
    setError(null)
    setPreview(null)
    onChange({ file: null, remove: !!currentUrl })
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-4 rounded-lg border border-dashed border-border bg-fur-gray-50 p-3">
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white">
          {shown ? <img src={shown} alt={label} className="size-full object-contain" /> : <ImagePlus className="size-7 text-fur-gray-500" aria-hidden />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {value.file ? `Se subirá «${value.file.name}» al guardar.` : value.remove ? 'Se quitará al guardar.' : current ? 'Imagen actual.' : 'Aún no hay imagen.'} PNG, JPG o WebP, hasta 5 MB.
          </p>
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" aria-label={`Elegir ${label.toLowerCase()}`} onChange={(e) => pick(e.target.files?.[0])} />
            <Button type="button" size="xs" variant="secondary" onClick={() => input.current?.click()}>
              <ImagePlus /> {current || value.file ? 'Cambiar' : 'Elegir imagen'}
            </Button>
            {(value.file || (current && !value.remove)) && (
              <Button type="button" size="xs" variant="outline" onClick={discard}>
                <Trash2 /> {value.file && current ? 'Descartar y quitar' : value.file ? 'Descartar' : 'Quitar'}
              </Button>
            )}
            {value.remove && current && (
              <Button type="button" size="xs" variant="outline" onClick={() => onChange(NO_IMAGE_CHANGE)}>
                <Undo2 /> Conservar la actual
              </Button>
            )}
          </div>
          {error && <p role="alert" className="text-xs text-fur-red-500">{error}</p>}
        </div>
      </div>
    </div>
  )
}
