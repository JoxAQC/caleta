<script setup lang="ts">
import { MAX_PLATOS, platosSugeridos, TODOS_LOS_PLATOS } from '~/utils/catalogo'

// "¿Qué pediste?": platos como chips. Sugiere los típicos de la categoría
// y deja escribir cualquier otro.
const platos = defineModel<string[]>({ required: true })
const props = defineProps<{ categoriaId?: string | null }>()

const texto = ref('')

const normalizar = (p: string) => p.trim().toLowerCase()
const yaEsta = (p: string) => platos.value.some(x => normalizar(x) === normalizar(p))
const lleno = computed(() => platos.value.length >= MAX_PLATOS)

const sugeridos = computed(() => platosSugeridos(props.categoriaId).filter(p => !yaEsta(p)))

// Al escribir: platos conocidos que coinciden con lo tecleado.
const coincidencias = computed(() => {
  const q = normalizar(texto.value)
  if (q.length < 2) return []
  return TODOS_LOS_PLATOS.filter(p => normalizar(p).includes(q) && !yaEsta(p)).slice(0, 5)
})

function agregar(p: string) {
  const limpio = p.trim().replace(/\s+/g, ' ').slice(0, 40)
  if (!limpio || yaEsta(limpio) || lleno.value) return
  platos.value = [...platos.value, limpio]
  texto.value = ''
}

function quitar(p: string) {
  platos.value = platos.value.filter(x => x !== p)
}
</script>

<template>
  <div>
    <div v-if="platos.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="p in platos"
        :key="p"
        class="inline-flex items-center gap-1 rounded-full border-2 border-tinta bg-tinta py-0.5 pr-1 pl-3 text-sm font-semibold text-papel"
      >
        {{ p }}
        <button
          type="button"
          class="grid size-5 place-items-center rounded-full text-base leading-none"
          :aria-label="`Quitar ${p}`"
          @click="quitar(p)"
        >×</button>
      </span>
    </div>

    <form v-if="!lleno" class="relative mt-2" @submit.prevent="agregar(texto)">
      <input
        v-model="texto"
        type="text"
        maxlength="40"
        placeholder="Escribe un plato y presiona Enter"
        aria-label="Agregar un plato"
        class="sticker w-full px-4 py-2.5 text-sm outline-none placeholder:text-tinta/50"
      >
      <ul v-if="coincidencias.length" class="sticker absolute inset-x-0 top-full z-10 mt-1 py-1 text-sm">
        <li v-for="p in coincidencias" :key="p">
          <button type="button" class="block w-full px-4 py-1.5 text-left font-semibold" @click="agregar(p)">{{ p }}</button>
        </li>
      </ul>
    </form>

    <div v-if="!lleno && sugeridos.length" class="mt-2 flex flex-wrap gap-1.5">
      <button
        v-for="p in sugeridos"
        :key="p"
        type="button"
        class="rounded-full border-2 border-dashed border-tinta bg-papel px-3 py-0.5 text-sm font-semibold"
        @click="agregar(p)"
      >
        + {{ p }}
      </button>
    </div>
  </div>
</template>
