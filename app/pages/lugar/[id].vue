<script setup lang="ts">
import type { LugarResumen, Resena } from '~/utils/tipos'
import { ASPECTOS, emojiDePlan, etiquetaPrecio, NOTAS, PLANES } from '~/utils/catalogo'

const route = useRoute()
const supabase = useSupabaseClient()
const { categoria, tag, cargar: cargarCatalogo } = useCatalogo()

const lugar = ref<LugarResumen | null>(null)
const resenas = ref<Resena[]>([])
const urls = ref<Record<string, string>>({})
const estado = ref<'cargando' | 'listo' | 'error' | 'no-existe'>('cargando')

async function cargar() {
  estado.value = 'cargando'
  try {
    await cargarCatalogo()
    const id = route.params.id as string
    const [l, r] = await Promise.all([
      supabase.from('lugares_resumen').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('resenas')
        .select('*, autor:perfiles(nombre, avatar_url), resena_tags(tag_id), fotos(path)')
        .eq('lugar_id', id)
        .order('creado_en', { ascending: false }),
    ])
    if (l.error) throw l.error
    if (r.error) throw r.error
    if (!l.data) {
      estado.value = 'no-existe'
      return
    }
    lugar.value = l.data as LugarResumen
    resenas.value = r.data as Resena[]

    const rutas = resenas.value.flatMap(x => x.fotos.map(f => f.path))
    if (rutas.length) {
      const { data } = await supabase.storage.from('fotos').createSignedUrls(rutas, 3600)
      for (const d of data ?? []) {
        if (d.path && d.signedUrl) urls.value[d.path] = d.signedUrl
      }
    }
    estado.value = 'listo'
  }
  catch {
    estado.value = 'error'
  }
}
onMounted(cargar)

const cat = computed(() => categoria(lugar.value?.categoria_id))
// visitado_en llega como AAAA-MM-DD; se arma en hora local para no correr el día.
function fecha(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a!, m! - 1, d!).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}
const nombrePlan = (id: string | null) => PLANES.find(p => p.id === id)?.nombre
</script>

<template>
  <main class="mx-auto min-h-full max-w-md px-5 pt-6 pb-28">
    <NuxtLink to="/" class="text-sm font-bold">← Volver al mapa</NuxtLink>

    <p v-if="estado === 'cargando'" class="mt-10 text-center font-display text-xl font-bold">Cargando…</p>

    <div v-else-if="estado === 'error'" class="mt-10 text-center">
      <p class="font-display text-xl font-bold">No se pudo cargar el lugar</p>
      <button class="btn mt-4 bg-limon" @click="cargar">Reintentar</button>
    </div>

    <p v-else-if="estado === 'no-existe'" class="mt-10 text-center font-display text-xl font-bold">
      Este lugar no existe o no es de tu grupo
    </p>

    <template v-else-if="lugar">
      <p v-if="route.query.fotosFallidas" class="sticker mt-4 bg-white px-3 py-2 text-sm font-semibold" role="alert">
        La reseña se guardó, pero {{ route.query.fotosFallidas }} foto(s) no se pudieron subir.
      </p>
      <header class="sticker mt-4 p-4" :style="{ background: cat?.color }">
        <p class="text-sm font-bold">
          {{ cat?.emoji }} {{ cat?.nombre }}
          <template v-if="lugar.precio"> · {{ etiquetaPrecio(lugar.precio) }}</template>
        </p>
        <h1 class="mt-1 font-display text-3xl leading-none font-extrabold">{{ lugar.nombre }}</h1>
        <p v-if="lugar.direccion" class="mt-1 text-sm">{{ lugar.direccion }}</p>
        <div class="mt-3 flex items-center gap-3">
          <span v-if="lugar.promedio" class="rounded-full border-2 border-tinta bg-white px-3 py-0.5 font-display text-xl font-bold">
            {{ lugar.promedio.toFixed(1) }}
          </span>
          <span class="text-sm font-semibold">
            {{ lugar.total_resenas }} {{ lugar.total_resenas === 1 ? 'reseña' : 'reseñas' }}
          </span>
          <a
            class="ml-auto text-sm font-bold underline"
            :href="`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`"
            target="_blank"
            rel="noopener"
          >Cómo llegar</a>
        </div>
      </header>

      <p v-if="!resenas.length" class="mt-8 text-center">Aún no hay reseñas de este lugar.</p>

      <article v-for="r in resenas" :key="r.id" class="sticker mt-4 p-4">
        <div class="flex items-center gap-2">
          <span class="grid size-8 place-items-center rounded-full border-2 border-tinta bg-aji text-sm font-bold">
            {{ r.autor?.nombre.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0 flex-1 leading-tight">
            <p class="font-bold">{{ r.autor?.nombre }}</p>
            <p class="text-xs">{{ fecha(r.visitado_en) }}<template v-if="r.plan"> · {{ nombrePlan(r.plan) }}</template></p>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <Puntaje :model-value="r.general" :plan="r.plan" solo-lectura />
          <span class="font-display font-bold">{{ NOTAS[r.general - 1] }}</span>
        </div>

        <dl v-if="ASPECTOS.some(a => r[a.id])" class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <template v-for="a in ASPECTOS" :key="a.id">
            <div v-if="r[a.id]" class="flex justify-between">
              <dt>{{ a.nombre }}</dt>
              <dd class="font-bold">{{ r[a.id] }}/5</dd>
            </div>
          </template>
        </dl>

        <div v-if="r.resena_tags.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="t in r.resena_tags"
            :key="t.tag_id"
            class="rounded-full border-2 border-tinta bg-garua px-2.5 py-0.5 text-xs font-semibold"
          >{{ tag(t.tag_id)?.nombre }}</span>
        </div>

        <p v-if="r.nota" class="mt-3 whitespace-pre-line">{{ r.nota }}</p>

        <div v-if="r.fotos.length" class="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          <a v-for="f in r.fotos" :key="f.path" :href="urls[f.path]" target="_blank" rel="noopener" class="shrink-0">
            <img
              :src="urls[f.path]"
              :alt="`Foto de ${lugar.nombre} por ${r.autor?.nombre}`"
              loading="lazy"
              class="size-28 rounded-xl border-2 border-tinta object-cover"
            >
          </a>
        </div>
      </article>

      <div class="fixed inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NuxtLink :to="`/nueva?lugar=${lugar.id}`" class="btn bg-limon px-6 text-lg shadow-sticker-lg">
          <span class="text-2xl leading-none">{{ emojiDePlan() }}</span> Reseñar este lugar
        </NuxtLink>
      </div>
    </template>
  </main>
</template>
