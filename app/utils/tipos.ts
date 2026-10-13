export interface Perfil {
  id: string
  grupo_id: string
  nombre: string
  avatar_url: string | null
  creado_en: string
}

export interface Categoria {
  id: string
  nombre: string
  emoji: string
  color: string
  orden: number
  ambito: 'dia' | 'noche' | 'ambos'
}

export interface Tag {
  id: string
  nombre: string
  orden: number
  ambito: 'ambos' | 'noche'
}

export type PlanId = 'mancha' | 'cita' | 'solo' | 'familia' | 'juerga'

export interface Lugar {
  id: string
  grupo_id: string
  nombre: string
  direccion: string | null
  lat: number
  lng: number
  categoria_id: string
  precio: number | null
  proveedor: string | null
  ref_externa: string | null
  creado_por: string
  creado_en: string
}

export interface LugarResumen extends Lugar {
  promedio: number | null
  total_resenas: number
  ultima_resena: string | null
}

export interface Resena {
  id: string
  lugar_id: string
  autor_id: string
  general: number
  comida: number | null
  ambiente: number | null
  servicio: number | null
  calidad_precio: number | null
  plan: PlanId | null
  nota: string | null
  privada: boolean
  visitado_en: string
  creado_en: string
  autor: Pick<Perfil, 'nombre' | 'avatar_url'> | null
  resena_tags: { tag_id: string }[]
  fotos: { path: string }[]
  reacciones: Reaccion[]
  comentarios: Comentario[]
}

export interface Reaccion {
  emoji: string
  usuario_id: string
}

export interface Comentario {
  id: string
  texto: string
  creado_en: string
  autor_id: string
  autor: Pick<Perfil, 'nombre'> | null
}

export interface Pendiente {
  usuario_id: string
  recomendado_por: string | null
  privado: boolean
}

export interface Coordenada {
  lat: number
  lng: number
}
