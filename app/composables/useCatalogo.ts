import type { Categoria, Tag } from '~/utils/tipos'

export function useCatalogo() {
  const supabase = useSupabaseClient()
  const categorias = useState<Categoria[]>('categorias', () => [])
  const tags = useState<Tag[]>('tags', () => [])

  async function cargar() {
    if (categorias.value.length && tags.value.length) return
    const [c, t] = await Promise.all([
      supabase.from('categorias').select('*').order('orden'),
      supabase.from('tags').select('*').order('orden'),
    ])
    if (c.error) throw c.error
    if (t.error) throw t.error
    categorias.value = c.data as Categoria[]
    tags.value = t.data as Tag[]
  }

  const categoria = (id?: string | null) => categorias.value.find(c => c.id === id)

  // ¿La categoría se muestra en el modo actual? Las de "ambos" salen siempre.
  const { esNoche } = useModo()
  const enModo = (id?: string | null) => {
    const ambito = categoria(id)?.ambito ?? 'ambos'
    return ambito === 'ambos' || ambito === (esNoche.value ? 'noche' : 'dia')
  }
  const tag = (id: string) => tags.value.find(t => t.id === id)

  return { categorias, tags, cargar, categoria, tag, enModo }
}
