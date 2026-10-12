<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapaGL, Marker } from 'maplibre-gl'
import type { LugarRico } from '~/composables/useLugares'
import { LIMA } from '~/utils/catalogo'

const props = defineProps<{ lugares: LugarRico[], seleccionado?: string | null }>()
const emit = defineEmits<{ seleccionar: [id: string | null] }>()

const { categoria } = useCatalogo()
const contenedor = ref<HTMLElement>()
let mapa: MapaGL | undefined
let gl: typeof import('maplibre-gl') | undefined
let marcadores: Marker[] = []

function pintar() {
  if (!mapa || !gl) return
  marcadores.forEach(m => m.remove())
  marcadores = props.lugares.map((l) => {
    const cat = categoria(l.categoria_id)
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'pin'
    el.classList.toggle('pin--activo', l.id === props.seleccionado)
    el.classList.toggle('pin--pendiente', l.pendiente)
    el.style.background = cat?.color ?? '#fff'
    el.setAttribute('aria-label', l.pendiente ? `${l.nombre}, en tu lista Quiero ir` : l.nombre)
    el.textContent = cat?.emoji ?? '📍'
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      emit('seleccionar', l.id)
    })
    return new gl!.Marker({ element: el, anchor: 'center' }).setLngLat([l.lng, l.lat]).addTo(mapa!)
  })
}

onMounted(async () => {
  gl = await import('maplibre-gl')
  mapa = new gl.Map({
    container: contenedor.value!,
    style: 'https://tiles.openfreemap.org/styles/positron',
    center: [LIMA.lng, LIMA.lat],
    zoom: 12,
    attributionControl: { compact: true },
  })
  mapa.addControl(
    new gl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
    'bottom-right',
  )
  mapa.on('click', () => emit('seleccionar', null))
  pintar()
})

watch(() => [props.lugares, props.seleccionado], pintar)

watch(() => props.seleccionado, (id) => {
  const l = props.lugares.find(x => x.id === id)
  if (l && mapa) mapa.easeTo({ center: [l.lng, l.lat], offset: [0, -80], duration: 400 })
})

onBeforeUnmount(() => mapa?.remove())
</script>

<template>
  <div ref="contenedor" class="size-full" />
</template>

<style>
.pin {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 2px solid var(--color-tinta);
  border-radius: 999px;
  box-shadow: 2px 2px 0 var(--color-tinta);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

/* En "Quiero ir": borde punteado y marcador. */
.pin--pendiente {
  border-style: dashed;
}

.pin--pendiente::after {
  content: '🔖';
  position: absolute;
  top: -10px;
  right: -8px;
  font-size: 14px;
}

.pin--activo {
  width: 48px;
  height: 48px;
  font-size: 24px;
  z-index: 2;
  box-shadow: 4px 4px 0 var(--color-tinta);
}
</style>
