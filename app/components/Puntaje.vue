<script setup lang="ts">
import type { PlanId } from '~/utils/tipos'
import { emojiDePlan, NOTAS } from '~/utils/catalogo'

// Escala de 1 a 5 cuyo ícono depende del plan de la visita.
const props = withDefaults(defineProps<{
  modelValue: number
  plan?: PlanId | null
  size?: 'sm' | 'md' | 'lg'
  soloLectura?: boolean
}>(), { size: 'md', plan: null })

const emit = defineEmits<{ 'update:modelValue': [valor: number] }>()

const emoji = computed(() => emojiDePlan(props.plan))
const clase = computed(() => ({ sm: 'text-base', md: 'text-2xl', lg: 'text-4xl' })[props.size])
</script>

<template>
  <div v-if="soloLectura" class="inline-flex gap-0.5" :class="clase" role="img" :aria-label="`${modelValue} de 5`">
    <span v-for="n in 5" :key="n" :class="n <= Math.round(modelValue) ? '' : 'opacity-25 grayscale'">{{ emoji }}</span>
  </div>
  <div v-else class="flex justify-between" role="radiogroup" aria-label="Calificación">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      role="radio"
      :aria-checked="modelValue === n"
      :aria-label="`${n} de 5: ${NOTAS[n - 1]}`"
      class="leading-none transition-transform duration-100 active:scale-90"
      :class="[clase, n <= modelValue ? 'scale-110' : 'opacity-30 grayscale']"
      @click="emit('update:modelValue', n)"
    >
      {{ emoji }}
    </button>
  </div>
</template>
