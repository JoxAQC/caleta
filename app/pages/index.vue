<script setup lang="ts">
import type { LugarResumen } from '~/utils/tipos'
import { etiquetaPrecio } from '~/utils/catalogo'

const supabase = useSupabaseClient()
const { perfil } = usePerfil()
const { categorias, categoria, cargar: cargarCatalogo } = useCatalogo()

const lugares = ref<LugarResumen[]>([])
const filtro = ref<string | null>(null)
const seleccionado = ref<string | null>(null)
const error = ref('')

async function cargar() {
  error.value = ''
  try {
    await cargarCatalogo()
    const { data, error: e } = await supabase.from('lugares_resumen').select('*')
    if (e) throw e
    lugares.value = data as LugarResumen[]
  }
  catch {
    error.value = 'No se pudieron cargar los lugares.'
  }
}
onMounted(cargar)

// Solo se ofrecen como filtro las categorías que ya tienen lugares.
const categoriasUsadas = computed(() =>
  categorias.value.filter(c => lugares.value.some(l => l.categoria_id === c.id)),
)
const visibles = computed(() =>
  filtro.value ? lugares.value.filter(l => l.categoria_id === filtro.value) : lugares.value,
)
const lugar = computed(() => visibles.value.find(l => l.id === seleccionado.value))

function alternarFiltro(id: string) {
  filtro.value = filtro.value === id ? null : id
  seleccionado.value = null
}
</script>

<template>
  <main class="relative h-full overflow-hidden">
    <MapaLugares :lugares="visibles" :seleccionado="seleccionado" @seleccionar="seleccionado = $event" />

    <div class="pointer-events-none absolute inset-x-0 top-0 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div class="flex items-center gap-2">
        <div class="sticker pointer-events-auto flex flex-1 items-center gap-2 rounded-full px-3 py-1.5">
          <Capi :size="30" />
          <span class="font-display text-lg font-extrabold">Caleta</span>
          <span class="ml-auto text-sm font-semibold">{{ visibles.length }} {{ visibles.length === 1 ? 'lugar' : 'lugares' }}</span>
        </div>
        <NuxtLink
          to="/perfil"
          class="sticker pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full bg-aji font-bold"
          aria-label="Tu perfil"
        >
          {{ perfil?.nombre.charAt(0).toUpperCase() }}
        </NuxtLink>
      </div>

      <div v-if="categoriasUsadas.length" class="pointer-events-auto -mx-3 mt-2 flex gap-2 overflow-x-auto px-3 pb-2">
        <button
          v-for="c in categoriasUsadas"
          :key="c.id"
          class="shrink-0 rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold shadow-sticker"
          :style="{ background: filtro === c.id ? c.color : '#fff' }"
          :aria-pressed="filtro === c.id"
          @click="alternarFiltro(c.id)"
        >
          {{ c.emoji }} {{ c.nombre }}
        </button>
      </div>

      <p v-if="error" class="sticker pointer-events-auto mt-2 bg-white px-3 py-2 text-sm font-semibold" role="alert">
        {{ error }} <button class="underline" @click="cargar">Reintentar</button>
      </p>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <NuxtLink v-if="lugar" :to="`/lugar/${lugar.id}`" class="sticker pointer-events-auto block p-4">
        <div class="flex items-start gap-3">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-full border-2 border-tinta text-xl"
            :style="{ background: categoria(lugar.categoria_id)?.color }"
          >{{ categoria(lugar.categoria_id)?.emoji }}</span>
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-display text-xl leading-tight font-bold">{{ lugar.nombre }}</h2>
            <p class="truncate text-sm">
              {{ categoria(lugar.categoria_id)?.nombre }}
              <template v-if="lugar.precio"> · {{ etiquetaPrecio(lugar.precio) }}</template>
            </p>
          </div>
          <span v-if="lugar.promedio" class="rounded-full border-2 border-tinta bg-limon px-2.5 py-0.5 font-display font-bold">
            {{ lugar.promedio.toFixed(1) }}
          </span>
        </div>
        <p class="mt-2 text-sm font-semibold">
          {{ lugar.total_resenas }} {{ lugar.total_resenas === 1 ? 'reseña' : 'reseñas' }} de la mancha · Ver ficha
        </p>
      </NuxtLink>

      <div v-else-if="!lugares.length && !error" class="sticker pointer-events-auto bg-white p-4 text-center">
        <p class="font-display text-lg font-bold">El mapa está vacío</p>
        <p class="text-sm">Reseña el primer lugar y aparecerá aquí para toda la mancha.</p>
      </div>

      <NuxtLink
        :to="lugar ? `/nueva?lugar=${lugar.id}` : '/nueva'"
        class="btn pointer-events-auto self-center bg-limon px-6 text-lg shadow-sticker-lg"
      >
        <span class="text-2xl leading-none">+</span> {{ lugar ? 'Reseñar este lugar' : 'Nueva reseña' }}
      </NuxtLink>
    </div>
  </main>
</template>
