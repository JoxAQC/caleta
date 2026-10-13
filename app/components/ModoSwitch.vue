<script setup lang="ts">
const { esNoche, alternar } = useModo()
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="esNoche"
    :aria-label="esNoche ? 'Modo noche activo. Cambiar a modo día' : 'Modo día activo. Cambiar a modo noche'"
    class="sticker relative h-11 w-[4.25rem] shrink-0 rounded-full p-0"
    :class="esNoche ? 'bg-chicha' : 'bg-aji'"
    @click="alternar"
  >
    <span
      class="absolute top-1/2 left-1 grid size-8 -translate-y-1/2 place-items-center rounded-full border-2 border-tinta bg-papel text-base leading-none transition-transform duration-200"
      :class="esNoche ? 'translate-x-[1.6rem]' : ''"
      aria-hidden="true"
    >{{ esNoche ? '🌙' : '☀️' }}</span>
  </button>
</template>
