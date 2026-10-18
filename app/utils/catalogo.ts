import type { GrupoCategoria, PlanId } from './tipos'

// Con quién fuiste: define el ícono con el que se califica. Son gestos y personas,
// nunca comida ni lugares, para que no se confundan con las categorías (🍻 parecía "bar").
export const PLANES: { id: PlanId, nombre: string, emoji: string }[] = [
  { id: 'mancha', nombre: 'Con la mancha', emoji: '🙌' },
  { id: 'cita', nombre: 'En cita', emoji: '💘' },
  { id: 'solo', nombre: 'Solo', emoji: '🧍' },
  { id: 'familia', nombre: 'En familia', emoji: '👪' },
  { id: 'juerga', nombre: 'De juerga', emoji: '🥳' },
]

export const EMOJI_SIN_PLAN = '🍋'

// Grupos para mostrar las categorías ordenadas. De noche, "Para salir" va primero.
export const GRUPOS_CATEGORIA: { id: GrupoCategoria, nombre: string }[] = [
  { id: 'peruana', nombre: 'Peruana' },
  { id: 'rapido', nombre: 'Al paso y rápido' },
  { id: 'dulce', nombre: 'Dulce y bebidas' },
  { id: 'salir', nombre: 'Para salir' },
  { id: 'otros', nombre: 'Otros' },
]

export const MAX_PLATOS = 8

// Platos sugeridos en "¿Qué pediste?", según la categoría del lugar.
// Son solo atajos: también se puede escribir cualquier otro.
const PLATOS_POR_CATEGORIA: Record<string, string[]> = {
  'cevicheria': ['Ceviche', 'Leche de tigre', 'Tiradito', 'Chicharrón de pescado', 'Jalea', 'Arroz con mariscos', 'Causa'],
  'criollo': ['Lomo saltado', 'Ají de gallina', 'Seco con frejoles', 'Arroz con pato', 'Tacu tacu', 'Carapulcra', 'Cau cau'],
  'anticucheria': ['Anticucho', 'Rachi', 'Pancita', 'Choncholí', 'Picarones'],
  'menu': ['Menú', 'Sopa', 'Segundo', 'Refresco'],
  'desayuno': ['Pan con chicharrón', 'Tamal', 'Humita', 'Café pasado'],
  'regional': ['Juane', 'Tacacho con cecina', 'Chupe de camarones', 'Cabrito', 'Rocoto relleno', 'Adobo'],
  'polleria': ['Pollo a la brasa', 'Mollejitas', 'Papas fritas'],
  'chifa': ['Arroz chaufa', 'Tallarín saltado', 'Wantán frito', 'Aeropuerto', 'Chancho al ajo'],
  'nikkei': ['Makis', 'Tiradito nikkei', 'Gyozas', 'Ramen'],
  'parrilla': ['Bife', 'Chorizo', 'Costillas', 'Anticucho'],
  'sanguche': ['Pan con chicharrón', 'Butifarra', 'Triple', 'Lechón', 'Pavo'],
  'al-paso': ['Picarones', 'Choclo con queso', 'Emoliente', 'Papa rellena', 'Salchipapa'],
  'hamburguesas': ['Hamburguesa', 'Salchipapa', 'Alitas', 'Broaster'],
  'pizzeria': ['Pizza', 'Lasaña', 'Calzone'],
  'jugueria': ['Jugo surtido', 'Especial', 'Jugo de papaya', 'Fresa con leche'],
  'cafe': ['Café', 'Sánguche', 'Torta'],
  'postres': ['Suspiro limeño', 'Picarones', 'Alfajores', 'Helado', 'Tres leches', 'Mazamorra morada'],
  'amanecida': ['Caldo de gallina', 'Salchipapa', 'Pan con chicharrón'],
  'bar': ['Pisco sour', 'Chilcano', 'Cerveza', 'Maracuyá sour'],
}

const PLATOS_COMUNES = ['Ceviche', 'Lomo saltado', 'Anticucho', 'Pollo a la brasa', 'Arroz chaufa', 'Pisco sour']

export function platosSugeridos(categoriaId?: string | null) {
  return PLATOS_POR_CATEGORIA[categoriaId ?? ''] ?? PLATOS_COMUNES
}

// Todos los platos conocidos, para autocompletar al escribir.
export const TODOS_LOS_PLATOS = [...new Set(Object.values(PLATOS_POR_CATEGORIA).flat())].sort((a, b) => a.localeCompare(b))

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

// Precio a mostrar de un lugar: el de sus reseñas y, si no tiene, el registrado en el lugar.
export function precioDe(l: { precio: number | null, precio_resenas?: number | null }) {
  return l.precio_resenas ?? l.precio
}

// Qué tags evaluativos se sugieren según la nota: 1-2 negativos, 3 neutros, 4-5 positivos.
export function tonoDeNota(nota: number): 'negativo' | 'neutro' | 'positivo' | null {
  if (!nota) return null
  return nota <= 2 ? 'negativo' : nota === 3 ? 'neutro' : 'positivo'
}

export function etiquetaPrecio(precio?: number | null) {
  return PRECIOS.find(p => p.valor === precio)?.etiqueta ?? ''
}

// "14 oct, 10:32", para mostrar cuándo se editó algo.
export function fechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const LIMA = { lat: -12.1, lng: -77.03 }

export const estiloMapa = (noche: boolean) =>
  `https://tiles.openfreemap.org/styles/${noche ? 'dark' : 'positron'}`

export function distanciaMetros(a: { lat: number, lng: number }, b: { lat: number, lng: number }) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(h))
}
