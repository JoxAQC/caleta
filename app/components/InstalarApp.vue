<script setup lang="ts">
// Invita a instalar la PWA. En Android/Chrome usa el aviso nativo;
// en iPhone no existe, así que se explican los pasos de Safari.
const CLAVE = 'caleta:instalar-oculto'

const instalada = ref(true)
const oculto = ref(false)
const esIOS = ref(false)
const enSafari = ref(true)
const pasosAbiertos = ref(false)
let aviso: any

function alAviso(e: Event) {
  e.preventDefault()
  aviso = e
  disponible.value = true
}
const disponible = ref(false)

onMounted(() => {
  const ua = navigator.userAgent
  // iPadOS se presenta como Mac; se distingue por la pantalla táctil.
  esIOS.value = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  enSafari.value = !/CriOS|FxiOS|EdgiOS/.test(ua)
  instalada.value = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
  try {
    oculto.value = localStorage.getItem(CLAVE) === '1'
  }
  catch {}
  window.addEventListener('beforeinstallprompt', alAviso)
  window.addEventListener('appinstalled', () => (instalada.value = true))
})

onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', alAviso))

async function instalar() {
  if (!aviso) return
  aviso.prompt()
  await aviso.userChoice
  aviso = undefined
  disponible.value = false
}

function ocultar() {
  oculto.value = true
  try {
    localStorage.setItem(CLAVE, '1')
  }
  catch {}
}

const visible = computed(() => !instalada.value && !oculto.value && (esIOS.value || disponible.value))
</script>

<template>
  <section v-if="visible" class="sticker bg-limon p-4">
    <div class="flex items-start gap-3">
      <Capi :size="48" animo="feliz" class="shrink-0" />
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-lg leading-tight font-bold">Lleva Caleta en tu inicio</h2>
        <p class="text-sm">Se abre como una app, a pantalla completa.</p>
      </div>
      <button class="text-sm font-bold underline" @click="ocultar">Ahora no</button>
    </div>

    <template v-if="esIOS">
      <button class="btn mt-3 w-full bg-papel py-2 text-sm" :aria-expanded="pasosAbiertos" @click="pasosAbiertos = !pasosAbiertos">
        {{ pasosAbiertos ? 'Ocultar pasos' : 'Ver cómo instalarla' }}
      </button>
      <ol v-if="pasosAbiertos" class="mt-3 list-decimal space-y-1 pl-5 text-sm font-semibold">
        <li v-if="!enSafari">Abre esta página en Safari; desde otro navegador no se puede.</li>
        <li>Toca el botón Compartir, el cuadrado con la flecha hacia arriba.</li>
        <li>Elige "Agregar a inicio".</li>
        <li>Confirma con "Agregar".</li>
      </ol>
    </template>
    <button v-else class="btn mt-3 w-full bg-tinta py-2 text-sm text-papel" @click="instalar">Instalar</button>
  </section>
</template>
