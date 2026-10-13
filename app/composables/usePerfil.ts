import type { Perfil } from '~/utils/tipos'

// Código del enlace de invitación, guardado mientras la persona pasa por el login de Google.
const CLAVE_INVITACION = 'caleta:invitacion'

export function guardarInvitacion(codigo: string) {
  try {
    localStorage.setItem(CLAVE_INVITACION, codigo)
  }
  catch {}
}

export function invitacionGuardada() {
  try {
    return localStorage.getItem(CLAVE_INVITACION)
  }
  catch {
    return null
  }
}

// Perfil del usuario en sesión. Si aún no existe, se crea cuando su correo está en la lista
// o trae un enlace de invitación vigente. Queda en null si no cumple ninguna de las dos.
export function usePerfil() {
  const supabase = useSupabaseClient()
  const perfil = useState<Perfil | null>('perfil', () => null)
  // El usuario llegó con un enlace, pero ya no servía.
  const enlaceVencido = useState('enlace-vencido', () => false)

  async function cargar() {
    const codigo = invitacionGuardada()
    const { data, error } = await supabase.rpc('reclamar_invitacion', codigo ? { p_codigo: codigo } : {})
    if (error) throw error
    const p = data as Perfil | null
    perfil.value = p?.id ? p : null
    if (codigo) {
      enlaceVencido.value = !perfil.value
      try {
        localStorage.removeItem(CLAVE_INVITACION)
      }
      catch {}
    }
    return perfil.value
  }

  async function salir() {
    await supabase.auth.signOut()
    perfil.value = null
    await navigateTo('/login')
  }

  return { perfil, enlaceVencido, cargar, salir }
}
