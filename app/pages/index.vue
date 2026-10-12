<script setup lang="ts">
import type { Coordenada } from '~/utils/tipos'
import { distanciaMetros, etiquetaPrecio } from '~/utils/catalogo'

type Orden = 'nota' | 'recientes' | 'cerca'

const { perfil } = usePerfil()
const { categorias, categoria, tag, cargar: cargarCatalogo } = useCatalogo()
const { lugares, cargar: cargarLugares } = useLugares()
const { filtros, activos, pasa, alternar } = useFiltros()

const vista = useState<'mapa' | 'lista'>('vista', () => 'mapa')
const orden = useState<Orden>('orden', () => 'nota')
const seleccionado = ref<string | null>(null)
const panelAbierto = ref(false)
const aqui = ref<Coordenada | null>(null)
const error = ref('')
const aviso = ref('')

async function cargar() {
  error.value = ''
  try {
    await Promise.all([cargarCatalogo(), cargarLugares()])
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

const visibles = computed(() => lugares.value.filter(pasa))

const distancia = (l: Coordenada) => (aqui.value ? distanciaMetros(aqui.value, l) : null)

const ordenados = computed(() => {
  const lista = [...visibles.value]
  if (orden.value === 'cerca' && aqui.value) return lista.sort((a, b) => distancia(a)! - distancia(b)!)
  if (orden.value === 'recientes') return lista.sort((a, b) => (b.ultima_resena ?? '').localeCompare(a.ultima_resena ?? ''))
  return lista.sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0) || b.total_resenas - a.total_resenas)
})

const lugar = computed(() => visibles.value.find(l => l.id === seleccionado.value))

watch(visibles, () => {
  if (seleccionado.value && !lugar.value) seleccionado.value = null
})

function ordenarPor(o: Orden) {
  aviso.value = ''
  if (o !== 'cerca' || aqui.value) {
    orden.value = o
    return
  }
  if (!navigator.geolocation) {
    aviso.value = 'Este dispositivo no comparte ubicación.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (p) => {
      aqui.value = { lat: p.coords.latitude, lng: p.coords.longitude }
      orden.value = 'cerca'
    },
    () => (aviso.value = 'Activa el permiso de ubicación para ordenar por cercanía.'),
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

function textoDistancia(m: number | null) {
  if (m == null) return ''
  return m < 1000 ? `a ${Math.round(m / 10) * 10} m` : `a ${(m / 1000).toFixed(1)} km`
}

async function cambiarVista(v: 'mapa' | 'lista') {
  vista.value = v
  seleccionado.value = null
  // El mapa estuvo oculto: hay que avisarle que recalcule su tamaño.
  if (v === 'mapa') {
    await nextTick()
    window.dispatchEvent(new Event('resize'))
  }
}

const ORDENES: { id: Orden, nombre: string }[] = [
  { id: 'nota', nombre: 'Mejor nota' },
  { id: 'recientes', nombre: 'Recientes' },
  { id: 'cerca', nombre: 'Cerca de mí' },
]
</script>

<template>
  <main class="relative flex h-full flex-col overflow-hidden">
    <header class="z-10 space-y-2 bg-garua px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
      <div class="flex items-center gap-2">
        <label class="sticker flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-1.5">
          <Capi :size="30" class="shrink-0" />
          <input
            v-model="filtros.texto"
            type="search"
            placeholder="Busca en Caleta"
            aria-label="Buscar entre los lugares de la mancha"
            class="min-w-0 flex-1 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-tinta/50"
          >
        </label>
        <button
          class="sticker relative grid size-11 shrink-0 place-items-center rounded-full"
          :class="activos ? 'bg-limon' : 'bg-white'"
          aria-label="Filtros"
          @click="panelAbierto = true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          <span v-if="activos" class="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-tinta text-xs font-bold text-white">
            {{ activos }}
          </span>
        </button>
        <NuxtLink to="/perfil" class="sticker grid size-11 shrink-0 place-items-center rounded-full bg-aji font-bold" aria-label="Tu perfil">
          {{ perfil?.nombre.charAt(0).toUpperCase() }}
        </NuxtLink>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex shrink-0 overflow-hidden rounded-full border-2 border-tinta text-sm font-bold" role="tablist">
          <button
            v-for="v in (['mapa', 'lista'] as const)"
            :key="v"
            role="tab"
            :aria-selected="vista === v"
            class="px-3 py-1 capitalize"
            :class="vista === v ? 'bg-tinta text-white' : 'bg-white'"
            @click="cambiarVista(v)"
          >
            {{ v }}
          </button>
        </div>
        <div class="-mr-3 flex min-w-0 flex-1 gap-2 overflow-x-auto pr-3 pb-1">
          <button
            v-if="lugares.some(l => l.pendiente)"
            class="shrink-0 rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold"
            :class="filtros.soloPendientes ? 'bg-aji' : 'bg-white'"
            :aria-pressed="filtros.soloPendientes"
            @click="filtros.soloPendientes = !filtros.soloPendientes"
          >
            🔖 Quiero ir
          </button>
          <button
            v-for="c in categoriasUsadas"
            :key="c.id"
            class="shrink-0 rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold"
            :style="{ background: filtros.categorias.includes(c.id) ? c.color : '#fff' }"
            :aria-pressed="filtros.categorias.includes(c.id)"
            @click="alternar('categorias', c.id)"
          >
            {{ c.emoji }} {{ c.nombre }}
          </button>
        </div>
      </div>

      <p v-if="error" class="sticker bg-white px-3 py-2 text-sm font-semibold" role="alert">
        {{ error }} <button class="underline" @click="cargar">Reintentar</button>
      </p>
    </header>

    <!-- Mapa -->
    <div v-show="vista === 'mapa'" class="relative min-h-0 flex-1 border-t-2 border-tinta">
      <MapaLugares :lugares="visibles" :seleccionado="seleccionado" @seleccionar="seleccionado = $event" />

      <div class="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4 pb-24">
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
            <template v-if="lugar.pendiente">🔖 En tu lista · </template>
            <template v-if="lugar.total_resenas">
              {{ lugar.total_resenas }} {{ lugar.total_resenas === 1 ? 'reseña' : 'reseñas' }} de la mancha ·
            </template>
            <template v-else>Sin reseñas aún · </template>
            Ver ficha
          </p>
        </NuxtLink>

        <div v-else-if="!lugares.length && !error" class="sticker pointer-events-auto bg-white p-4 text-center">
          <Capi :size="64" animo="feliz" class="mx-auto" />
          <p class="font-display text-lg font-bold">El mapa está vacío</p>
          <p class="text-sm">Reseña el primer lugar y aparecerá aquí para toda la mancha.</p>
        </div>

        <div v-else-if="!visibles.length && !error" class="sticker pointer-events-auto bg-white p-4 text-center">
          <p class="font-display text-lg font-bold">Nada con esos filtros</p>
          <p class="text-sm">Quita alguno para ver más lugares.</p>
        </div>
      </div>
    </div>

    <!-- Lista -->
    <div v-show="vista === 'lista'" class="min-h-0 flex-1 overflow-y-auto border-t-2 border-tinta px-3 pt-3 pb-28">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="o in ORDENES"
          :key="o.id"
          class="shrink-0 rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold"
          :class="orden === o.id ? 'bg-tinta text-white' : 'bg-white'"
          :aria-pressed="orden === o.id"
          @click="ordenarPor(o.id)"
        >
          {{ o.nombre }}
        </button>
      </div>
      <p v-if="aviso" class="mt-2 text-sm font-semibold" role="alert">{{ aviso }}</p>

      <p class="mt-3 text-sm font-bold">{{ visibles.length }} {{ visibles.length === 1 ? 'lugar' : 'lugares' }}</p>

      <div v-if="!visibles.length && !error" class="mt-8 text-center">
        <Capi :size="96" :animo="lugares.length ? 'triste' : 'feliz'" class="mx-auto" />
        <p class="mt-2 font-display text-xl font-bold">
          {{ lugares.length ? 'Nada con esos filtros' : 'Aún no hay lugares' }}
        </p>
        <p class="text-sm">{{ lugares.length ? 'Quita alguno para ver más lugares.' : 'Reseña el primero y aparecerá aquí.' }}</p>
      </div>

      <NuxtLink v-for="l in ordenados" :key="l.id" :to="`/lugar/${l.id}`" class="sticker mt-3 block p-3">
        <div class="flex items-start gap-3">
          <span
            class="grid size-11 shrink-0 place-items-center rounded-full border-2 border-tinta text-xl"
            :style="{ background: categoria(l.categoria_id)?.color }"
          >{{ categoria(l.categoria_id)?.emoji }}</span>
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-display text-lg leading-tight font-bold">{{ l.nombre }}</h2>
            <p class="truncate text-sm">
              {{ categoria(l.categoria_id)?.nombre }}
              <template v-if="l.precio"> · {{ etiquetaPrecio(l.precio) }}</template>
              <template v-if="distancia(l) != null"> · {{ textoDistancia(distancia(l)) }}</template>
            </p>
          </div>
          <div class="text-right">
            <span v-if="l.promedio" class="rounded-full border-2 border-tinta bg-limon px-2.5 py-0.5 font-display font-bold">
              {{ l.promedio.toFixed(1) }}
            </span>
            <p class="mt-1 text-xs">
              <template v-if="l.pendiente">🔖 </template>{{ l.total_resenas }} {{ l.total_resenas === 1 ? 'reseña' : 'reseñas' }}
            </p>
          </div>
        </div>
        <div v-if="l.tags.length" class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="t in l.tags.slice(0, 4)"
            :key="t"
            class="rounded-full border-2 border-tinta bg-garua px-2 py-0.5 text-xs font-semibold"
          >{{ tag(t)?.nombre }}</span>
        </div>
      </NuxtLink>
    </div>

    <div class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <NuxtLink
        :to="lugar ? `/nueva?lugar=${lugar.id}` : '/nueva'"
        class="btn pointer-events-auto bg-limon px-6 text-lg shadow-sticker-lg"
      >
        <span class="text-2xl leading-none">+</span> {{ lugar ? 'Reseñar este lugar' : 'Nueva reseña' }}
      </NuxtLink>
    </div>

    <FiltrosPanel v-if="panelAbierto" :resultados="visibles.length" @cerrar="panelAbierto = false" />
  </main>
</template>
