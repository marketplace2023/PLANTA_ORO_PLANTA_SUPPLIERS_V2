import { BrandLogo } from '@/components/brand-logo'
import { Package, ShoppingBag, Truck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { AuthForm } from '@/components/auth-form'
import { useAuth } from '@/features/auth/auth-context'

export function LoginPage() {
  const { status } = useAuth()
  if (status === 'authenticated') return <Navigate to="/" replace />

  return (
    <div className="login-shell seller-login grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="login-visual relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex">
        <div className="login-brand"><BrandLogo /></div>
        <div>
          <p className="mb-3 text-sm font-semibold tracking-widest text-fur-gold-400 uppercase">Portal de Vendedores</p>
          <h1 className="max-w-md text-4xl leading-tight font-bold">Vende en el marketplace y responde cotizaciones de las plantas.</h1>
          <p className="mt-4 max-w-md text-white/70">Publica tus productos, mantén el perfil de tu empresa y cotiza las solicitudes de compra que llegan de las plantas del ecosistema.</p>
        </div>
        <div className="seller-login-steps" aria-label="Gestión comercial"><span><Package /> Publica</span><i /><span><ShoppingBag /> Vende</span><i /><span><Truck /> Entrega</span></div>
      </aside>
      <main className="login-main grid place-items-center p-6"><div className="login-content"><div className="login-mobile-brand lg:hidden"><BrandLogo /></div>
        <AuthForm subtitle="Accede con tu cuenta de vendedor." registerSubtitle="Crea tu cuenta y registra después tu perfil de vendedor o tienda." />
      </div></main>
    </div>
  )
}
