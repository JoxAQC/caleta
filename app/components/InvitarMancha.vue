<script setup lang="ts">
interface Invitacion {
  codigo: string
  expira_en: string
  usos: number
}

const supabase = useSupabaseClient()
const { perfil } = usePerfil()

const invitaciones = ref<Invitacion[]>([])
const creando = ref(false)
const aviso = ref('')
const error = ref('')
const puedeCompartir = ref(false)

const enlace = (codigo: string) => `${window.location.origin}/unirse/${codigo}`
const vence = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

async function cargar() {
  const { data, error: e } = await supabase
    .from('invitaciones')
    .select('codigo, expira_en, usos')
    .eq('anulada', false)
    .gt('expira_en', new Date().toISOString())
    .order('creado_en', { ascending: false })
  if (e) {
    error.value = 'No se pudieron cargar los enlaces.'
    return
  }
  invitaciones.value = data
}

onMounted(() => {
  puedeCompartir.value = typeof navigator.share === 'function'
  cargar()
})

async function crear() {
  if (!perfil.value || creando.value) return
  creando.value = true
  error.value = ''
  aviso.value = ''
  const { data, error: e } = await supabase
    .from('invitaciones')
    .insert({ grupo_id: perfil.value.grupo_id, creado_por: perfil.value.id })
    .select('codigo, expira_en, usos')
    .single()
  creando.value = false
  if (e) {
    error.value = 'No se pudo crear el enlace.'
    return
  }
  invitaciones.value.unshift(data)
}

async function copiar(codigo: string) {
  error.value = ''
  try {
    await navigator.clipboard.writeText(enlace(codigo))
    aviso.value = 'Enlace copiado.'
  }
  catch {
    error.value = 'No se pudo copiar. Mantén presionado el enlace para copiarlo.'
  }
}

async function compartir(codigo: string) {
  try {
    await navigator.share({ title: 'Caleta', text: 'Únete a la mancha en Caleta:', url: enlace(codigo) })
  }
  catch {
    // La persona cerró el panel de compartir: no es un error.
  }
}

async function anular(codigo: string) {
  error.value = ''
  aviso.value = ''
  const antes = [...invitaciones.value]
  invitaciones.value = antes.filter(i => i.codigo !== codigo)
  const { error: e } = await supabase.from('invitaciones').update({ anulada: true }).eq('codigo', codigo)
  if (e) {
    invitaciones.value = antes
    error.value = 'No se pudo anular el enlace.'
    return
  }
  aviso.value = 'Enlace anulado: ya no sirve para entrar.'
}
</script>

<template>
  <section class="sticker p-4">
    <h2 class="font-display text-lg font-bold">Invitar a la mancha</h2>
    <p class="mt-1 text-sm">Quien abra el enlace y entre con su Google queda dentro. Dura 7 días.</p>

    <div v-for="i in invitaciones" :key="i.codigo" class="mt-3 rounded-xl border-2 border-tinta bg-garua p-3">
      <p class="text-sm font-semibold break-all select-all">{{ enlace(i.codigo) }}</p>
      <p class="mt-1 text-xs">
        Vence el {{ vence(i.expira_en) }} · {{ i.usos }} {{ i.usos === 1 ? 'persona entró' : 'personas entraron' }}
      </p>
      <div class="mt-2 flex flex-wrap gap-2 text-sm font-bold">
        <button v-if="puedeCompartir" class="rounded-full border-2 border-tinta bg-limon px-3 py-1" @click="compartir(i.codigo)">
          Compartir
        </button>
        <button class="rounded-full border-2 border-tinta bg-white px-3 py-1" @click="copiar(i.codigo)">Copiar</button>
        <button class="ml-auto underline" @click="anular(i.codigo)">Anular</button>
      </div>
    </div>

    <button class="btn mt-3 w-full py-2 text-sm" :class="invitaciones.length ? 'bg-white' : 'bg-limon'" :disabled="creando" @click="crear">
      {{ creando ? 'Creando…' : invitaciones.length ? 'Crear otro enlace' : 'Crear enlace de invitación' }}
    </button>

    <p v-if="aviso" class="mt-2 text-sm font-semibold" role="status">{{ aviso }}</p>
    <p v-if="error" class="mt-2 text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
  </section>
</template>
