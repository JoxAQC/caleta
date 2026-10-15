import type { LugarResumen, Perfil, PlanId } from '~/utils/tipos'

// Lugar con lo que dicen sus reseñas, para filtrar sin más consultas.
export interface LugarRico extends LugarResumen {
  tags: string[]
  planes: PlanId[]
  autores: string[]
  // Está en la lista "Quiero ir" del usuario en sesión.
  pendiente: boolean
}

export function useLugares() {
  const supabase = useSupabaseClient()
  const { perfil } = usePerfil()
  const lugares = useState<LugarRico[]>('lugares', () => [])
  const mancha = useState<Pick<Perfil, 'id' | 'nombre'>[]>('mancha', () => [])

  async function cargar() {
    const [l, r, p, q] = await Promise.all([
      supabase.from('lugares_resumen').select('*'),
      supabase.from('resenas').select('lugar_id, autor_id, plan, resena_tags(tag_id)').is('borrada_en', null),
      supabase.from('perfiles').select('id, nombre').order('nombre'),
      supabase.from('pendientes').select('lugar_id').eq('usuario_id', perfil.value?.id ?? ''),
    ])
    if (l.error) throw l.error
    if (r.error) throw r.error
    if (p.error) throw p.error
    if (q.error) throw q.error
    const mios = new Set(q.data.map(x => x.lugar_id))

    const porLugar = new Map<string, { tags: Set<string>, planes: Set<PlanId>, autores: Set<string> }>()
    for (const res of r.data) {
      let x = porLugar.get(res.lugar_id)
      if (!x) porLugar.set(res.lugar_id, x = { tags: new Set(), planes: new Set(), autores: new Set() })
      x.autores.add(res.autor_id)
      if (res.plan) x.planes.add(res.plan as PlanId)
      res.resena_tags.forEach(t => x!.tags.add(t.tag_id))
    }

    lugares.value = (l.data as unknown as LugarResumen[]).map((lugar) => {
      const x = porLugar.get(lugar.id)
      return { ...lugar, tags: [...(x?.tags ?? [])], planes: [...(x?.planes ?? [])], autores: [...(x?.autores ?? [])], pendiente: mios.has(lugar.id) }
    })
    mancha.value = p.data
  }

  return { lugares, mancha, cargar }
}
