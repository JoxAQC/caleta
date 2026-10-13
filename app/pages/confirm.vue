<script setup lang="ts">
const user = useSupabaseUser()

watch(user, (u) => {
  if (u) navigateTo('/', { replace: true })
}, { immediate: true })
</script>

<template>
  <main class="flex min-h-full flex-col items-center justify-center gap-4 bg-escena">
    <Capi :size="120" class="animate-bounce" />
    <p class="font-display text-xl font-bold">Entrando…</p>
  </main>
</template>
