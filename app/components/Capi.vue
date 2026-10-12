<script setup lang="ts">
// Capi: capibara con un limón en la cabeza. El ánimo cambia ojos y boca.
withDefaults(defineProps<{
  size?: number
  animo?: 'normal' | 'feliz' | 'dormido' | 'triste'
}>(), { size: 120, animo: 'normal' })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 120 120" role="img" aria-label="Capi, la mascota de Caleta">
    <g stroke="#2B1B3D" stroke-linejoin="round" stroke-linecap="round">
      <!-- orejas -->
      <ellipse cx="32" cy="40" rx="6.5" ry="7.5" fill="#8A5A3C" stroke-width="3.5" />
      <ellipse cx="88" cy="40" rx="6.5" ry="7.5" fill="#8A5A3C" stroke-width="3.5" />
      <!-- cabeza cuadrada y hocico ancho, como buen capibara -->
      <rect x="25" y="36" width="70" height="76" rx="25" fill="#B07A4F" stroke-width="4" />
      <rect x="31" y="68" width="58" height="40" rx="19" fill="#D2A274" stroke-width="3" />
      <ellipse cx="50" cy="80" rx="3.4" ry="2.3" fill="#2B1B3D" stroke="none" transform="rotate(-20 50 80)" />
      <ellipse cx="70" cy="80" rx="3.4" ry="2.3" fill="#2B1B3D" stroke="none" transform="rotate(20 70 80)" />
      <path :d="animo === 'triste' ? 'M53 97q7-5 14 0' : animo === 'feliz' ? 'M51 93q9 9 18 0' : 'M53 94q7 5 14 0'" fill="none" stroke-width="2.8" />
      <!-- limón -->
      <circle cx="60" cy="24" r="12.5" fill="#C6E03A" stroke-width="3.5" />
      <path d="M60 12.5c0-6 6-8 11-6-1 5-6 8-11 6z" fill="#3E8E41" stroke-width="2.5" />
      <path d="M53 21q2-4 6-5" fill="none" stroke="#fff" stroke-width="2.5" />

      <!-- ojos: de párpado caído salvo cuando está feliz o dormido -->
      <g v-if="animo === 'feliz'" fill="none" stroke-width="3.5">
        <path d="M34 58q5-6 10 0M76 58q5-6 10 0" />
      </g>
      <g v-else-if="animo === 'dormido'" fill="none" stroke-width="3.5">
        <path d="M34 56q5 4 10 0M76 56q5 4 10 0" />
      </g>
      <g v-else>
        <circle cx="39" cy="57" r="3.8" fill="#2B1B3D" stroke="none" />
        <circle cx="81" cy="57" r="3.8" fill="#2B1B3D" stroke="none" />
        <path v-if="animo === 'triste'" d="M33 50l10 3M87 50l-10 3" fill="none" stroke-width="3" />
        <path v-else d="M33.500 53.500h11M75.500 53.500h11" fill="none" stroke-width="3" />
      </g>
    </g>
    <g v-if="animo === 'feliz'" fill="#F0492E" opacity=".45">
      <circle cx="31" cy="68" r="4.500" />
      <circle cx="89" cy="68" r="4.500" />
    </g>
  </svg>
</template>
