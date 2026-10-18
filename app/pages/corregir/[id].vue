<script setup lang="ts">
import type { Coordenada, Lugar } from '~/utils/tipos'
import { PRECIOS } from '~/utils/catalogo'

// Cualquiera de la mancha puede corregir los datos de un lugar: nombre, categoría,
// precio, dirección y ubicación. Las reseñas no se tocan.
const route = useRoute()
const supabase = useSupabaseClient()
const { cargar: cargarCatalogo } = useCatalogo()

const id = route.params.id as string
const estado = ref<'cargando' | 'listo' | 'error'>('cargando')
const nombre = ref('')
const direccion = ref('')
const categoriaId = ref<string | null>(null)
const precio = ref<number | null>(null)
const posicion = ref<Coordenada | null>(null)
const guardando = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    await cargarCatalogo()
    const { data, error: e } = await supabase.from('lugares').select('*').eq('id', id).maybeSingle()
    if (e || !data) throw e
    const l = data as Lugar
    nombre.value = l.nombre
    direccion.value = l.direccion ?? ''
    categoriaId.value = l.categoria_id
    precio.value = l.precio
    posicion.value = { lat: l.lat, lng: l.lng }
    estado.value = 'listo'
  }
  catch {
    estado.value = 'error'
  }
})

const valido = computed(() => nombre.value.trim().length > 1 && !!categoriaId.value && !!posicion.value)

async function guardar() {
  if (!valido.value || guardando.value) return
  guardando.value = true
  error.value = ''
  const { error: e } = await supabase
    .from('lugares')
    .update({
      nombre: nombre.value.trim(),
      direccion: direccion.value.trim() || null,
      categoria_id: categoriaId.value!,
      precio: precio.value,
      lat: posicion.value!.lat,
      lng: posicion.value!.lng,
    })
    .eq('id', id)
  guardando.value = false
  if (e) {
    error.value = 'No se pudieron guardar los cambios. Intenta de nuevo.'
    return
  }
  await navigateTo(`/lugar/${id}`)
}
</script>

<template>
  <main class="mx-auto flex h-full max-w-md flex-col">
    <header class="px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <NuxtLink :to="`/lugar/${id}`" class="text-sm font-bold">← Volver</NuxtLink>
      <h1 class="mt-3 font-display text-3xl leading-tight font-extrabold">Corregir el lugar</h1>
      <p class="text-sm">Lo que cambies aquí lo verá toda la mancha.</p>
    </header>

    <div v-if="estado === 'cargando'" class="m-auto text-center">
      <Capi :size="96" animo="dormido" class="mx-auto animate-pulse" />
      <p class="mt-2 font-display text-xl font-bold">Cargando…</p>
    </div>

    <div v-else-if="estado === 'error'" class="m-auto text-center">
      <Capi :size="96" animo="triste" class="mx-auto" />
      <p class="mt-2 font-display text-xl font-bold">No se pudo cargar el lugar</p>
    </div>

    <template v-else>
      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pt-4 pb-4">
        <label class="block">
          <span class="text-sm font-bold">Nombre</span>
          <input
            v-model="nombre"
            type="text"
            maxlength="80"
            class="sticker mt-1 w-full px-4 py-3 font-display text-lg font-bold outline-none"
          >
        </label>

        <div>
          <span class="text-sm font-bold">Categoría</span>
          <SelectorCategoria v-model="categoriaId" class="mt-2" />
        </div>

        <div>
          <span class="text-sm font-bold">Precio de referencia</span>
          <p class="text-xs">Se usa mientras el lugar no tenga reseñas con precio.</p>
          <div class="mt-1 grid grid-cols-4 gap-2">
            <button
              v-for="p in PRECIOS"
              :key="p.valor"
              class="rounded-2xl border-2 border-tinta px-1 py-2 text-center text-sm font-bold"
              :class="precio === p.valor ? 'bg-tinta text-papel' : 'bg-papel'"
              :aria-pressed="precio === p.valor"
              @click="precio = precio === p.valor ? null : p.valor"
            >
              {{ p.etiqueta }}
            </button>
          </div>
        </div>

        <label class="block">
          <span class="text-sm font-bold">Dirección</span>
          <input
            v-model="direccion"
            type="text"
            maxlength="160"
            placeholder="Av. Grau 123, Barranco"
            class="sticker mt-1 w-full px-4 py-3 outline-none placeholder:text-tinta/50"
          >
        </label>

        <div>
          <span class="text-sm font-bold">Ubicación</span>
          <p class="text-sm">Mueve el mapa hasta dejar el pin sobre el lugar.</p>
          <MapaPicker v-model="posicion" class="mt-2 h-64" />
        </div>
      </div>

      <footer class="px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p v-if="error" class="mb-2 text-center text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
        <button class="btn w-full bg-limon text-lg" :disabled="!valido || guardando" @click="guardar">
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </footer>
    </template>
  </main>
</template>
