import type { Perfil } from '~/utils/tipos'

// Perfil del usuario en sesión. Si aún no existe y su correo está invitado, se crea.
// Queda en null cuando la sesión es válida pero el correo no está en la lista.
export function usePerfil() {
  const supabase = useSupabaseClient()
  const perfil = useState<Perfil | null>('perfil', () => null)

  async function cargar() {
    const { data, error } = await supabase.rpc('reclamar_invitacion')
    if (error) throw error
    const p = data as Perfil | null
    perfil.value = p?.id ? p : null
    return perfil.value
  }

  async function salir() {
    await supabase.auth.signOut()
    perfil.value = null
    await navigateTo('/login')
  }

  return { perfil, cargar, salir }
}
