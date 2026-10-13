<script setup lang="ts">
// Destino de los enlaces de invitación: guarda el código y manda al login.
// El código se canjea después de entrar con Google (ver usePerfil).
const route = useRoute()

onMounted(async () => {
  guardarInvitacion(String(route.params.codigo))
  const { data } = await useSupabaseClient().auth.getSession()
  await navigateTo(data.session ? '/' : '/login', { replace: true })
})
</script>

<template>
  <main class="flex min-h-full flex-col items-center justify-center gap-4 bg-escena">
    <Capi :size="120" animo="feliz" class="animate-bounce" />
    <p class="font-display text-xl font-bold">Abriendo tu invitación…</p>
  </main>
</template>
