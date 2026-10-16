import type { PlanId } from '~/utils/tipos'
import type { LugarRico } from './useLugares'

export interface Filtros {
  texto: string
  categorias: string[]
  tags: string[]
  plan: PlanId | null
  precioMax: number | null
  minimo: number
  autor: string | null
  soloPendientes: boolean
}

// "anticucho" encuentra "Anticuchos"; sin tildes ni mayúsculas.
const simple = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const VACIO: Filtros = { texto: '', categorias: [], tags: [], plan: null, precioMax: null, minimo: 0, autor: null, soloPendientes: false }

export function useFiltros() {
  const filtros = useState<Filtros>('filtros', () => structuredClone(VACIO))

  // Cuántos filtros del panel están puestos (el texto y las categorías se ven aparte).
  const activos = computed(() => {
    const f = filtros.value
    return f.tags.length + (f.plan ? 1 : 0) + (f.precioMax ? 1 : 0) + (f.minimo ? 1 : 0) + (f.autor ? 1 : 0)
  })

  function pasa(l: LugarRico) {
    const f = filtros.value
    const q = simple(f.texto.trim())
    if (q && !simple(l.nombre).includes(q) && !l.platos.some(p => simple(p).includes(q))) return false
    if (f.categorias.length && !f.categorias.includes(l.categoria_id)) return false
    if (!f.tags.every(t => l.tags.includes(t))) return false
    if (f.plan && !l.planes.includes(f.plan)) return false
    if (f.precioMax && (l.precio == null || l.precio > f.precioMax)) return false
    if (f.minimo && (l.promedio ?? 0) < f.minimo) return false
    if (f.autor && !l.autores.includes(f.autor)) return false
    if (f.soloPendientes && !l.pendiente) return false
    return true
  }

  function limpiar() {
    filtros.value = { ...structuredClone(VACIO), texto: filtros.value.texto }
  }

  function alternar(lista: 'categorias' | 'tags', id: string) {
    const arr = filtros.value[lista]
    const i = arr.indexOf(id)
    if (i >= 0) arr.splice(i, 1)
    else arr.push(id)
  }

  return { filtros, activos, pasa, limpiar, alternar }
}
