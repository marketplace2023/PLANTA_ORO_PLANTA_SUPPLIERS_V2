import { Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/forms'
import { FormDialog } from '@/components/form-dialog'
import { DataTable, Empty, Failed, Loading, Panel, Pill, ScreenHeader, td } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProviderContext } from '@/features/organizations/provider-context'
import { useAddMember, useMembers, useRemoveMember, type OrgMember } from '@/features/organizations/use-organizations'
import { formatDate } from '@/lib/format'

export function TeamPage() {
  const { provider } = useProviderContext()
  const id = provider!.id
  const canEdit = provider!.myRole === 'OWNER' && provider!.status !== 'SUSPENDED'
  const members = useMembers(id)
  const add = useAddMember(id)
  const remove = useRemoveMember(id)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<OrgMember | null>(null)

  return (
    <>
      <ScreenHeader
        title="Equipo"
        description="Personas que gestionan esta empresa en el portal. Solo el responsable agrega o quita personas."
        actions={canEdit && <Button onClick={() => { add.reset(); setAdding(true) }}><UserPlus /> Agregar persona</Button>}
      />

      <Panel flush>
        {members.isLoading ? (
          <div className="p-4"><Loading rows={4} /></div>
        ) : members.isError ? (
          <Failed what="el equipo" onRetry={() => void members.refetch()} />
        ) : members.data && members.data.length > 0 ? (
          <DataTable head={['Persona', 'Correo', 'Rol', 'Desde', ...(canEdit ? [{ label: '', right: true }] : [])]}>
            {members.data.map((m) => (
              <tr key={m.userId}>
                <td className={`${td} font-medium text-fur-navy-900`}>{m.firstName} {m.lastName}</td>
                <td className={td}>{m.email}</td>
                <td className={td}><Pill label={m.role === 'OWNER' ? 'Responsable' : 'Miembro'} color={m.role === 'OWNER' ? 'var(--fur-navy-700)' : 'var(--fur-steel-500)'} /></td>
                <td className={td}>{formatDate(m.createdAt)}</td>
                {canEdit && (
                  <td className={`${td} text-right`}>
                    <Button size="xs" variant="outline" aria-label={`Quitar a ${m.firstName} ${m.lastName}`} onClick={() => { remove.reset(); setRemoving(m) }}>
                      <Trash2 /> Quitar
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </DataTable>
        ) : (
          <Empty>Esta empresa aún no tiene personas asignadas.</Empty>
        )}
      </Panel>

      {adding && (
        <FormDialog
          title="Agregar persona al equipo"
          description="La persona debe tener una cuenta registrada en el ecosistema."
          fields={[
            { name: 'email', label: 'Correo', type: 'email', required: true, placeholder: 'persona@empresa.com', wide: true },
            { name: 'role', label: 'Rol', type: 'select', required: true, options: [{ value: 'MEMBER', label: 'Miembro' }, { value: 'OWNER', label: 'Responsable' }], hint: 'Los responsables también pueden gestionar el equipo.' },
          ]}
          initial={{ role: 'MEMBER' }}
          submitLabel="Agregar"
          busy={add.isPending}
          error={errorMessage(add.error)}
          onClose={() => setAdding(false)}
          onSubmit={(v) => add.mutate({ email: String(v.email).trim(), role: v.role as 'OWNER' | 'MEMBER' }, { onSuccess: () => { toast.success('Persona agregada'); setAdding(false) } })}
        />
      )}

      {removing && (
        <Dialog open onOpenChange={(o) => !o && setRemoving(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quitar del equipo</DialogTitle>
              <DialogDescription>{removing.firstName} {removing.lastName} ({removing.email}) dejará de gestionar esta empresa.</DialogDescription>
            </DialogHeader>
            {remove.isError && <p role="alert" className="text-sm text-fur-red-500">{errorMessage(remove.error)}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setRemoving(null)}>Cancelar</Button>
              <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(removing.userId, { onSuccess: () => { toast.success('Persona quitada'); setRemoving(null) } })}>
                {remove.isPending ? 'Quitando…' : 'Quitar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
