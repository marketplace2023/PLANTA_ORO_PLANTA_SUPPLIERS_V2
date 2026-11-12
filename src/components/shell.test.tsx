import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { Shell } from './shell'
import { renderWithProviders } from '@/test/render'

vi.mock('@/features/auth/auth-context', () => ({ useAuth: () => ({ user: { firstName: 'Ana', lastName: 'Vendedora' }, logout: vi.fn() }) }))
vi.mock('@/features/organizations/provider-context', () => ({ useProviderContext: () => ({ provider: { id: 'shop', organizationName: 'Tienda de prueba', status: 'ACTIVE', myRole: 'OWNER' }, providers: [], select: vi.fn() }) }))
afterEach(() => localStorage.clear())
describe('Seller workspace navigation', () => {
  it('keeps the store context and business routes when collapsing navigation', async () => {
    renderWithProviders(<Routes><Route element={<Shell />}><Route index element={<p>Contenido de la tienda</p>} /></Route></Routes>)
    expect(screen.getByText('Contenido de la tienda')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pedidos y ventas' })).toHaveAttribute('href', '/orders')
    expect(screen.getByRole('link', { name: 'Herramientas y reportes' })).toHaveAttribute('href', '/business-tools')
    await userEvent.click(screen.getByRole('button', { name: 'Contraer navegación' }))
    expect(localStorage.getItem('fur-seller-sidebar-collapsed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Expandir navegación' })).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Expandir navegación' }))
    expect(localStorage.getItem('fur-seller-sidebar-collapsed')).toBe('false')
  })
})
