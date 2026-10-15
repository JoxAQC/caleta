<script setup lang="ts">
import type { Comentario, Reaccion } from '~/utils/tipos'
import { fechaHora } from '~/utils/catalogo'

const EMOJIS = ['🔥', '😋', '👀', '😂']

// soloComentarios: la reseña fue borrada; quedan sus comentarios, sin reacciones ni comentarios nuevos.
const props = defineProps<{ resenaId: string, reacciones: Reaccion[], comentarios: Comentario[], soloComentarios?: boolean }>()

const supabase = useSupabaseClient()
const { perfil } = usePerfil()

// Copias locales: la ficha no se recarga al reaccionar o comentar.
const reacciones = ref([...props.reacciones])
const comentarios = ref([...props.comentarios].sort((a, b) => a.creado_en.localeCompare(b.creado_en)))
const texto = ref('')
const abierto = ref(props.comentarios.length > 0)
const enviando = ref(false)
const error = ref('')

const cuenta = (e: string) => reacciones.value.filter(r => r.emoji === e).length
const mia = (e: string) => reacciones.value.some(r => r.emoji === e && r.usuario_id === perfil.value?.id)

async function reaccionar(emoji: string) {
  const yo = perfil.value?.id
  if (!yo) return
  error.value = ''
  const antes = [...reacciones.value]
  const quitar = mia(emoji)
  // Se pinta de inmediato y se revierte si la base lo rechaza.
  reacciones.value = quitar
    ? antes.filter(r => !(r.emoji === emoji && r.usuario_id === yo))
    : [...antes, { emoji, usuario_id: yo }]

  const consulta = quitar
    ? supabase.from('reacciones').delete().match({ resena_id: props.resenaId, usuario_id: yo, emoji })
    : supabase.from('reacciones').insert({ resena_id: props.resenaId, usuario_id: yo, emoji })
  const { error: e } = await consulta
  if (e) {
    reacciones.value = antes
    error.value = 'No se pudo guardar la reacción.'
  }
}

async function comentar() {
  const yo = perfil.value
  const limpio = texto.value.trim()
  if (!yo || !limpio || enviando.value) return
  enviando.value = true
  error.value = ''
  const { data, error: e } = await supabase
    .from('comentarios')
    .insert({ resena_id: props.resenaId, autor_id: yo.id, texto: limpio })
    .select('id, texto, creado_en, editado_en, autor_id')
    .single()
  enviando.value = false
  if (e) {
    error.value = 'No se pudo enviar el comentario.'
    return
  }
  comentarios.value.push({ ...data, autor: { nombre: yo.nombre } })
  texto.value = ''
}

// Edición en línea de un comentario propio.
const editandoId = ref<string | null>(null)
const textoEdicion = ref('')
const porBorrar = ref<string | null>(null)
// Comentario editado cuya fecha de edición se está mostrando.
const verEdicion = ref<string | null>(null)

function empezarEdicion(c: Comentario) {
  porBorrar.value = null
  editandoId.value = c.id
  textoEdicion.value = c.texto
}

async function guardarEdicion(c: Comentario) {
  const limpio = textoEdicion.value.trim()
  if (!limpio) return
  if (limpio === c.texto) {
    editandoId.value = null
    return
  }
  error.value = ''
  const { data, error: e } = await supabase
    .from('comentarios')
    .update({ texto: limpio })
    .eq('id', c.id)
    .select('texto, editado_en')
    .single()
  if (e) {
    error.value = 'No se pudo guardar el cambio.'
    return
  }
  c.texto = data.texto
  c.editado_en = data.editado_en
  editandoId.value = null
}

async function borrar(id: string) {
  porBorrar.value = null
  const antes = [...comentarios.value]
  comentarios.value = antes.filter(c => c.id !== id)
  const { error: e } = await supabase.from('comentarios').delete().eq('id', id)
  if (e) {
    comentarios.value = antes
    error.value = 'No se pudo borrar el comentario.'
  }
}
</script>

<template>
  <div class="mt-3 border-t-2 border-dashed border-tinta/30 pt-3">
    <div v-if="!soloComentarios" class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="e in EMOJIS"
        :key="e"
        class="rounded-full border-2 border-tinta px-2.5 py-0.5 text-sm font-bold"
        :class="mia(e) ? 'bg-limon' : 'bg-papel'"
        :aria-pressed="mia(e)"
        :aria-label="`Reaccionar con ${e}`"
        @click="reaccionar(e)"
      >
        {{ e }}<span v-if="cuenta(e)" class="ml-1">{{ cuenta(e) }}</span>
      </button>
      <button v-if="!abierto" class="ml-auto text-sm font-bold underline" @click="abierto = true">Comentar</button>
    </div>

    <ul v-if="comentarios.length" class="mt-3 space-y-2">
      <li v-for="c in comentarios" :key="c.id" class="rounded-xl bg-garua px-3 py-2 text-sm">
        <form v-if="editandoId === c.id" class="flex gap-2" @submit.prevent="guardarEdicion(c)">
          <input
            v-model="textoEdicion"
            type="text"
            maxlength="500"
            aria-label="Edita tu comentario"
            class="min-w-0 flex-1 rounded-full border-2 border-tinta bg-papel px-3 py-1 text-sm outline-none"
          >
          <button class="rounded-full border-2 border-tinta bg-tinta px-3 text-xs font-bold text-papel" :disabled="!textoEdicion.trim()">
            Guardar
          </button>
          <button type="button" class="text-xs font-bold underline" @click="editandoId = null">Cancelar</button>
        </form>
        <template v-else>
          <span class="font-bold">{{ c.autor?.nombre }}</span>
          <span class="whitespace-pre-line"> {{ c.texto }}</span>
          <button
            v-if="c.editado_en"
            class="ml-1 text-xs italic"
            :aria-expanded="verEdicion === c.id"
            @click="verEdicion = verEdicion === c.id ? null : c.id"
          >(editado)</button>
          <span v-if="verEdicion === c.id && c.editado_en" class="block text-xs">Última edición: {{ fechaHora(c.editado_en) }}</span>
          <span v-if="c.autor_id === perfil?.id" class="mt-1.5 flex items-center gap-2 text-xs font-bold">
            <template v-if="porBorrar === c.id">
              <span>¿Borrar tu comentario?</span>
              <button class="underline" @click="porBorrar = null">No</button>
              <button class="rounded-full border-2 border-tinta bg-rocoto-suave px-2" @click="borrar(c.id)">Sí, borrar</button>
            </template>
            <template v-else>
              <button v-if="!soloComentarios" class="size-7 grid place-items-center rounded-full border-2 border-tinta bg-papel" aria-label="Editar tu comentario" @click="empezarEdicion(c)">
                <Icono nombre="lapiz" :size="14" />
              </button>
              <button class="size-7 grid place-items-center rounded-full border-2 border-tinta bg-papel" :aria-label="`Borrar tu comentario: ${c.texto}`" @click="porBorrar = c.id">
                <Icono nombre="tacho" :size="14" />
              </button>
            </template>
          </span>
        </template>
      </li>
    </ul>

    <form v-if="abierto && !soloComentarios" class="mt-2 flex gap-2" @submit.prevent="comentar">
      <input
        v-model="texto"
        type="text"
        maxlength="500"
        placeholder="Yo pedí el lomo y también cumple"
        aria-label="Escribe un comentario"
        class="min-w-0 flex-1 rounded-full border-2 border-tinta bg-papel px-3 py-1.5 text-sm outline-none placeholder:text-tinta/50"
      >
      <button class="rounded-full border-2 border-tinta bg-tinta px-3 text-sm font-bold text-papel disabled:opacity-50" :disabled="!texto.trim() || enviando">
        Enviar
      </button>
    </form>

    <p v-if="error" class="mt-2 text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
  </div>
</template>
