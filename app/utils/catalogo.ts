import type { PlanId } from './tipos'

// El plan de la visita define el ícono con el que se califica.
export const PLANES: { id: PlanId, nombre: string, emoji: string }[] = [
  { id: 'mancha', nombre: 'Con la mancha', emoji: '🍻' },
  { id: 'cita', nombre: 'Para cita', emoji: '🌹' },
  { id: 'solo', nombre: 'Solo', emoji: '🎧' },
  { id: 'familia', nombre: 'En familia', emoji: '🏡' },
]

export const EMOJI_SIN_PLAN = '🍋'

export function emojiDePlan(plan?: PlanId | null) {
  return PLANES.find(p => p.id === plan)?.emoji ?? EMOJI_SIN_PLAN
}

export const NOTAS = ['Ácido', 'Meh', 'Cumple', 'Rico', 'Caletaza']

export const ASPECTOS = [
  { id: 'comida', nombre: 'Comida y trago' },
  { id: 'ambiente', nombre: 'Ambiente' },
  { id: 'servicio', nombre: 'Servicio' },
  { id: 'calidad_precio', nombre: 'Calidad-precio' },
] as const

export type AspectoId = (typeof ASPECTOS)[number]['id']

export const PRECIOS = [
  { valor: 1, etiqueta: 'S/', detalle: 'Menú' },
  { valor: 2, etiqueta: 'S/S/', detalle: 'Normal' },
  { valor: 3, etiqueta: 'S/S/S/', detalle: 'Gustito' },
  { valor: 4, etiqueta: 'S/S/S/S/', detalle: 'Ocasión' },
]

export function etiquetaPrecio(precio?: number | null) {
  return PRECIOS.find(p => p.valor === precio)?.etiqueta ?? ''
}

export const LIMA = { lat: -12.1, lng: -77.03 }

export function distanciaMetros(a: { lat: number, lng: number }, b: { lat: number, lng: number }) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}
