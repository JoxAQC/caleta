<script setup lang="ts">
import type { Perfil } from '~/utils/tipos'

const supabase = useSupabaseClient()
const { perfil, salir } = usePerfil()
const mancha = ref<Pick<Perfil, 'id' | 'nombre' | 'avatar_url'>[]>([])

onMounted(async () => {
  const { data } = await supabase.from('perfiles').select('id, nombre, avatar_url').order('nombre')
  mancha.value = data ?? []
})
</script>

<template>
  <main class="mx-auto flex min-h-full max-w-md flex-col px-5 pt-6 pb-8">
    <NuxtLink to="/" class="text-sm font-bold">← Volver al mapa</NuxtLink>

    <header class="mt-5 flex items-center gap-3">
      <Capi :size="56" />
      <div>
        <p class="text-sm font-semibold">Hola,</p>
        <h1 class="font-display text-3xl leading-none font-extrabold">{{ perfil?.nombre }}</h1>
      </div>
    </header>

    <section class="sticker mt-8 p-4">
      <h2 class="font-display text-lg font-bold">La mancha</h2>
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
          <span class="font-semibold">{{ p.nombre }}</span>
          <span v-if="p.id === perfil?.id" class="text-sm">(tú)</span>
        </li>
      </ul>
    </section>

    <button class="btn mt-auto bg-white" @click="salir">Cerrar sesión</button>
  </main>
</template>
