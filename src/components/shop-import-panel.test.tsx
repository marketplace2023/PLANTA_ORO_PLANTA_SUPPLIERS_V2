import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShopImportPanel } from './shop-import-panel';
import { mockApi } from '@/test/fetch-mock';
import { renderWithProviders } from '@/test/render';
beforeEach(() => { const Original = URL; vi.stubGlobal('URL', class extends Original {
    static createObjectURL() { return 'blob:test-image'; }
    static revokeObjectURL() { }
}); });
afterEach(() => vi.unstubAllGlobals());
const path = '/providers/shop/commerce/imports';
const preview = { fingerprint: 'a'.repeat(64), issues: [], summary: { products: 1, variants: 1, specifications: 1, images: 1 }, rows: [{ reference: 'P1', title: 'Bomba', family: 'PUMPS', variants: [{ sku: 'SKU-1', name: 'Standard', price: 10, stock: 5 }] }] };
describe('Strict shop import interface', () => {
    it('requires analysis and sends the same Excel, photos and fingerprint on confirmation', async () => {
        const m = mockApi({ 'GET /catalog/families': { body: [] }, [`POST ${path}/preview`]: { status: 201, body: preview }, [`POST ${path}`]: { status: 201, body: { ...preview, created: [{ id: 'new-product', reference: 'P1', title: 'Bomba' }] } } });
        renderWithProviders(<ShopImportPanel providerId="shop"/>);
        expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeDisabled();
        await userEvent.upload(screen.getByLabelText('Archivo Excel'), new File(['excel'], 'tienda.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
        await userEvent.upload(screen.getByLabelText('Imágenes indicadas en el Excel'), new File(['png'], 'SKU-1.png', { type: 'image/png' }));
        await userEvent.click(screen.getByRole('button', { name: 'Analizar archivos' }));
        await screen.findByText('Análisis correcto. Revisa los productos y confirma la carga.');
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar carga' }));
        const link = await screen.findByRole('link', { name: 'Bomba' });
        expect(link).toHaveAttribute('href', '/products/new-product/edit');
        const body = m.calls.find(c => c.method === 'POST' && c.path === path)!.init.body as FormData;
        expect(body.get('fingerprint')).toBe(preview.fingerprint);
        expect((body.get('file') as File).name).toBe('tienda.xlsx');
        expect((body.getAll('images')[0] as File).name).toBe('SKU-1.png');
    });
    it('blocks errors and invalidates the image preview when replacement settings change', async () => {
        mockApi({ 'GET /catalog/families': { body: [] }, [`POST ${path}/images/preview`]: { body: { fingerprint: 'x', issues: [{ sheet: 'Archivos', row: 1, message: 'Ya tiene portada' }], rows: [{ file: 'SKU-1.png', sku: 'SKU-1', title: 'Bomba', replacing: true }] } } });
        renderWithProviders(<ShopImportPanel providerId="shop" imagesOnly/>);
        await userEvent.upload(screen.getByLabelText('Imágenes por SKU'), new File(['png'], 'SKU-1.png', { type: 'image/png' }));
        await userEvent.click(screen.getByRole('button', { name: 'Analizar archivos' }));
        await screen.findByText('Ya tiene portada');
        expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeDisabled();
        await userEvent.click(screen.getByRole('checkbox'));
        expect(screen.queryByText('Ya tiene portada')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeDisabled();
    });
    it('requires a new analysis after the server rejects a stale fingerprint', async () => {
        const m = mockApi({ 'GET /catalog/families': { body: [] }, [`POST ${path}/images/preview`]: { body: { ...preview, rows: [] } }, [`POST ${path}/images`]: { status: 409, body: { message: 'Los productos cambiaron. Vuelve a analizar.' } } });
        renderWithProviders(<ShopImportPanel providerId="shop" imagesOnly/>);
        await userEvent.upload(screen.getByLabelText('Imágenes por SKU'), new File(['png'], 'SKU-1.png', { type: 'image/png' }));
        await userEvent.click(screen.getByRole('button', { name: 'Analizar archivos' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeEnabled());
        await userEvent.click(screen.getByRole('button', { name: 'Confirmar carga' }));
        await screen.findByText('Los productos cambiaron. Vuelve a analizar.');
        expect(screen.getByRole('button', { name: 'Confirmar carga' })).toBeDisabled();
        expect(m.count(`POST ${path}/images`)).toBe(1);
    });
});
