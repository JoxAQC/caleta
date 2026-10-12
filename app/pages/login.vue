<script setup lang="ts">
import { CLAVE_DEMO, USUARIOS_DEMO } from '~/utils/demo'

const supabase = useSupabaseClient()
const demo = useRuntimeConfig().public.demoLogin
const cargando = ref(false)
const error = ref('')

async function entrarConGoogle() {
  cargando.value = true
  error.value = ''
  const { error: e } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/confirm` },
  })
  if (e) {
    error.value = 'No se pudo abrir el login de Google. Intenta de nuevo.'
    cargando.value = false
  }
}

// Login demo: entra con un usuario local y lo crea la primera vez.
async function entrarDemo(u: (typeof USUARIOS_DEMO)[number]) {
  cargando.value = true
  error.value = ''
  const credenciales = { email: u.email, password: CLAVE_DEMO }
  let { error: e } = await supabase.auth.signInWithPassword(credenciales)
  if (e) {
    ({ error: e } = await supabase.auth.signUp({ ...credenciales, options: { data: { full_name: u.nombre } } }))
  }
  if (e) {
    error.value = 'No se pudo entrar. ¿Está encendido Supabase local?'
    cargando.value = false
    return
  }
  await navigateTo('/')
}
</script>

<template>
  <main class="flex min-h-full flex-col items-center justify-between gap-8 bg-limon px-6 pt-14 pb-10">
    <div class="flex flex-col items-center text-center">
      <Capi :size="150" />
      <h1 class="mt-3 font-display text-6xl font-extrabold tracking-tight">Caleta</h1>
      <p class="mt-3 max-w-64 text-lg leading-snug font-semibold">
        Los datos de la mancha, en un solo mapa.
      </p>
    </div>

    <div class="w-full max-w-sm">
      <template v-if="demo">
        <p class="mb-3 text-center text-sm font-bold">Modo demo: ¿quién eres hoy?</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="u in USUARIOS_DEMO"
            :key="u.email"
            class="btn bg-white"
            :disabled="cargando"
            @click="entrarDemo(u)"
          >
            <span class="grid size-7 place-items-center rounded-full border-2 border-tinta text-sm font-bold" :style="{ background: u.color }">
              {{ u.nombre.charAt(0) }}
            </span>
            {{ u.nombre }}
          </button>
        </div>
      </template>

      <template v-else>
        <button class="btn w-full bg-white text-lg" :disabled="cargando" @click="entrarConGoogle">
          {{ cargando ? 'Abriendo Google…' : 'Entrar con Google' }}
        </button>
        <p class="mt-4 text-center text-sm">Solo entran los correos invitados.</p>
      </template>

      <p v-if="error" class="mt-3 text-center text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
    </div>
  </main>
</template>
