<script setup lang="ts">
import { CLAVE_DEMO, USUARIOS_DEMO } from '~/utils/demo'

const supabase = useSupabaseClient()
const demo = useRuntimeConfig().public.demoLogin
const cargando = ref(false)
const error = ref('')
const invitado = ref(false)

onMounted(() => (invitado.value = !!invitacionGuardada()))

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
  <main class="relative flex min-h-full flex-col items-center justify-between gap-8 bg-escena px-6 pt-14 pb-10">
    <div class="absolute top-4 right-4">
      <ModoSwitch />
    </div>
    <div class="flex flex-col items-center text-center">
      <Capi :size="150" animo="feliz" />
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
            class="btn bg-papel"
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
        <button class="btn w-full bg-papel text-lg" :disabled="cargando" @click="entrarConGoogle">
          <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.540 0 6.710 1.220 9.210 3.600l6.850-6.850C35.900 2.380 30.470 0 24 0 14.620 0 6.510 5.380 2.560 13.220l7.980 6.190C12.430 13.720 17.740 9.500 24 9.500z" />
            <path fill="#4285F4" d="M46.980 24.550c0-1.570-.150-3.090-.380-4.550H24v9.020h12.940c-.580 2.960-2.260 5.480-4.780 7.180l7.730 6c4.510-4.180 7.090-10.360 7.090-17.650z" />
            <path fill="#FBBC05" d="M10.530 28.590c-.480-1.450-.760-2.990-.760-4.590s.270-3.140.760-4.590l-7.980-6.190C.920 16.460 0 20.120 0 24c0 3.880.920 7.540 2.560 10.780l7.970-6.190z" />
            <path fill="#34A853" d="M24 48c6.480 0 11.930-2.130 15.890-5.810l-7.730-6c-2.150 1.450-4.920 2.300-8.160 2.300-6.260 0-11.570-4.220-13.470-9.910l-7.980 6.190C6.510 42.620 14.620 48 24 48z" />
          </svg>
          {{ cargando ? 'Abriendo Google…' : 'Entrar con Google' }}
        </button>
        <p class="mt-4 text-center text-sm" :class="invitado ? 'font-bold' : ''">
          {{ invitado ? 'Tienes una invitación a la mancha. Entra para aceptarla.' : 'Solo se entra con invitación.' }}
        </p>
      </template>

      <p v-if="error" class="mt-3 text-center text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
    </div>
  </main>
</template>
