<script setup lang="ts">
import type { Coordenada, LugarResumen, PlanId } from '~/utils/tipos'
import type { AspectoId } from '~/utils/catalogo'
import type { ResultadoBusqueda } from '~/utils/buscador'
import { ASPECTOS, LIMA, NOTAS, PLANES, PRECIOS } from '~/utils/catalogo'
import { buscarLugares } from '~/utils/buscador'
import { comprimirImagen } from '~/utils/imagen'

const MAX_FOTOS = 4

const route = useRoute()
const supabase = useSupabaseClient()
const { perfil } = usePerfil()
const { tags, categoria, cargar: cargarCatalogo } = useCatalogo()
const { esNoche } = useModo()

const paso = ref(1)
const lugaresGrupo = ref<LugarResumen[]>([])

// Paso 1: lugar
const existente = ref<LugarResumen | null>(null)
const nombre = ref('')
const direccion = ref('')
const posicion = ref<Coordenada | null>(null)
const origen = ref<{ proveedor: string, ref_externa: string } | null>(null)
const busqueda = ref('')
const resultados = ref<ResultadoBusqueda[]>([])
const buscando = ref(false)

// Paso 2: categoría y precio
const categoriaId = ref<string | null>(null)
const precio = ref<number | null>(null)

// Paso 3: calificación
const plan = ref<PlanId | null>(null)
const general = ref(0)
const generalManual = ref(false)
const detallado = ref(false)
const aspectos = reactive<Record<AspectoId, number>>({ comida: 0, ambiente: 0, servicio: 0, calidad_precio: 0 })
const tagsElegidos = ref<string[]>([])

// Paso 4: fotos y nota
const nota = ref('')
const platos = ref<string[]>([])
const privada = ref(false)
const fotos = ref<{ archivo: File, vista: string }[]>([])

const guardando = ref(false)
const error = ref('')

// Modo edición (?editar=<id de reseña>): se abre en el paso 3 con la reseña precargada.
const editando = ref<string | null>(null)
const privadaAntes = ref(false)
// Si otras personas comentaron, la reseña no puede pasar a privada.
const comentariosAjenos = ref(false)
const fotosActuales = ref<{ path: string, url: string }[]>([])
const fotosQuitadas = ref<string[]>([])

onMounted(async () => {
  try {
    await cargarCatalogo()
    const { data } = await supabase.from('lugares_resumen').select('*')
    lugaresGrupo.value = (data ?? []) as LugarResumen[]
    if (typeof route.query.editar === 'string') {
      await cargarParaEditar(route.query.editar)
      return
    }
    const id = route.query.lugar
    const previo = lugaresGrupo.value.find(l => l.id === id)
    if (previo) {
      elegirExistente(previo)
      paso.value = 3
    }
  }
  catch {
    error.value = 'No se pudo cargar el catálogo. Revisa tu conexión.'
  }
})

onBeforeUnmount(() => fotos.value.forEach(f => URL.revokeObjectURL(f.vista)))

async function cargarParaEditar(resenaId: string) {
  const { data: r, error: e } = await supabase
    .from('resenas')
    .select('*, resena_tags(tag_id), fotos(path), comentarios(autor_id)')
    .eq('id', resenaId)
    .eq('autor_id', perfil.value?.id ?? '')
    .is('borrada_en', null)
    .maybeSingle()
  const lugar = r && lugaresGrupo.value.find(l => l.id === r.lugar_id)
  if (e || !r || !lugar) {
    error.value = 'No se encontró la reseña para editar.'
    return
  }
  editando.value = r.id
  elegirExistente(lugar)
  plan.value = r.plan as PlanId | null
  general.value = r.general
  generalManual.value = true
  aspectos.comida = r.comida ?? 0
  aspectos.ambiente = r.ambiente ?? 0
  aspectos.servicio = r.servicio ?? 0
  aspectos.calidad_precio = r.calidad_precio ?? 0
  detallado.value = Object.values(aspectos).some(v => v > 0)
  tagsElegidos.value = r.resena_tags.map(t => t.tag_id)
  nota.value = r.nota ?? ''
  platos.value = r.platos ?? []
  privada.value = r.privada
  privadaAntes.value = r.privada
  comentariosAjenos.value = r.comentarios.some(c => c.autor_id !== r.autor_id)

  const rutas = r.fotos.map(f => f.path)
  if (rutas.length) {
    const { data: firmadas } = await supabase.storage.from('fotos').createSignedUrls(rutas, 3600)
    fotosActuales.value = (firmadas ?? []).filter(f => f.path && f.signedUrl).map(f => ({ path: f.path!, url: f.signedUrl! }))
  }
  paso.value = 3
}

function quitarFotoActual(path: string) {
  fotosActuales.value = fotosActuales.value.filter(f => f.path !== path)
  fotosQuitadas.value.push(path)
}

// --- Paso 1 ---
const coincidenciasGrupo = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (q.length < 2) return []
  return lugaresGrupo.value.filter(l => l.nombre.toLowerCase().includes(q)).slice(0, 4)
})

let temporizador: ReturnType<typeof setTimeout> | undefined
let abortar: AbortController | undefined
watch(busqueda, (q) => {
  clearTimeout(temporizador)
  abortar?.abort()
  if (q.trim().length < 3) {
    resultados.value = []
    buscando.value = false
    return
  }
  buscando.value = true
  temporizador = setTimeout(async () => {
    abortar = new AbortController()
    try {
      resultados.value = await buscarLugares(q.trim(), posicion.value ?? LIMA, abortar.signal)
    }
    catch (e) {
      if ((e as Error).name === 'AbortError') return
      resultados.value = []
    }
    buscando.value = false
  }, 350)
})

function cerrarBusqueda() {
  clearTimeout(temporizador)
  abortar?.abort()
  busqueda.value = ''
  resultados.value = []
}

function elegirExistente(l: LugarResumen) {
  existente.value = l
  nombre.value = l.nombre
  direccion.value = l.direccion ?? ''
  posicion.value = { lat: l.lat, lng: l.lng }
  categoriaId.value = l.categoria_id
  precio.value = l.precio
  cerrarBusqueda()
}

function elegirResultado(r: ResultadoBusqueda) {
  // Si alguien del grupo ya registró ese local, se reutiliza.
  const ya = lugaresGrupo.value.find(l => l.proveedor === r.proveedor && l.ref_externa === r.ref_externa)
  if (ya) return elegirExistente(ya)
  existente.value = null
  nombre.value = r.nombre
  direccion.value = r.direccion
  posicion.value = { lat: r.lat, lng: r.lng }
  origen.value = { proveedor: r.proveedor, ref_externa: r.ref_externa }
  cerrarBusqueda()
}

function soltarExistente() {
  existente.value = null
  nombre.value = ''
  direccion.value = ''
  origen.value = null
  categoriaId.value = null
  precio.value = null
}

// --- Paso 2 ---
// Los tags de noche aparecen si el lugar es de noche, o en modo noche si sirve para ambos.
const tagsOfrecidos = computed(() => {
  const ambito = categoria(categoriaId.value)?.ambito
  const deNoche = ambito === 'noche' || (ambito === 'ambos' && esNoche.value)
  return tags.value.filter(t => t.ambito === 'ambos' || deNoche || tagsElegidos.value.includes(t.id))
})

// --- Paso 3 ---
watch(aspectos, () => {
  if (generalManual.value) return
  const puestos = Object.values(aspectos).filter(v => v > 0)
  if (puestos.length) general.value = Math.round(puestos.reduce((a, b) => a + b, 0) / puestos.length)
})

function fijarGeneral(v: number) {
  general.value = v
  generalManual.value = true
}

function alternarTag(id: string) {
  const i = tagsElegidos.value.indexOf(id)
  if (i >= 0) tagsElegidos.value.splice(i, 1)
  else tagsElegidos.value.push(id)
}

// --- Paso 4 ---
function agregarFotos(e: Event) {
  const input = e.target as HTMLInputElement
  const libres = MAX_FOTOS - fotos.value.length - fotosActuales.value.length
  for (const archivo of Array.from(input.files ?? []).slice(0, libres)) {
    fotos.value.push({ archivo, vista: URL.createObjectURL(archivo) })
  }
  input.value = ''
}

// Lo que ya estaba escrito cuando empezó el dictado; lo dictado se pone a continuación.
let notaAntesDeDictar = ''

function iniciarDictado() {
  notaAntesDeDictar = nota.value.trim()
}

function ponerDictado(texto: string) {
  nota.value = [notaAntesDeDictar, texto].filter(Boolean).join(' ').slice(0, 1000)
}

function quitarFoto(i: number) {
  URL.revokeObjectURL(fotos.value[i]!.vista)
  fotos.value.splice(i, 1)
}

// --- Navegación ---
const puedeSeguir = computed(() => {
  if (paso.value === 1) return !!posicion.value && nombre.value.trim().length > 1
  if (paso.value === 2) return !!categoriaId.value
  if (paso.value === 3) return general.value > 0
  return true
})

function siguiente() {
  if (!puedeSeguir.value) return
  // Un lugar que ya existe conserva su categoría y precio.
  paso.value = paso.value === 1 && existente.value ? 3 : paso.value + 1
}

function atras() {
  if (editando.value && paso.value === 3) return navigateTo(`/lugar/${existente.value?.id}`)
  if (paso.value === 1) return navigateTo('/')
  paso.value = paso.value === 3 && existente.value ? 1 : paso.value - 1
}

// Fecha del teléfono, no la del servidor (que va en UTC).
function hoyLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const titulos = ['¿Dónde fue?', '¿Qué tipo de lugar es?', '¿Qué tal estuvo?', 'Cuéntale a la mancha']

// Devuelve el id del lugar elegido; si es nuevo, lo crea.
async function asegurarLugar() {
  if (existente.value?.id) return existente.value.id
  const { data, error: e } = await supabase
    .from('lugares')
    .insert({
      grupo_id: perfil.value!.grupo_id,
      nombre: nombre.value.trim(),
      direccion: direccion.value.trim() || null,
      lat: posicion.value!.lat,
      lng: posicion.value!.lng,
      categoria_id: categoriaId.value!,
      precio: precio.value,
      proveedor: origen.value?.proveedor ?? null,
      ref_externa: origen.value?.ref_externa ?? null,
      creado_por: perfil.value!.id,
    })
    .select('id')
    .single()
  if (e) {
    // Otra persona del grupo ya registró este local, pero en privado: se reutiliza.
    if (e.code === '23505' && origen.value) {
      const { data: previo } = await supabase.rpc('lugar_por_referencia', {
        p_proveedor: origen.value.proveedor,
        p_ref: origen.value.ref_externa,
      })
      if (previo) {
        existente.value = { id: previo } as LugarResumen
        return previo as string
      }
    }
    throw e
  }
  // Si el guardado falla más adelante, el reintento no duplica el lugar.
  existente.value = { id: data.id } as LugarResumen
  return data.id
}

// Guarda el lugar en "Quiero ir" sin reseñarlo.
async function guardarParaDespues(privado = false) {
  if (!perfil.value || guardando.value || !categoriaId.value) return
  guardando.value = true
  error.value = ''
  try {
    const lugarId = await asegurarLugar()
    const { error: e } = await supabase
      .from('pendientes')
      .upsert({ usuario_id: perfil.value.id, lugar_id: lugarId, privado }, { onConflict: 'usuario_id,lugar_id', ignoreDuplicates: true })
    if (e) throw e
    await navigateTo({ path: '/', query: { lugar: lugarId } })
  }
  catch {
    error.value = 'No se pudo guardar el lugar. Intenta de nuevo.'
    guardando.value = false
  }
}

// Sube fotos nuevas de una reseña; devuelve cuántas fallaron (no bloquean el guardado).
async function subirFotos(resenaId: string) {
  let fallidas = 0
  for (const f of fotos.value) {
    try {
      const blob = await comprimirImagen(f.archivo)
      const path = `${perfil.value!.grupo_id}/${resenaId}/${crypto.randomUUID()}.jpg`
      const { error: eSubida } = await supabase.storage.from('fotos').upload(path, blob, { contentType: 'image/jpeg' })
      if (eSubida) throw eSubida
      const { error: eFila } = await supabase.from('fotos').insert({ resena_id: resenaId, path })
      if (eFila) throw eFila
    }
    catch {
      fallidas++
    }
  }
  return fallidas
}

async function actualizar(resenaId: string) {
  const conAspectos = detallado.value
  const { error: e } = await supabase
    .from('resenas')
    .update({
      general: general.value,
      comida: conAspectos && aspectos.comida ? aspectos.comida : null,
      ambiente: conAspectos && aspectos.ambiente ? aspectos.ambiente : null,
      servicio: conAspectos && aspectos.servicio ? aspectos.servicio : null,
      calidad_precio: conAspectos && aspectos.calidad_precio ? aspectos.calidad_precio : null,
      plan: plan.value,
      nota: nota.value.trim() || null,
      platos: platos.value,
      privada: privada.value,
    })
    .eq('id', resenaId)
  if (e) throw e

  // Tags: se reemplazan por los elegidos.
  const { error: eBorrar } = await supabase.from('resena_tags').delete().eq('resena_id', resenaId)
  if (eBorrar) throw eBorrar
  if (tagsElegidos.value.length) {
    const { error: eTags } = await supabase
      .from('resena_tags')
      .insert(tagsElegidos.value.map(tag_id => ({ resena_id: resenaId, tag_id })))
    if (eTags) throw eTags
  }

  if (fotosQuitadas.value.length) {
    await supabase.from('fotos').delete().in('path', fotosQuitadas.value)
    await supabase.storage.from('fotos').remove(fotosQuitadas.value)
  }
  const fallidas = await subirFotos(resenaId)
  await navigateTo({ path: `/lugar/${existente.value!.id}`, query: fallidas ? { fotosFallidas: String(fallidas) } : {} })
}

async function guardar() {
  if (!perfil.value || guardando.value) return
  if (editando.value) {
    guardando.value = true
    error.value = ''
    try {
      await actualizar(editando.value)
    }
    catch (e) {
      error.value = (e as { message?: string }).message?.includes('resena_con_comentarios')
        ? 'Ya hay comentarios de otros: esta reseña no puede volverse privada.'
        : 'No se pudieron guardar los cambios. Intenta de nuevo.'
      guardando.value = false
    }
    return
  }
  guardando.value = true
  error.value = ''
  try {
    const lugarId = await asegurarLugar()

    const conAspectos = detallado.value
    const { data: resena, error: e2 } = await supabase
      .from('resenas')
      .insert({
        lugar_id: lugarId,
        grupo_id: perfil.value.grupo_id,
        autor_id: perfil.value.id,
        general: general.value,
        comida: conAspectos && aspectos.comida ? aspectos.comida : null,
        ambiente: conAspectos && aspectos.ambiente ? aspectos.ambiente : null,
        servicio: conAspectos && aspectos.servicio ? aspectos.servicio : null,
        calidad_precio: conAspectos && aspectos.calidad_precio ? aspectos.calidad_precio : null,
        plan: plan.value,
        nota: nota.value.trim() || null,
        platos: platos.value,
        privada: privada.value,
        visitado_en: hoyLocal(),
      })
      .select('id')
      .single()
    if (e2) throw e2

    if (tagsElegidos.value.length) {
      const { error: e3 } = await supabase
        .from('resena_tags')
        .insert(tagsElegidos.value.map(tag_id => ({ resena_id: resena.id, tag_id })))
      if (e3) throw e3
    }

    // Las fotos no bloquean la reseña: si alguna falla, se avisa en el mapa.
    const fallidas = await subirFotos(resena.id)

    // De vuelta al mapa, acercado al lugar recién reseñado.
    await navigateTo({ path: '/', query: { lugar: lugarId, ...(fallidas ? { fotosFallidas: String(fallidas) } : {}) } })
  }
  catch {
    error.value = 'No se pudo guardar la reseña. Intenta de nuevo.'
    guardando.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex h-full max-w-md flex-col bg-escena">
    <header class="px-5 pt-[max(1rem,env(safe-area-inset-top))]">
      <div class="flex items-center gap-3">
        <button class="text-sm font-bold" @click="atras">← {{ paso === 1 ? 'Cancelar' : 'Atrás' }}</button>
        <div class="flex flex-1 gap-1.5" role="progressbar" :aria-valuenow="paso" aria-valuemin="1" aria-valuemax="4">
          <div
            v-for="n in 4"
            :key="n"
            class="h-2 flex-1 rounded-full border-2 border-tinta"
            :class="n <= paso ? 'bg-tinta' : 'bg-papel'"
          />
        </div>
      </div>
      <p v-if="paso > 1" class="mt-4 truncate text-sm font-bold">
        {{ categoria(categoriaId)?.emoji }} {{ nombre }}
      </p>
      <h1 class="font-display text-3xl leading-tight font-extrabold" :class="paso === 1 ? 'mt-4' : 'mt-0.5'">
        {{ editando && paso === 3 ? 'Edita tu reseña' : titulos[paso - 1] }}
      </h1>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-4">
      <!-- Paso 1: lugar -->
      <section v-if="paso === 1" class="flex h-full flex-col gap-3">
        <div v-if="existente" class="sticker flex items-center gap-3 p-3">
          <span class="text-2xl">{{ categoria(existente.categoria_id)?.emoji }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-bold">{{ existente.nombre }}</p>
            <p class="text-sm">Ya está en el mapa de la mancha</p>
          </div>
          <button class="text-sm font-bold underline" @click="soltarExistente">Cambiar</button>
        </div>

        <template v-else>
          <div class="relative">
            <input
              v-model="busqueda"
              type="search"
              placeholder="Busca el local: Isolina, La Mar…"
              aria-label="Buscar local"
              class="sticker w-full px-4 py-3 font-semibold outline-none placeholder:font-normal placeholder:text-tinta/50"
            >
            <ul
              v-if="coincidenciasGrupo.length || resultados.length || buscando"
              class="sticker absolute inset-x-0 top-full z-10 mt-2 max-h-64 overflow-y-auto py-1"
            >
              <li v-for="l in coincidenciasGrupo" :key="l.id">
                <button class="flex w-full items-center gap-2 px-4 py-2 text-left" @click="elegirExistente(l)">
                  <span>{{ categoria(l.categoria_id)?.emoji }}</span>
                  <span class="min-w-0 flex-1 truncate font-bold">{{ l.nombre }}</span>
                  <span class="shrink-0 rounded-full bg-limon px-2 text-xs font-bold">De la mancha</span>
                </button>
              </li>
              <li v-for="r in resultados" :key="r.ref_externa">
                <button class="block w-full px-4 py-2 text-left" @click="elegirResultado(r)">
                  <span class="block truncate font-bold">{{ r.nombre }}</span>
                  <span class="block truncate text-sm">{{ r.direccion }}</span>
                </button>
              </li>
              <li v-if="buscando" class="px-4 py-2 text-sm">Buscando…</li>
            </ul>
          </div>

          <input
            v-model="nombre"
            type="text"
            placeholder="Nombre del lugar"
            aria-label="Nombre del lugar"
            maxlength="80"
            class="sticker w-full px-4 py-3 font-display text-lg font-bold outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-tinta/50"
          >
        </template>

        <MapaPicker :key="existente?.id ?? 'nuevo'" v-model="posicion" :bloqueado="!!existente" class="min-h-56 flex-1" />
        <p v-if="!existente" class="text-center text-sm font-semibold">
          {{ posicion ? 'Ajusta el mapa si el pin no quedó sobre el lugar.' : 'Busca el local o mueve el mapa para fijar la ubicación.' }}
        </p>
      </section>

      <!-- Paso 2: categoría y precio -->
      <section v-else-if="paso === 2">
        <SelectorCategoria v-model="categoriaId" />

        <h2 class="mt-6 font-display text-xl font-bold">¿Cuánto se gasta?</h2>
        <p class="text-sm">Opcional</p>
        <div class="mt-2 grid grid-cols-4 gap-2">
          <button
            v-for="p in PRECIOS"
            :key="p.valor"
            class="rounded-2xl border-2 border-tinta px-1 py-2 text-center"
            :class="precio === p.valor ? 'bg-tinta text-papel' : 'bg-papel'"
            :aria-pressed="precio === p.valor"
            @click="precio = precio === p.valor ? null : p.valor"
          >
            <span class="block text-sm font-bold">{{ p.etiqueta }}</span>
            <span class="block text-xs">{{ p.detalle }}</span>
          </button>
        </div>
      </section>

      <!-- Paso 3: calificación -->
      <section v-else-if="paso === 3">
        <p class="text-sm font-bold">¿Con quién fuiste?</p>
        <div class="mt-1.5 flex flex-wrap gap-2">
          <button
            v-for="p in PLANES"
            :key="p.id"
            class="rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold"
            :class="plan === p.id ? 'bg-tinta text-papel' : 'bg-papel'"
            :aria-pressed="plan === p.id"
            @click="plan = plan === p.id ? null : p.id"
          >
            {{ p.emoji }} {{ p.nombre }}
          </button>
        </div>

        <div v-if="detallado" class="sticker mt-4 space-y-3 p-4">
          <div v-for="a in ASPECTOS" :key="a.id" class="flex items-center justify-between gap-3">
            <span class="text-sm font-bold">{{ a.nombre }}</span>
            <Puntaje v-model="aspectos[a.id]" :plan="plan" size="md" class="w-44" />
          </div>
        </div>

        <div class="sticker mt-4 px-4 py-5">
          <p v-if="detallado" class="mb-3 text-sm font-bold">
            Nota general<template v-if="!generalManual && general"> (promedio, puedes cambiarla)</template>
          </p>
          <Puntaje :model-value="general" :plan="plan" size="lg" @update:model-value="fijarGeneral" />
          <p class="mt-3 h-7 text-center font-display text-xl font-bold">{{ general ? NOTAS[general - 1] : 'Toca para calificar' }}</p>
        </div>

        <button class="mt-3 text-sm font-bold underline" @click="detallado = !detallado">
          {{ detallado ? 'Volver a la calificación rápida' : 'Profundizar por aspecto' }}
        </button>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="t in tagsOfrecidos"
            :key="t.id"
            class="rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold"
            :class="tagsElegidos.includes(t.id) ? 'bg-tinta text-papel' : 'bg-papel'"
            :aria-pressed="tagsElegidos.includes(t.id)"
            @click="alternarTag(t.id)"
          >
            {{ t.nombre }}
          </button>
        </div>
      </section>

      <!-- Paso 4: fotos y nota -->
      <section v-else>
        <h2 class="font-display text-lg font-bold">¿Qué pediste?</h2>
        <PlatosInput v-model="platos" :categoria-id="categoriaId" class="mt-1.5 mb-5" />

        <div class="grid grid-cols-4 gap-2">
          <div v-for="(f, i) in fotosActuales" :key="f.path" class="relative aspect-square">
            <img :src="f.url" alt="" class="size-full rounded-xl border-2 border-tinta object-cover">
            <button
              class="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-tinta bg-papel text-sm leading-none font-bold"
              :aria-label="`Quitar foto guardada ${i + 1}`"
              @click="quitarFotoActual(f.path)"
            >×</button>
          </div>
          <div v-for="(f, i) in fotos" :key="f.vista" class="relative aspect-square">
            <img :src="f.vista" alt="" class="size-full rounded-xl border-2 border-tinta object-cover">
            <button
              class="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border-2 border-tinta bg-papel text-sm leading-none font-bold"
              :aria-label="`Quitar foto ${i + 1}`"
              @click="quitarFoto(i)"
            >×</button>
          </div>
          <label
            v-if="fotos.length + fotosActuales.length < MAX_FOTOS"
            class="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-tinta bg-papel/60 text-center text-xs font-bold"
          >
            <span><span class="block text-2xl leading-none">📷</span>Agregar</span>
            <input type="file" accept="image/*" multiple class="sr-only" @change="agregarFotos">
          </label>
        </div>
        <p class="mt-2 text-sm">Hasta {{ MAX_FOTOS }} fotos. Se achican antes de subir.</p>

        <label class="sticker mt-4 flex cursor-pointer items-center gap-3 p-3">
          <input v-model="privada" type="checkbox" class="size-5 accent-chicha" :disabled="comentariosAjenos && !privadaAntes">
          <span class="leading-tight">
            <span class="block font-bold">🔒 Solo para mí</span>
            <span v-if="comentariosAjenos && !privadaAntes" class="block text-sm">
              Ya hay comentarios de la mancha: no puede volverse privada.
            </span>
            <span v-else class="block text-sm">Nadie más de la mancha verá esta reseña.</span>
          </span>
        </label>

        <textarea
          v-model="nota"
          rows="5"
          maxlength="1000"
          placeholder="Pide el arroz con mariscos, llega antes de la 1…"
          aria-label="Nota para la mancha"
          class="sticker mt-4 w-full resize-none p-4 outline-none placeholder:text-tinta/50"
        />
        <Dictado class="mt-3" @inicio="iniciarDictado" @texto="ponerDictado" />
      </section>
    </div>

    <footer class="px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <p v-if="error" class="mb-2 text-center text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
      <button
        v-if="paso < 4"
        class="btn w-full bg-tinta text-lg text-papel shadow-[3px_3px_0_var(--color-papel)]"
        :disabled="!puedeSeguir"
        @click="siguiente"
      >
        Siguiente
      </button>
      <button
        v-if="paso === 2"
        class="mt-3 w-full text-center text-sm font-bold underline disabled:opacity-50"
        :disabled="!puedeSeguir || guardando"
        @click="guardarParaDespues(false)"
      >
        🔖 Aún no voy: guardar en "Quiero ir"
      </button>
      <button
        v-if="paso === 2"
        class="mt-2 w-full text-center text-sm font-bold underline disabled:opacity-50"
        :disabled="!puedeSeguir || guardando"
        @click="guardarParaDespues(true)"
      >
        🔒 Guardarlo solo para mí
      </button>
      <button v-if="paso === 4" class="btn w-full bg-tinta text-lg text-papel shadow-[3px_3px_0_var(--color-papel)]" :disabled="guardando" @click="guardar">
        {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar reseña' }}
      </button>
    </footer>
  </main>
</template>
