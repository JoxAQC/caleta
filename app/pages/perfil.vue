<script setup lang="ts">
import type { Perfil } from '~/utils/tipos'

const supabase = useSupabaseClient()
const { perfil, salir } = usePerfil()

const mancha = ref<(Pick<Perfil, 'id' | 'nombre' | 'avatar_url'> & { resenas: number })[]>([])
const pendientes = ref(0)
const error = ref(false)

onMounted(async () => {
  const [p, r, q] = await Promise.all([
    supabase.from('perfiles').select('id, nombre, avatar_url').order('nombre'),
    supabase.from('resenas').select('autor_id'),
    supabase.from('pendientes').select('lugar_id', { count: 'exact', head: true }).eq('usuario_id', perfil.value?.id ?? ''),
  ])
  if (p.error || r.error || q.error) {
    error.value = true
    return
  }
  mancha.value = p.data.map(x => ({ ...x, resenas: r.data.filter(y => y.autor_id === x.id).length }))
  pendientes.value = q.count ?? 0
})

const misResenas = computed(() => mancha.value.find(x => x.id === perfil.value?.id)?.resenas ?? 0)
const { filtros } = useFiltros()

function verPendientes() {
  filtros.value.soloPendientes = true
  navigateTo('/')
}
</script>

<template>
  <main class="mx-auto flex min-h-full max-w-md flex-col px-5 pt-6 pb-8">
    <NuxtLink to="/" class="text-sm font-bold">← Volver al mapa</NuxtLink>

    <header class="mt-5 flex items-center gap-3">
      <Capi :size="64" animo="feliz" />
      <div>
        <p class="text-sm font-semibold">Hola,</p>
        <h1 class="font-display text-3xl leading-none font-extrabold">{{ perfil?.nombre }}</h1>
      </div>
    </header>

    <div class="mt-6 grid grid-cols-2 gap-3">
      <div class="sticker bg-limon p-3">
        <p class="font-display text-3xl leading-none font-extrabold">{{ misResenas }}</p>
        <p class="mt-1 text-sm font-semibold">{{ misResenas === 1 ? 'reseña tuya' : 'reseñas tuyas' }}</p>
      </div>
      <button class="sticker bg-aji p-3 text-left disabled:opacity-100" :disabled="!pendientes" @click="verPendientes">
        <p class="font-display text-3xl leading-none font-extrabold">{{ pendientes }}</p>
        <p class="mt-1 text-sm font-semibold">🔖 en "Quiero ir"<template v-if="pendientes"> · Ver</template></p>
      </button>
    </div>

    <InstalarApp class="mt-5" />

    <section class="sticker mt-5 p-4">
      <h2 class="font-display text-lg font-bold">La mancha</h2>
      <p v-if="error" class="mt-2 text-sm font-semibold" role="alert">No se pudo cargar la lista.</p>
      <ul class="mt-3 space-y-3">
        <li v-for="p in mancha" :key="p.id" class="flex items-center gap-3">
          <img
            v-if="p.avatar_url"
            :src="p.avatar_url"
            alt=""
            referrerpolicy="no-referrer"
            class="size-9 rounded-full border-2 border-tinta object-cover"
          >
          <span v-else class="grid size-9 place-items-center rounded-full border-2 border-tinta bg-aji font-bold">
            {{ p.nombre.charAt(0).toUpperCase() }}
          </span>
          <span class="font-semibold">{{ p.nombre }}<template v-if="p.id === perfil?.id"> (tú)</template></span>
          <span class="ml-auto text-sm">{{ p.resenas }} {{ p.resenas === 1 ? 'reseña' : 'reseñas' }}</span>
        </li>
      </ul>
    </section>

    <button class="btn mt-auto bg-white" @click="salir">Cerrar sesión</button>
  </main>
</template>
