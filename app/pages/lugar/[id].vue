<script setup lang="ts">
import type { LugarResumen, Pendiente, Perfil, Resena } from '~/utils/tipos'
import { ASPECTOS, emojiDePlan, etiquetaPrecio, fechaHora, NOTAS, PLANES } from '~/utils/catalogo'

const route = useRoute()
const supabase = useSupabaseClient()
const { categoria, tag, cargar: cargarCatalogo } = useCatalogo()
const { perfil } = usePerfil()

const lugar = ref<LugarResumen | null>(null)
const resenas = ref<Resena[]>([])
const urls = ref<Record<string, string>>({})
const estado = ref<'cargando' | 'listo' | 'error' | 'no-existe'>('cargando')
const pendientes = ref<Pendiente[]>([])
const mancha = ref<Pick<Perfil, 'id' | 'nombre'>[]>([])
const recomendando = ref(false)
const aviso = ref('')

async function cargar() {
  estado.value = 'cargando'
  try {
    await cargarCatalogo()
    const id = route.params.id as string
    const [l, r, p, m] = await Promise.all([
      supabase.from('lugares_resumen').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('resenas')
        .select('*, autor:perfiles!resenas_autor_id_fkey(nombre, avatar_url), resena_tags(tag_id), fotos(path), reacciones(emoji, usuario_id), comentarios(id, texto, creado_en, editado_en, autor_id, autor:perfiles!comentarios_autor_id_fkey(nombre))')
        .eq('lugar_id', id)
        .order('creado_en', { ascending: false }),
      supabase.from('pendientes').select('usuario_id, recomendado_por, privado').eq('lugar_id', id),
      supabase.from('perfiles').select('id, nombre').order('nombre'),
    ])
    if (l.error) throw l.error
    if (r.error) throw r.error
    if (p.error) throw p.error
    if (m.error) throw m.error
    pendientes.value = p.data
    enPrivado.value = p.data.find(x => x.usuario_id === perfil.value?.id)?.privado ?? false
    mancha.value = m.data
    if (!l.data) {
      estado.value = 'no-existe'
      return
    }
    lugar.value = l.data as LugarResumen
    resenas.value = r.data as unknown as Resena[]

    const rutas = resenas.value.flatMap(x => x.fotos.map(f => f.path))
    if (rutas.length) {
      const { data } = await supabase.storage.from('fotos').createSignedUrls(rutas, 3600)
      for (const d of data ?? []) {
        if (d.path && d.signedUrl) urls.value[d.path] = d.signedUrl
      }
    }
    const { data: borrable } = await supabase.rpc('puedo_borrar_lugar', { p_lugar: id })
    puedoBorrarLugar.value = !!borrable
    estado.value = 'listo'
  }
  catch {
    estado.value = 'error'
  }
}
onMounted(cargar)

const cat = computed(() => categoria(lugar.value?.categoria_id))
// visitado_en llega como AAAA-MM-DD; se arma en hora local para no correr el día.
function fecha(dia: string) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(a!, m! - 1, d!).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}
const nombrePlan = (id: string | null) => PLANES.find(p => p.id === id)?.nombre

// --- Borrar mi reseña ---
const porBorrar = ref<string | null>(null)
const borrando = ref(false)

async function borrarResena(r: Resena) {
  if (borrando.value) return
  borrando.value = true
  aviso.value = ''
  // Si otras personas comentaron, la base la deja como "borrada" y conserva esos comentarios.
  const { data: rutas, error } = await supabase.rpc('borrar_resena', { p_resena: r.id })
  borrando.value = false
  porBorrar.value = null
  if (error) {
    aviso.value = 'No se pudo borrar la reseña.'
    return
  }
  if (rutas?.length) await supabase.storage.from('fotos').remove(rutas)
  await cargar()
}

// --- Borrar el lugar: solo quien lo creó y si nadie más aportó ---
const puedoBorrarLugar = ref(false)
const confirmarBorrarLugar = ref(false)

async function borrarLugar() {
  if (!lugar.value || borrando.value) return
  borrando.value = true
  aviso.value = ''
  const { data: rutas, error } = await supabase.rpc('borrar_lugar', { p_lugar: lugar.value.id })
  borrando.value = false
  if (error) {
    confirmarBorrarLugar.value = false
    puedoBorrarLugar.value = false
    aviso.value = 'Otras personas ya aportaron en este lugar: solo puedes borrar lo tuyo.'
    return
  }
  if (rutas?.length) await supabase.storage.from('fotos').remove(rutas)
  await navigateTo('/')
}

// Reseña cuya fecha de edición se está mostrando.
const verEdicion = ref<string | null>(null)

// --- Quiero ir ---
const nombreDe = (id: string | null) => mancha.value.find(x => x.id === id)?.nombre
const miPendiente = computed(() => pendientes.value.find(x => x.usuario_id === perfil.value?.id))
// Casilla "solo para mí": vale para lo que se guarde y para lo ya guardado.
const enPrivado = ref(false)
const otrosQueQuieren = computed(() =>
  pendientes.value.filter(x => x.usuario_id !== perfil.value?.id).map(x => nombreDe(x.usuario_id)).filter(Boolean),
)
// A quién se le puede recomendar: quien no lo tiene pendiente ni lo ha reseñado.
const recomendables = computed(() =>
  mancha.value.filter(x =>
    x.id !== perfil.value?.id
    && !pendientes.value.some(q => q.usuario_id === x.id)
    && !resenas.value.some(r => r.autor_id === x.id),
  ),
)

async function alternarPendiente() {
  const yo = perfil.value?.id
  if (!yo || !lugar.value) return
  aviso.value = ''
  const antes = [...pendientes.value]
  const quitar = !!miPendiente.value
  pendientes.value = quitar
    ? antes.filter(x => x.usuario_id !== yo)
    : [...antes, { usuario_id: yo, recomendado_por: null, privado: enPrivado.value }]
  const { error } = quitar
    ? await supabase.from('pendientes').delete().match({ usuario_id: yo, lugar_id: lugar.value.id })
    : await supabase.from('pendientes').insert({ usuario_id: yo, lugar_id: lugar.value.id, privado: enPrivado.value })
  if (error) {
    pendientes.value = antes
    aviso.value = 'No se pudo actualizar tu lista.'
  }
}

// Cambia la privacidad de un pendiente que ya está guardado.
async function cambiarPrivacidad() {
  const mio = miPendiente.value
  const yo = perfil.value?.id
  if (!mio || !yo || !lugar.value) return
  aviso.value = ''
  const nuevo = enPrivado.value
  const { error } = await supabase
    .from('pendientes')
    .update({ privado: nuevo })
    .match({ usuario_id: yo, lugar_id: lugar.value.id })
  if (error) {
    enPrivado.value = !nuevo
    aviso.value = 'No se pudo cambiar la privacidad.'
    return
  }
  mio.privado = nuevo
}

async function recomendar(amigoId: string) {
  const yo = perfil.value?.id
  if (!yo || !lugar.value) return
  aviso.value = ''
  const { error } = await supabase
    .from('pendientes')
    .insert({ usuario_id: amigoId, lugar_id: lugar.value.id, recomendado_por: yo })
  if (error) {
    aviso.value = 'No se pudo enviar la recomendación.'
    return
  }
  pendientes.value.push({ usuario_id: amigoId, recomendado_por: yo, privado: false })
  aviso.value = `Listo: ${nombreDe(amigoId)} lo verá en su lista "Quiero ir".`
}
</script>

<template>
  <main class="mx-auto min-h-full max-w-md px-5 pt-6 pb-28">
    <NuxtLink to="/" class="text-sm font-bold">← Volver al mapa</NuxtLink>

    <div v-if="estado === 'cargando'" class="mt-10 text-center">
      <Capi :size="96" animo="dormido" class="mx-auto animate-pulse" />
      <p class="mt-2 font-display text-xl font-bold">Cargando…</p>
    </div>

    <div v-else-if="estado === 'error'" class="mt-10 text-center">
      <Capi :size="96" animo="triste" class="mx-auto" />
      <p class="mt-2 font-display text-xl font-bold">No se pudo cargar el lugar</p>
      <button class="btn mt-4 bg-limon" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="estado === 'no-existe'" class="mt-10 text-center">
      <Capi :size="96" animo="triste" class="mx-auto" />
      <p class="mt-2 font-display text-xl font-bold">Este lugar no existe o no es de tu grupo</p>
    </div>

    <template v-else-if="lugar">
      <p v-if="route.query.fotosFallidas" class="sticker mt-4 bg-papel px-3 py-2 text-sm font-semibold" role="alert">
        La reseña se guardó, pero {{ route.query.fotosFallidas }} foto(s) no se pudieron subir.
      </p>
      <header class="sticker mt-4 p-4" :style="{ background: cat?.color }">
        <div class="flex items-start gap-2">
          <p class="flex-1 text-sm font-bold">
            {{ cat?.emoji }} {{ cat?.nombre }}
            <template v-if="lugar.precio"> · {{ etiquetaPrecio(lugar.precio) }}</template>
          </p>
          <NuxtLink :to="`/corregir/${lugar.id}`" class="size-9 shrink-0 grid place-items-center rounded-full border-2 border-tinta bg-papel" aria-label="Corregir datos del lugar">
            <Icono nombre="lapiz" />
          </NuxtLink>
          <button
            v-if="puedoBorrarLugar"
            class="size-9 shrink-0 grid place-items-center rounded-full border-2 border-tinta bg-papel"
            aria-label="Borrar lugar"
            :aria-expanded="confirmarBorrarLugar"
            @click="confirmarBorrarLugar = !confirmarBorrarLugar"
          >
            <Icono nombre="tacho" />
          </button>
        </div>
        <h1 class="mt-1 font-display text-3xl leading-none font-extrabold">{{ lugar.nombre }}</h1>
        <p v-if="lugar.direccion" class="mt-1 text-sm">{{ lugar.direccion }}</p>
        <div v-if="confirmarBorrarLugar" class="mt-3 flex flex-wrap items-center gap-2 rounded-xl border-2 border-tinta bg-papel p-2 text-sm font-bold">
          <span class="flex-1">¿Borrar el lugar con todo lo tuyo?</span>
          <button class="underline" @click="confirmarBorrarLugar = false">No</button>
          <button class="rounded-full border-2 border-tinta bg-rocoto-suave px-3 py-0.5" :disabled="borrando" @click="borrarLugar">
            {{ borrando ? 'Borrando…' : 'Sí, borrar' }}
          </button>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <span v-if="lugar.promedio" class="rounded-full border-2 border-tinta bg-papel px-3 py-0.5 font-display text-xl font-bold">
            {{ lugar.promedio.toFixed(1) }}
          </span>
          <span class="text-sm font-semibold">
            {{ lugar.total_resenas }} {{ lugar.total_resenas === 1 ? 'reseña' : 'reseñas' }}
          </span>
          <a
            class="ml-auto text-sm font-bold underline"
            :href="`https://www.google.com/maps/search/?api=1&query=${lugar.lat},${lugar.lng}`"
            target="_blank"
            rel="noopener"
          >Cómo llegar</a>
        </div>
      </header>

      <section class="mt-4">
        <div class="flex gap-2">
          <button
            class="btn flex-1 px-3 py-2 text-sm"
            :class="miPendiente ? 'bg-aji' : 'bg-papel'"
            :aria-pressed="!!miPendiente"
            @click="alternarPendiente"
          >
            🔖 {{ miPendiente ? 'En tu lista' : 'Quiero ir' }}
          </button>
          <button
            v-if="recomendables.length"
            class="btn flex-1 bg-papel px-3 py-2 text-sm"
            :aria-expanded="recomendando"
            @click="recomendando = !recomendando"
          >
            📣 Recomendar
          </button>
        </div>
        <div v-if="recomendando && recomendables.length" class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-sm font-bold">¿A quién?</span>
          <button
            v-for="a in recomendables"
            :key="a.id"
            class="rounded-full border-2 border-tinta bg-papel px-3 py-1 text-sm font-semibold"
            @click="recomendar(a.id)"
          >
            {{ a.nombre }}
          </button>
        </div>
        <!-- Una recomendación la ven las dos personas: no puede ser privada. -->
        <label v-if="!miPendiente?.recomendado_por" class="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input v-model="enPrivado" type="checkbox" class="size-4 accent-chicha" @change="cambiarPrivacidad">
          🔒 {{ miPendiente ? 'Solo yo veo que lo tengo guardado' : 'Guardarlo solo para mí' }}
        </label>
        <p v-if="miPendiente?.recomendado_por" class="mt-2 text-sm font-semibold">
          Te lo recomendó {{ nombreDe(miPendiente.recomendado_por) }}.
        </p>
        <p v-if="otrosQueQuieren.length" class="mt-2 text-sm">
          También {{ otrosQueQuieren.length === 1 ? 'quiere' : 'quieren' }} ir: {{ otrosQueQuieren.join(', ') }}.
        </p>
        <p v-if="aviso" class="mt-2 text-sm font-semibold" role="status">{{ aviso }}</p>
      </section>

      <div v-if="!resenas.length" class="mt-8 text-center">
        <Capi :size="80" class="mx-auto" />
        <p class="mt-2 font-semibold">Nadie lo ha reseñado todavía. Estrénalo.</p>
      </div>

      <article v-for="r in resenas" :key="r.id" class="sticker mt-4 p-4">
        <div class="flex items-center gap-2">
          <span class="grid size-8 place-items-center rounded-full border-2 border-tinta bg-aji text-sm font-bold">
            {{ r.autor?.nombre.charAt(0).toUpperCase() }}
          </span>
          <div class="min-w-0 flex-1 leading-tight">
            <p class="font-bold">{{ r.autor?.nombre }}</p>
            <p v-if="r.borrada_en" class="text-xs">Borró su reseña</p>
            <p v-else class="text-xs">
              {{ fecha(r.visitado_en) }}<template v-if="r.plan"> · {{ nombrePlan(r.plan) }}</template>
              <button
                v-if="r.editado_en"
                class="italic"
                :aria-expanded="verEdicion === r.id"
                @click="verEdicion = verEdicion === r.id ? null : r.id"
              >(editado)</button>
            </p>
            <p v-if="verEdicion === r.id && r.editado_en" class="text-xs">Última edición: {{ fechaHora(r.editado_en) }}</p>
          </div>
          <template v-if="r.autor_id === perfil?.id && !r.borrada_en">
            <span v-if="porBorrar === r.id" class="flex items-center gap-2 text-xs font-bold">
              <button class="underline" @click="porBorrar = null">Cancelar</button>
              <button class="rounded-full border-2 border-tinta bg-rocoto-suave px-2 py-0.5" :disabled="borrando" @click="borrarResena(r)">
                {{ borrando ? 'Borrando…' : 'Sí, borrar' }}
              </button>
            </span>
            <span v-else class="flex gap-2">
              <NuxtLink :to="`/nueva?editar=${r.id}`" class="size-8 grid place-items-center rounded-full border-2 border-tinta bg-papel" aria-label="Editar tu reseña">
                <Icono nombre="lapiz" :size="16" />
              </NuxtLink>
              <button class="size-8 grid place-items-center rounded-full border-2 border-tinta bg-papel" aria-label="Borrar tu reseña" @click="porBorrar = r.id">
                <Icono nombre="tacho" :size="16" />
              </button>
            </span>
          </template>
        </div>

        <p v-if="r.borrada_en" class="mt-3 text-sm italic">
          {{ r.autor?.nombre }} borró su reseña. Se conservan los comentarios de la mancha.
        </p>

        <template v-else>
        <div class="mt-3 flex items-center gap-2">
          <Puntaje :model-value="r.general" :plan="r.plan" solo-lectura />
          <span v-if="r.privada" class="ml-auto rounded-full border-2 border-tinta bg-chicha px-2 py-0.5 text-xs font-bold">🔒 Solo tú</span>
          <span class="font-display font-bold">{{ NOTAS[r.general - 1] }}</span>
        </div>

        <dl v-if="ASPECTOS.some(a => r[a.id])" class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <template v-for="a in ASPECTOS" :key="a.id">
            <div v-if="r[a.id]" class="flex justify-between">
              <dt>{{ a.nombre }}</dt>
              <dd class="font-bold">{{ r[a.id] }}/5</dd>
            </div>
          </template>
        </dl>

        <div v-if="r.resena_tags.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="t in r.resena_tags"
            :key="t.tag_id"
            class="rounded-full border-2 border-tinta bg-garua px-2.5 py-0.5 text-xs font-semibold"
          >{{ tag(t.tag_id)?.nombre }}</span>
        </div>

        <p v-if="r.nota" class="mt-3 whitespace-pre-line">{{ r.nota }}</p>

        <div v-if="r.fotos.length" class="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          <a v-for="f in r.fotos" :key="f.path" :href="urls[f.path]" target="_blank" rel="noopener" class="shrink-0">
            <img
              :src="urls[f.path]"
              :alt="`Foto de ${lugar.nombre} por ${r.autor?.nombre}`"
              loading="lazy"
              class="size-28 rounded-xl border-2 border-tinta object-cover"
            >
          </a>
        </div>

        </template>

        <ResenaSocial :resena-id="r.id" :reacciones="r.reacciones" :comentarios="r.comentarios" :solo-comentarios="!!r.borrada_en" />
      </article>

      <div class="fixed inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <NuxtLink :to="`/nueva?lugar=${lugar.id}`" class="btn bg-limon px-6 text-lg shadow-sticker-lg">
          <span class="text-2xl leading-none">{{ emojiDePlan() }}</span> Reseñar este lugar
        </NuxtLink>
      </div>
    </template>
  </main>
</template>
