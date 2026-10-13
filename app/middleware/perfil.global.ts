const RUTAS_LIBRES = ['/login', '/confirm', '/sin-invitacion']

export default defineNuxtRouteMiddleware(async (to) => {
  if (RUTAS_LIBRES.includes(to.path) || to.path.startsWith('/unirse/')) return

  const { data } = await useSupabaseClient().auth.getSession()
  if (!data.session) return navigateTo('/login')

  const { perfil, cargar } = usePerfil()
  if (!perfil.value) {
    try {
      await cargar()
    }
    catch {
      return navigateTo('/sin-invitacion?error=1')
    }
  }
  if (!perfil.value) return navigateTo('/sin-invitacion')
})
