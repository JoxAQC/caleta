<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const noExiste = computed(() => props.error.statusCode === 404)
</script>

<template>
  <main class="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 text-center">
    <Capi :size="130" animo="triste" />
    <h1 class="mt-3 font-display text-3xl font-extrabold">
      {{ noExiste ? 'Aquí no hay nada' : 'Algo se rompió' }}
    </h1>
    <p class="mt-2">
      {{ noExiste ? 'Esta página no existe. Ni Capi la encontró.' : 'Vuelve al mapa e intenta de nuevo.' }}
    </p>
    <button class="btn mt-6 bg-limon" @click="clearError({ redirect: '/' })">Volver al mapa</button>
  </main>
</template>
