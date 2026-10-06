import { apiUrl } from '@/lib/api'

/** Una imagen puede ser una URL externa (http/https) o una ruta de la API (foto subida): se resuelve para usarla en <img>. */
export const imageSrc = (url: string | null | undefined): string | null => (url ? (/^https?:\/\//i.test(url) ? url : apiUrl(url)) : null)
