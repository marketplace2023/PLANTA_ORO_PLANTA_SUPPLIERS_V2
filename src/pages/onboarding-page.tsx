import { Building2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Panel } from '@/components/kit'
import { FormDialog, type Values } from '@/components/form-dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/auth-context'
import { useCreateProvider } from '@/features/organizations/use-organizations'
import { errorMessage } from '@/lib/forms'
import { countryOptions, parseList } from '@/lib/organizations'

const opt = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)

/** La persona tiene cuenta pero todavía no gestiona ninguna empresa: puede solicitar el registro de la suya. */
export function OnboardingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const create = useCreateProvider()
  const [open, setOpen] = useState(false)

  function submit(v: Values) {
    create.mutate(
      {
        organizationName: String(v.organizationName).trim(),
        taxId: opt(v.taxId),
        countryCode: String(v.countryCode),
        city: opt(v.city),
        description: opt(v.description),
        website: opt(v.website),
        contactEmail: opt(v.contactEmail),
        certifications: parseList(String(v.certifications ?? '')),
        selfRegistration: true,
      },
      {
        onSuccess: () => {
          toast.success('Solicitud enviada: el administrador revisará tu empresa. Mientras tanto puedes completar tu perfil.')
          setOpen(false)
        },
      },
    )
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Panel className="w-full max-w-lg">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-fur-navy-900 text-fur-gold-400">
            <Building2 className="size-6" aria-hidden />
          </span>
          <h1 className="text-xl font-bold text-fur-navy-900">Registra tu empresa como proveedor</h1>
          <p className="text-sm text-muted-foreground">
            Hola {user?.firstName}. Tu cuenta aún no gestiona ninguna empresa. Registra la tuya para publicar productos en el marketplace y recibir solicitudes de cotización. El administrador del ecosistema revisará y verificará tu solicitud.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button onClick={() => { create.reset(); setOpen(true) }}>Registrar mi empresa</Button>
            <Button
              variant="outline"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <LogOut /> Cerrar sesión
            </Button>
          </div>
        </div>
      </Panel>

      {open && (
        <FormDialog
          title="Registrar mi empresa como proveedor"
          description="Tu solicitud queda pendiente hasta que el administrador del ecosistema la apruebe y verifique."
          fields={[
            { name: 'organizationName', label: 'Razón social', required: true, wide: true },
            { name: 'taxId', label: 'Identificación tributaria', hint: 'RUC / NIT / CUIT. Evita registros duplicados.' },
            { name: 'countryCode', label: 'País', type: 'select', required: true, options: countryOptions() },
            { name: 'city', label: 'Ciudad' },
            { name: 'contactEmail', label: 'Correo de contacto', type: 'email', hint: 'Solo lo ven usuarios con sesión iniciada.' },
            { name: 'website', label: 'Sitio web', type: 'url', placeholder: 'https://…', wide: true },
            { name: 'certifications', label: 'Certificaciones', placeholder: 'ISO 9001, OSHA 30', hint: 'Separadas por comas.', wide: true },
            { name: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Qué productos ofreces' },
          ]}
          initial={{ countryCode: 'PE' }}
          submitLabel="Enviar solicitud"
          busy={create.isPending}
          error={errorMessage(create.error)}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
      )}
    </div>
  )
}
