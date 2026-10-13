<script setup lang="ts">
const route = useRoute()
const { salir, enlaceVencido } = usePerfil()
const falla = computed(() => route.query.error === '1')
</script>

<template>
  <main class="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 text-center">
    <Capi :size="120" animo="triste" />
    <template v-if="falla">
      <h1 class="mt-3 font-display text-2xl font-bold">No pudimos cargar tu perfil</h1>
      <p class="mt-2">Revisa tu conexión y vuelve a intentar.</p>
      <NuxtLink to="/" class="btn mt-6 bg-limon">Reintentar</NuxtLink>
    </template>
    <template v-else-if="enlaceVencido">
      <h1 class="mt-3 font-display text-3xl font-bold">Ese enlace ya no sirve</h1>
      <p class="mt-2">La invitación venció o fue anulada. Pídele a alguien de la mancha que te mande una nueva.</p>
    </template>
    <template v-else>
      <h1 class="mt-3 font-display text-3xl font-bold">Esto es caleta</h1>
      <p class="mt-2">Para entrar necesitas un enlace de invitación. Pídeselo a alguien de la mancha.</p>
    </template>
    <button class="btn mt-4 bg-papel" @click="salir">Salir</button>
  </main>
</template>
