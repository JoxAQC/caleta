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
  grupo: GrupoCategoria
}

export type GrupoCategoria = 'peruana' | 'rapido' | 'dulce' | 'salir' | 'otros'

export interface Tag {
  id: string
  nombre: string
  orden: number
  ambito: 'ambos' | 'noche'
  tono: 'positivo' | 'neutro' | 'negativo' | 'descriptivo'
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
  // Precio que más se repite entre las reseñas; si no hay, vale el precio del lugar.
  precio_resenas: number | null
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
  planes: PlanId[]
  precio: number | null
  nota: string | null
  platos: string[]
  privada: boolean
  visitado_en: string
  creado_en: string
  editado_en: string | null
  // Borrada por su autor, pero con comentarios ajenos que se conservan.
  borrada_en: string | null
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
  editado_en: string | null
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
