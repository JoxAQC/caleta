<script setup lang="ts">
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Map as MapaGL, Marker } from 'maplibre-gl'
import type { LugarRico } from '~/composables/useLugares'
import type { Coordenada } from '~/utils/tipos'
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
// La cámara se mueve sola una sola vez: al abrir el mapa (a tu ubicación o al lugar recién
// reseñado). Después solo se mueve si la persona lo pide con el botón de ubicación.
let centradoInicial = !!props.enfocar
let tocoElMapa = false
let puntoUsuario: Marker | undefined
let vigilancia: number | undefined

// Los lugares pueden llegar después que el mapa: se intenta en ambos momentos.
function enfocarLugar() {
  if (!enfoquePendiente || !mapa) return
  const l = props.lugares.find(x => x.id === props.enfocar)
  if (!l) return
  enfoquePendiente = false
  mapa.jumpTo({ center: [l.lng, l.lat], zoom: ZOOM_CERCA + 1 })
}

// Ubicación para abrir el mapa ya centrado, sin pasar antes por Lima.
// Acepta una posición reciente del teléfono (hasta 10 min) y no espera más de 3 s:
// si no llega a tiempo o no hay permiso, el mapa abre en Lima.
function ubicacionInicial(): Promise<Coordenada | null> {
  if (!navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolver) => {
    const limite = setTimeout(() => resolver(null), 3000)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(limite)
        resolver({ lat: p.coords.latitude, lng: p.coords.longitude })
      },
      () => {
        clearTimeout(limite)
        resolver(null)
      },
      { maximumAge: 10 * 60 * 1000, timeout: 3000 },
    )
  })
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
  const [modulo, aqui] = await Promise.all([
    import('maplibre-gl'),
    props.enfocar ? Promise.resolve(null) : ubicacionInicial(),
  ])
  gl = modulo
  if (aqui) centradoInicial = true
  mapa = new gl.Map({
    container: contenedor.value!,
    style: estiloMapa(esNoche.value),
    center: aqui ? [aqui.lng, aqui.lat] : [LIMA.lng, LIMA.lat],
    zoom: aqui ? ZOOM_CERCA : 12,
    attributionControl: { compact: true },
  })
  // Botón para volver a tu ubicación cuando tú quieras. No sigue tu posición ni dibuja
  // su propio punto: el punto lo pone mostrarUbicacion() sin tocar la cámara.
  mapa.addControl(new gl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserLocation: false,
    fitBoundsOptions: { maxZoom: ZOOM_CERCA },
  }), 'bottom-right')
  mapa.on('click', () => emit('seleccionar', null))
  // Si la persona ya movió el mapa, una ubicación tardía no se lo cambia.
  mapa.on('dragstart', () => (tocoElMapa = true))
  mapa.on('zoomstart', (e) => {
    if ((e as { originalEvent?: Event }).originalEvent) tocoElMapa = true
  })
  mapa.on('load', enfocarLugar)
  mostrarUbicacion()
  pintar()
})

// Punto azul con tu posición, actualizado en vivo. Nunca mueve la cámara, salvo la
// primera vez si al abrir no había ubicación y todavía no tocaste el mapa.
function mostrarUbicacion() {
  if (!navigator.geolocation || !gl) return
  vigilancia = navigator.geolocation.watchPosition(
    (p) => {
      if (!mapa || !gl) return
      const lngLat: [number, number] = [p.coords.longitude, p.coords.latitude]
      if (!puntoUsuario) {
        const el = document.createElement('div')
        el.className = 'punto-usuario'
        el.setAttribute('aria-label', 'Tu ubicación')
        puntoUsuario = new gl.Marker({ element: el }).setLngLat(lngLat).addTo(mapa)
      }
      else {
        puntoUsuario.setLngLat(lngLat)
      }
      if (!centradoInicial && !tocoElMapa) mapa.jumpTo({ center: lngLat, zoom: ZOOM_CERCA })
      centradoInicial = true
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 30000 },
  )
}

watch(() => [props.lugares, props.seleccionado], () => {
  pintar()
  enfocarLugar()
})

watch(() => props.seleccionado, (id) => {
  const l = props.lugares.find(x => x.id === id)
  if (l && mapa) mapa.easeTo({ center: [l.lng, l.lat], offset: [0, -80], duration: 400 })
})

watch(esNoche, noche => mapa?.setStyle(estiloMapa(noche)))

onBeforeUnmount(() => {
  if (vigilancia !== undefined) navigator.geolocation.clearWatch(vigilancia)
  mapa?.remove()
})
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

/* Tu ubicación: punto azul con halo, al estilo de los mapas de siempre. */
.punto-usuario {
  width: 18px;
  height: 18px;
  border: 3px solid #fff;
  border-radius: 999px;
  background: #2f80ed;
  box-shadow: 0 0 0 6px rgb(47 128 237 / 0.25);
}

.pin--activo {
  width: 48px;
  height: 48px;
  font-size: 24px;
  z-index: 2;
  box-shadow: 4px 4px 0 var(--color-tinta);
}
</style>
