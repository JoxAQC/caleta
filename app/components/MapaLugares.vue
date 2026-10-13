<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapaGL, Marker } from 'maplibre-gl'
import type { LugarRico } from '~/composables/useLugares'
import { estiloMapa, LIMA } from '~/utils/catalogo'

// enfocar: id del lugar en el que debe abrir el mapa (por ejemplo, el recién reseñado).
// Sin él, el mapa abre en la ubicación de la persona si dio permiso.
const props = defineProps<{ lugares: LugarRico[], seleccionado?: string | null, enfocar?: string | null }>()

const ZOOM_CERCA = 15
const emit = defineEmits<{ seleccionar: [id: string | null] }>()

const { categoria } = useCatalogo()
const { esNoche } = useModo()
const contenedor = ref<HTMLElement>()
let mapa: MapaGL | undefined
let gl: typeof import('maplibre-gl') | undefined
let marcadores: Marker[] = []
let enfoquePendiente = !!props.enfocar

// Los lugares pueden llegar después que el mapa: se intenta en ambos momentos.
function enfocarLugar() {
  if (!enfoquePendiente || !mapa) return
  const l = props.lugares.find(x => x.id === props.enfocar)
  if (!l) return
  enfoquePendiente = false
  mapa.jumpTo({ center: [l.lng, l.lat], zoom: ZOOM_CERCA + 1 })
}

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
    style: estiloMapa(esNoche.value),
    center: [LIMA.lng, LIMA.lat],
    zoom: 12,
    attributionControl: { compact: true },
  })
  const ubicacion = new gl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    fitBoundsOptions: { maxZoom: ZOOM_CERCA },
  })
  mapa.addControl(ubicacion, 'bottom-right')
  mapa.on('click', () => emit('seleccionar', null))
  mapa.on('load', () => {
    // Al abrir, acerca a donde está la persona; si no da permiso, se queda en la vista de Lima.
    if (props.enfocar) enfocarLugar()
    else ubicacion.trigger()
  })
  pintar()
})

watch(() => [props.lugares, props.seleccionado], () => {
  pintar()
  enfocarLugar()
})

watch(() => props.seleccionado, (id) => {
  const l = props.lugares.find(x => x.id === id)
  if (l && mapa) mapa.easeTo({ center: [l.lng, l.lat], offset: [0, -80], duration: 400 })
})

watch(esNoche, noche => mapa?.setStyle(estiloMapa(noche)))

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
