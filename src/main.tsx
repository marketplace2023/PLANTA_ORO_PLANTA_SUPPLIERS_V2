import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/auth-context'
import { ProviderProvider } from '@/features/organizations/provider-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { initializeTheme } from '@/lib/theme'
import App from './App'
import './index.css'

initializeTheme()

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeToggle />
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ProviderProvider>
            <TooltipProvider>
              <App />
            </TooltipProvider>
            <Toaster />
          </ProviderProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
