<script setup lang="ts">
// Nota de voz que termina como texto. La grabación nunca se guarda:
// en modo 'navegador' ni siquiera existe; en modo 'servidor' se descarta al transcribir.
// 'inicio' avisa que empieza un dictado; 'texto' trae TODO lo dictado desde ese inicio
// (no un fragmento), así quien lo recibe reemplaza en vez de ir sumando.
const emit = defineEmits<{ inicio: [], texto: [texto: string] }>()

const MAX_SEGUNDOS = 90

const modo = useRuntimeConfig().public.transcripcion as 'navegador' | 'servidor'
const estado = ref<'listo' | 'grabando' | 'transcribiendo'>('listo')
const parcial = ref('')
const error = ref('')
const segundos = ref(0)

let reconocedor: any
let grabadora: MediaRecorder | undefined
let reloj: ReturnType<typeof setInterval> | undefined

const Reconocimiento = import.meta.client
  ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition)
  : undefined

const disponible = computed(() =>
  modo === 'servidor' ? typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices : !!Reconocimiento,
)

function iniciarReloj() {
  segundos.value = 0
  reloj = setInterval(() => {
    segundos.value++
    if (segundos.value >= MAX_SEGUNDOS) detener()
  }, 1000)
}

function dictarEnNavegador() {
  reconocedor = new Reconocimiento()
  reconocedor.lang = 'es-PE'
  reconocedor.continuous = true
  reconocedor.interimResults = true
  // Chrome en Android entrega cada resultado final con la frase acumulada completa
  // ("pues", "pues muy", "pues muy buena"…); en escritorio cada final es un tramo nuevo.
  const acumulativo = /Android/i.test(navigator.userAgent)
  reconocedor.onresult = (e: any) => {
    let finales = ''
    let interino = ''
    for (let i = 0; i < e.results.length; i++) {
      const frase = e.results[i][0].transcript.trim()
      if (!e.results[i].isFinal) interino = acumulativo ? frase : `${interino} ${frase}`
      else finales = acumulativo ? frase : `${finales} ${frase}`
    }
    parcial.value = interino.trim()
    if (finales.trim()) emit('texto', finales.trim())
  }
  reconocedor.onerror = (e: any) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') error.value = 'Activa el permiso del micrófono para dictar.'
    else if (e.error !== 'no-speech' && e.error !== 'aborted') error.value = 'No se pudo dictar. Escribe la nota o intenta de nuevo.'
  }
  reconocedor.onend = terminar
  reconocedor.start()
}

async function grabarParaServidor() {
  const flujo = await navigator.mediaDevices.getUserMedia({ audio: true })
  // Safari no graba webm; cae a mp4.
  const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t))
  const trozos: Blob[] = []
  grabadora = new MediaRecorder(flujo, tipo ? { mimeType: tipo } : undefined)
  grabadora.ondataavailable = e => e.data.size && trozos.push(e.data)
  grabadora.onstop = async () => {
    flujo.getTracks().forEach(t => t.stop())
    clearInterval(reloj)
    estado.value = 'transcribiendo'
    try {
      const blob = new Blob(trozos, { type: grabadora!.mimeType })
      const cuerpo = new FormData()
      cuerpo.append('audio', blob, blob.type.includes('mp4') ? 'nota.mp4' : 'nota.webm')
      const { texto } = await $fetch<{ texto: string }>('/api/transcribir', { method: 'POST', body: cuerpo })
      if (texto) emit('texto', texto)
      else error.value = 'No se escuchó nada. Intenta de nuevo.'
    }
    catch {
      error.value = 'No se pudo transcribir. Escribe la nota o intenta de nuevo.'
    }
    estado.value = 'listo'
  }
  grabadora.start()
}

async function iniciar() {
  error.value = ''
  parcial.value = ''
  try {
    if (modo === 'servidor') await grabarParaServidor()
    else dictarEnNavegador()
    emit('inicio')
    estado.value = 'grabando'
    iniciarReloj()
  }
  catch {
    error.value = 'Activa el permiso del micrófono para dictar.'
  }
}

function terminar() {
  clearInterval(reloj)
  parcial.value = ''
  estado.value = 'listo'
}

function detener() {
  if (modo === 'servidor') grabadora?.stop()
  else reconocedor?.stop()
}

onBeforeUnmount(() => {
  clearInterval(reloj)
  reconocedor?.abort?.()
  if (grabadora?.state === 'recording') {
    grabadora.onstop = null
    grabadora.stream.getTracks().forEach(t => t.stop())
  }
})

const tiempo = computed(() => `${Math.floor(segundos.value / 60)}:${String(segundos.value % 60).padStart(2, '0')}`)
</script>

<template>
  <div>
    <button
      v-if="disponible"
      type="button"
      class="btn w-full"
      :class="estado === 'grabando' ? 'bg-rocoto text-white' : 'bg-papel'"
      :disabled="estado === 'transcribiendo'"
      @click="estado === 'grabando' ? detener() : iniciar()"
    >
      <template v-if="estado === 'grabando'">
        <span class="size-3 animate-pulse rounded-sm bg-papel" /> Detener · {{ tiempo }}
      </template>
      <template v-else-if="estado === 'transcribiendo'">Pasando a texto…</template>
      <template v-else><span class="text-xl leading-none">🎙️</span> Dictar la nota</template>
    </button>
    <p v-else class="text-sm">Este navegador no permite dictar. Escribe la nota.</p>

    <p v-if="parcial" class="mt-2 text-sm italic" aria-live="polite">{{ parcial }}</p>
    <p v-if="error" class="mt-2 text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
    <p v-else-if="disponible && estado === 'listo'" class="mt-2 text-sm">Solo se guarda el texto, no la grabación.</p>
  </div>
</template>
