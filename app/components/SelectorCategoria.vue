<script setup lang="ts">
import { GRUPOS_CATEGORIA } from '~/utils/catalogo'

// Categorías agrupadas (Peruana, Al paso y rápido…). Muestra primero las del modo actual;
// el resto aparece con "Ver también las de día/noche".
const categoriaId = defineModel<string | null>({ required: true })

const { categorias, enModo } = useCatalogo()
const { esNoche } = useModo()
const todas = ref(false)

const grupos = computed(() => {
  // De noche, "Para salir" va primero.
  const orden = esNoche.value
    ? [...GRUPOS_CATEGORIA].sort((a, b) => Number(b.id === 'salir') - Number(a.id === 'salir'))
    : GRUPOS_CATEGORIA
  return orden
    .map(g => ({
      ...g,
      categorias: categorias.value.filter(c =>
        c.grupo === g.id && (todas.value || enModo(c.id) || c.id === categoriaId.value),
      ),
    }))
    .filter(g => g.categorias.length)
})

const hayOcultas = computed(() => categorias.value.some(c => !enModo(c.id)))
</script>

<template>
  <div class="space-y-4">
    <section v-for="g in grupos" :key="g.id">
      <h3 class="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-wide uppercase opacity-70">
        {{ g.nombre }}
        <span class="h-0.5 flex-1 rounded bg-tinta/20" aria-hidden="true" />
      </h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="c in g.categorias"
          :key="c.id"
          type="button"
          class="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-tinta px-2.5 py-2 text-left text-sm leading-tight font-semibold"
          :class="categoriaId === c.id ? 'shadow-sticker' : 'bg-papel'"
          :style="categoriaId === c.id ? { background: c.color } : {}"
          :aria-pressed="categoriaId === c.id"
          @click="categoriaId = c.id"
        >
          <span class="shrink-0 text-xl leading-none" aria-hidden="true">{{ c.emoji }}</span>
          <span>{{ c.nombre }}</span>
        </button>
      </div>
    </section>

    <button v-if="hayOcultas" type="button" class="text-sm font-bold underline" @click="todas = !todas">
      {{ todas ? 'Ver solo las de este modo' : esNoche ? 'Ver también las de día' : 'Ver también las de noche' }}
    </button>
  </div>
</template>
