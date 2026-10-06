export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

/** Validación en el navegador (el servidor valida de nuevo el contenido real): da el error antes de enviar nada. */
export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Usa una imagen PNG, JPG o WebP.'
  if (file.size > IMAGE_MAX_BYTES) return `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB; el máximo es ${IMAGE_MAX_BYTES / 1024 / 1024} MB.`
  return null
}

/** Cambio pendiente sobre una imagen: subir un archivo nuevo, quitar la actual, o nada. */
export type ImageChange = { file: File | null; remove: boolean }
export const NO_IMAGE_CHANGE: ImageChange = { file: null, remove: false }
