import { BadgeCheck, Globe, Info, Mail, MapPin, Pencil, ShieldCheck, Star } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { CheckGroup } from '@/components/check-group'
import { FormDialog, type Values } from '@/components/form-dialog'
import { ImagePicker } from '@/components/image-picker'
import { Empty, Failed, Loading, Panel, Pill, ScreenHeader } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useFamilies, useStageMasters } from '@/features/catalog/use-catalog'
import { useProviderContext } from '@/features/organizations/provider-context'
import { useProvider, useRemoveLogo, useUpdateProvider, useUploadLogo, type ProviderDetail } from '@/features/organizations/use-organizations'
import { ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/forms'
import { NO_IMAGE_CHANGE, type ImageChange } from '@/lib/image-file'
import { imageSrc } from '@/lib/media'
import { countryName, ORG_STATUS_LABELS, parseList, ratingText } from '@/lib/organizations'

const nul = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null)

function EditProfile({ p, onClose }: { p: ProviderDetail; onClose: () => void }) {
  const update = useUpdateProvider(p.id)
  const upload = useUploadLogo(p.id)
  const removeLogo = useRemoveLogo(p.id)
  const [image, setImage] = useState<ImageChange>(NO_IMAGE_CHANGE)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  /** Guarda los datos y, después, aplica el cambio de logo. Si el logo falla, los datos ya quedaron guardados y se avisa. */
  async function submit(v: Values) {
    setSaving(true)
    setSaveError(null)
    try {
      await update.mutateAsync({ city: nul(v.city), description: nul(v.description), website: nul(v.website), contactEmail: nul(v.contactEmail), certifications: parseList(String(v.certifications ?? '')) })
      try {
        if (image.file) await upload.mutateAsync(image.file)
        else if (image.remove) await removeLogo.mutateAsync()
      } catch (e) {
        toast.error(`Perfil actualizado, pero el logo no se pudo guardar: ${errorMessage(e) ?? 'error desconocido'}`)
        onClose()
        return
      }
      toast.success('Perfil actualizado')
      onClose()
    } catch (e) {
      setSaveError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      title="Editar perfil de la empresa"
      fields={[
        { name: 'city', label: 'Ciudad' },
        { name: 'contactEmail', label: 'Correo de contacto', type: 'email', hint: 'Solo lo ven usuarios con sesión iniciada.' },
        { name: 'website', label: 'Sitio web', type: 'url', placeholder: 'https://…', wide: true },
        { name: 'certifications', label: 'Certificaciones', placeholder: 'ISO 9001, OSHA 30', hint: 'Separadas por comas.', wide: true },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      initial={{ city: p.city ?? '', contactEmail: p.contactEmail ?? '', website: p.website ?? '', certifications: p.certifications.join(', '), description: p.description ?? '' }}
      busy={saving}
      error={saveError}
      extra={<ImagePicker label="Logo de la empresa" currentUrl={p.logoUrl} value={image} onChange={setImage} />}
      onClose={onClose}
      onSubmit={(v) => void submit(v)}
    />
  )
}

function EditCoverage({ p, onClose }: { p: ProviderDetail; onClose: () => void }) {
  const update = useUpdateProvider(p.id)
  const stages = useStageMasters()
  const families = useFamilies()
  const [stageCodes, setStageCodes] = useState(p.stages.map((s) => s.code))
  const [familyCodes, setFamilyCodes] = useState(p.families.map((f) => f.code))
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cobertura de la empresa</DialogTitle>
          <DialogDescription>Dónde puedes ayudar: así te encuentran en el directorio de proveedores.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <CheckGroup legend="Etapas del proceso que atiendes" options={(stages.data ?? []).map((s) => ({ value: s.code, label: `${s.code} · ${s.name}` }))} value={stageCodes} onChange={setStageCodes} />
          <CheckGroup legend="Familias de equipos que atiendes" options={(families.data ?? []).map((f) => ({ value: f.code, label: f.name }))} value={familyCodes} onChange={setFamilyCodes} />
          {update.isError && <p role="alert" className="rounded-md bg-fur-red-500/10 p-3 text-sm text-fur-red-500">{update.error instanceof ApiError ? update.error.message : 'No se pudo guardar.'}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={update.isPending} onClick={() => update.mutate({ stageCodes, familyCodes }, { onSuccess: () => { toast.success('Cobertura actualizada'); onClose() } })}>
            {update.isPending ? 'Guardando…' : 'Guardar cobertura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProfilePage() {
  const { provider } = useProviderContext()
  const q = useProvider(provider!.id)
  const [dialog, setDialog] = useState<'profile' | 'coverage' | null>(null)
  const p = q.data

  if (q.isLoading) return <Loading rows={5} />
  if (q.isError || !p) return <Panel><Failed what="el perfil" onRetry={() => void q.refetch()} /></Panel>

  const logo = imageSrc(p.logoUrl)
  const editable = p.canManage && p.status !== 'SUSPENDED'
  const statusColor = p.status === 'ACTIVE' ? 'var(--fur-green-500)' : p.status === 'PENDING' ? 'var(--fur-orange-500)' : 'var(--fur-red-500)'

  return (
    <>
      <ScreenHeader
        title="Perfil de la empresa"
        description="Así te ven los compradores en el directorio y en cada producto."
        actions={editable && <Button onClick={() => setDialog('profile')}><Pencil /> Editar perfil</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-white text-xl font-extrabold text-fur-navy-900">
              {logo ? <img src={logo} alt={`Logo de ${p.organizationName}`} className="size-full object-contain" /> : p.organizationName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-fur-navy-900">{p.organizationName}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{[p.city, countryName(p.countryCode)].filter(Boolean).join(', ')}</span>
                {p.website && <a href={p.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline-offset-2 hover:underline"><Globe className="size-3.5" aria-hidden />{p.website.replace(/^https?:\/\//, '')}</a>}
                {p.contactEmail && <span className="inline-flex items-center gap-1"><Mail className="size-3.5" aria-hidden />{p.contactEmail}</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill label={ORG_STATUS_LABELS[p.status]} color={statusColor} icon={ShieldCheck} />
                {p.verified && <Pill label="Verificada" color="var(--fur-green-500)" icon={BadgeCheck} />}
                <Pill label={ratingText(p.rating)} color="var(--fur-steel-500)" icon={Star} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm whitespace-pre-wrap text-fur-gray-800">{p.description ?? <span className="text-muted-foreground">Aún no has escrito una descripción. Cuéntales a los compradores qué ofreces.</span>}</p>
          {p.certifications.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Certificaciones">
              {p.certifications.map((c) => <li key={c}><Pill label={c} color="var(--fur-navy-700)" icon={ShieldCheck} /></li>)}
            </ul>
          )}
        </Panel>

        <Panel title="Datos registrados" subtitle="Los fija el administrador del ecosistema">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-muted-foreground">Razón social</dt><dd className="font-medium text-fur-navy-900">{p.organizationName}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Identificación tributaria</dt><dd>{p.taxId ?? <span className="text-muted-foreground">Sin registrar</span>}</dd></div>
            <div><dt className="text-xs text-muted-foreground">País</dt><dd>{countryName(p.countryCode)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Tu rol</dt><dd>{p.myRole === 'OWNER' ? 'Responsable' : p.myRole === 'MEMBER' ? 'Miembro' : '—'}</dd></div>
          </dl>
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />Para cambiar la razón social, el NIF, el país o pedir la verificación, contacta al administrador del ecosistema.</p>
        </Panel>

        <Panel title="Cobertura" subtitle="Etapas y familias de equipos que atiendes" className="lg:col-span-3" action={editable && <Button size="xs" variant="secondary" onClick={() => setDialog('coverage')}><Pencil /> Editar cobertura</Button>}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Etapas del proceso</h3>
              {p.stages.length > 0 ? <ul className="flex flex-wrap gap-1.5">{p.stages.map((s) => <li key={s.code}><Pill label={`${s.code} · ${s.name}`} color="var(--fur-navy-700)" /></li>)}</ul> : <Empty>Aún no indicas etapas.</Empty>}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Familias de equipos</h3>
              {p.families.length > 0 ? <ul className="flex flex-wrap gap-1.5">{p.families.map((f) => <li key={f.code}><Pill label={f.name} color="var(--fur-teal-500)" /></li>)}</ul> : <Empty>Aún no indicas familias.</Empty>}
            </div>
          </div>
        </Panel>
      </div>

      {dialog === 'profile' && <EditProfile p={p} onClose={() => setDialog(null)} />}
      {dialog === 'coverage' && <EditCoverage p={p} onClose={() => setDialog(null)} />}
    </>
  )
}
