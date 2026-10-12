<script setup lang="ts">
import type { Comentario, Reaccion } from '~/utils/tipos'

const EMOJIS = ['🔥', '😋', '👀', '😂']

const props = defineProps<{ resenaId: string, reacciones: Reaccion[], comentarios: Comentario[] }>()

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
    .select('id, texto, creado_en, autor_id')
    .single()
  enviando.value = false
  if (e) {
    error.value = 'No se pudo enviar el comentario.'
    return
  }
  comentarios.value.push({ ...data, autor: { nombre: yo.nombre } })
  texto.value = ''
}

async function borrar(id: string) {
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
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="e in EMOJIS"
        :key="e"
        class="rounded-full border-2 border-tinta px-2.5 py-0.5 text-sm font-bold"
        :class="mia(e) ? 'bg-limon' : 'bg-white'"
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
        <span class="font-bold">{{ c.autor?.nombre }}</span>
        <span class="whitespace-pre-line"> {{ c.texto }}</span>
        <button
          v-if="c.autor_id === perfil?.id"
          class="ml-2 text-xs font-bold underline"
          :aria-label="`Borrar tu comentario: ${c.texto}`"
          @click="borrar(c.id)"
        >Borrar</button>
      </li>
    </ul>

    <form v-if="abierto" class="mt-2 flex gap-2" @submit.prevent="comentar">
      <input
        v-model="texto"
        type="text"
        maxlength="500"
        placeholder="Yo pedí el lomo y también cumple"
        aria-label="Escribe un comentario"
        class="min-w-0 flex-1 rounded-full border-2 border-tinta bg-white px-3 py-1.5 text-sm outline-none placeholder:text-tinta/50"
      >
      <button class="rounded-full border-2 border-tinta bg-tinta px-3 text-sm font-bold text-white disabled:opacity-50" :disabled="!texto.trim() || enviando">
        Enviar
      </button>
    </form>

    <p v-if="error" class="mt-2 text-sm font-bold text-rocoto" role="alert">{{ error }}</p>
  </div>
</template>
