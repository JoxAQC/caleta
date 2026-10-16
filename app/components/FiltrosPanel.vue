<script setup lang="ts">
import { emojiDePlan, NOTAS, PLANES, PRECIOS } from '~/utils/catalogo'

defineProps<{ resultados: number }>()
const emit = defineEmits<{ cerrar: [] }>()

const { filtros, activos, limpiar, alternar } = useFiltros()
const { tags } = useCatalogo()
const { mancha } = useLugares()
const { perfil } = usePerfil()
const { esNoche } = useModo()
const tagsDelModo = computed(() => tags.value.filter(t => t.ambito === 'ambos' || esNoche.value))

const chip = 'rounded-full border-2 border-tinta px-3 py-1 text-sm font-semibold'
</script>

<template>
  <div class="fixed inset-0 z-20 flex flex-col justify-end bg-black/60" @click.self="emit('cerrar')">
    <section
      class="mx-auto flex max-h-[85%] w-full max-w-md flex-col rounded-t-3xl border-2 border-b-0 border-tinta bg-garua"
      role="dialog"
      aria-modal="true"
      aria-label="Filtros"
    >
      <header class="flex items-center justify-between px-5 pt-4 pb-2">
        <h2 class="font-display text-2xl font-extrabold">{{ esNoche ? '¿A dónde la seguimos?' : '¿Qué se antoja?' }}</h2>
        <button v-if="activos" class="text-sm font-bold underline" @click="limpiar">Limpiar</button>
      </header>

      <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4">
        <div>
          <h3 class="text-sm font-bold">Con quién</h3>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="p in PLANES"
              :key="p.id"
              :class="[chip, filtros.plan === p.id ? 'bg-tinta text-papel' : 'bg-papel']"
              :aria-pressed="filtros.plan === p.id"
              @click="filtros.plan = filtros.plan === p.id ? null : p.id"
            >
              {{ p.emoji }} {{ p.nombre }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold">Nota mínima</h3>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="n in [3, 4, 5]"
              :key="n"
              :class="[chip, filtros.minimo === n ? 'bg-tinta text-papel' : 'bg-papel']"
              :aria-pressed="filtros.minimo === n"
              @click="filtros.minimo = filtros.minimo === n ? 0 : n"
            >
              {{ emojiDePlan(filtros.plan) }} {{ n === 5 ? NOTAS[4] : `${NOTAS[n - 1]} o más` }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold">Presupuesto máximo</h3>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="p in PRECIOS"
              :key="p.valor"
              :class="[chip, filtros.precioMax === p.valor ? 'bg-tinta text-papel' : 'bg-papel']"
              :aria-pressed="filtros.precioMax === p.valor"
              @click="filtros.precioMax = filtros.precioMax === p.valor ? null : p.valor"
            >
              {{ p.etiqueta }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold">Reseñado por</h3>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="m in mancha"
              :key="m.id"
              :class="[chip, filtros.autor === m.id ? 'bg-tinta text-papel' : 'bg-papel']"
              :aria-pressed="filtros.autor === m.id"
              @click="filtros.autor = filtros.autor === m.id ? null : m.id"
            >
              {{ m.id === perfil?.id ? 'Yo' : m.nombre }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-bold">Que tenga</h3>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <button
              v-for="t in tagsDelModo"
              :key="t.id"
              :class="[chip, filtros.tags.includes(t.id) ? 'bg-tinta text-papel' : 'bg-papel']"
              :aria-pressed="filtros.tags.includes(t.id)"
              @click="alternar('tags', t.id)"
            >
              {{ t.nombre }}
            </button>
          </div>
        </div>
      </div>

      <footer class="border-t-2 border-tinta px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button class="btn w-full bg-limon text-lg" @click="emit('cerrar')">
          Ver {{ resultados }} {{ resultados === 1 ? 'lugar' : 'lugares' }}
        </button>
      </footer>
    </section>
  </div>
</template>
