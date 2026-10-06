import { describe, expect, it } from 'vitest'
import { IMAGE_MAX_BYTES, validateImageFile } from './image-file'
import { imageSrc } from './media'

describe('validateImageFile', () => {
  it('acepta PNG, JPG y WebP dentro del límite', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) expect(validateImageFile({ type, size: 1024 })).toBeNull()
    expect(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES })).toBeNull()
  })

  it('rechaza otros tipos (SVG, PDF, GIF) con un mensaje claro', () => {
    for (const type of ['image/svg+xml', 'application/pdf', 'image/gif', '']) expect(validateImageFile({ type, size: 1024 })).toBe('Usa una imagen PNG, JPG o WebP.')
  })

  it('rechaza lo que pesa más de 5 MB e indica cuánto pesa', () => {
    expect(validateImageFile({ type: 'image/png', size: IMAGE_MAX_BYTES + 1 })).toMatch(/5\.0 MB; el máximo es 5 MB/)
    expect(validateImageFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 })).toMatch(/8\.0 MB/)
  })
})

describe('imageSrc', () => {
  it('deja intactas las URL externas y resuelve las rutas de la API', () => {
    expect(imageSrc('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(imageSrc('/marketplace/listings/abc/image?v=1')).toBe('http://localhost:3000/api/v1/marketplace/listings/abc/image?v=1')
  })

  it('sin imagen no hay origen', () => {
    expect(imageSrc(null)).toBeNull()
    expect(imageSrc(undefined)).toBeNull()
    expect(imageSrc('')).toBeNull()
  })
})
