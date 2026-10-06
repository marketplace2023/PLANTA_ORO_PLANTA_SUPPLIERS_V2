import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { useMyProviders, type MyProvider } from './use-organizations'

const STORAGE_KEY = 'fur.supplier.providerId'

type ProviderContextValue = {
  /** Empresas proveedoras de las que la persona es miembro. */
  providers: MyProvider[]
  /** Empresa con la que se está trabajando (null si todavía no tiene ninguna). */
  provider: MyProvider | null
  isLoading: boolean
  isError: boolean
  select: (id: string) => void
}

const ProviderContext = createContext<ProviderContextValue | null>(null)

const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Una persona puede gestionar varias empresas: la elegida se recuerda en este navegador. */
export function ProviderProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const mine = useMyProviders(status === 'authenticated')
  const [storedId, setStoredId] = useState<string | null>(readStored)

  const providers = useMemo(() => mine.data ?? [], [mine.data])
  const provider = providers.find((p) => p.id === storedId) ?? providers[0] ?? null

  const select = useCallback((id: string) => {
    setStoredId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* almacenamiento no disponible */
    }
  }, [])

  const value = useMemo<ProviderContextValue>(
    () => ({ providers, provider, isLoading: status === 'loading' || (status === 'authenticated' && mine.isLoading), isError: mine.isError, select }),
    [providers, provider, status, mine.isLoading, mine.isError, select],
  )
  return <ProviderContext.Provider value={value}>{children}</ProviderContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProviderContext() {
  const ctx = useContext(ProviderContext)
  if (!ctx) throw new Error('useProviderContext debe usarse dentro de <ProviderProvider>')
  return ctx
}
