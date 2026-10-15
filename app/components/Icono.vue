<script setup lang="ts">
// Íconos de línea para acciones universales (editar, borrar).
withDefaults(defineProps<{ nombre: 'lapiz' | 'tacho', size?: number }>(), { size: 18 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="nombre === 'lapiz'">
      <path d="M4 20h4L18.500 9.500a2.828 2.828 0 1 0-4-4L4 16v4" />
      <path d="M13.500 6.500l4 4" />
    </template>
    <template v-else>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </template>
  </svg>
</template>
