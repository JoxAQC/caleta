<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapaGL } from 'maplibre-gl'
import type { Coordenada } from '~/utils/tipos'
import { distanciaMetros, estiloMapa, LIMA } from '~/utils/catalogo'

// Mapa con un pin fijo al centro: se elige la ubicación moviendo el mapa.
const posicion = defineModel<Coordenada | null>({ required: true })
const props = defineProps<{ bloqueado?: boolean }>()

const { esNoche } = useModo()
const contenedor = ref<HTMLElement>()
let mapa: MapaGL | undefined

onMounted(async () => {
  const gl = await import('maplibre-gl')
  const inicio = posicion.value ?? LIMA
  mapa = new gl.Map({
    container: contenedor.value!,
    style: estiloMapa(esNoche.value),
    center: [inicio.lng, inicio.lat],
    zoom: posicion.value ? 16 : 12,
    attributionControl: { compact: true },
    interactive: !props.bloqueado,
  })

  mapa.on('moveend', () => {
    const c = mapa!.getCenter()
    posicion.value = { lat: c.lat, lng: c.lng }
  })

  if (!posicion.value && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => mapa?.jumpTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 16 }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }
})

// Cambios externos (elegir un resultado del buscador) mueven el mapa.
watch(posicion, (p) => {
  if (!p || !mapa) return
  const c = mapa.getCenter()
  if (distanciaMetros(p, { lat: c.lat, lng: c.lng }) > 5) {
    mapa.jumpTo({ center: [p.lng, p.lat], zoom: Math.max(mapa.getZoom(), 16) })
  }
})

watch(esNoche, noche => mapa?.setStyle(estiloMapa(noche)))

onBeforeUnmount(() => mapa?.remove())
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl border-2 border-tinta">
    <div ref="contenedor" class="size-full" />
    <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-4xl drop-shadow-[2px_2px_0_var(--color-tinta)]" aria-hidden="true">
      📍
    </div>
  </div>
</template>
