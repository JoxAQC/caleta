<script setup lang="ts">
// Capi: capibara con un limón en la cabeza. El ánimo cambia ojos y boca.
// En modo noche sale de fiesta: lentes oscuros y una bola disco en lugar del limón.
withDefaults(defineProps<{
  size?: number
  animo?: 'normal' | 'feliz' | 'dormido' | 'triste'
}>(), { size: 120, animo: 'normal' })

const { esNoche } = useModo()
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 120 120" role="img" aria-label="Capi, la mascota de Caleta">
    <g class="stroke-tinta" stroke-linejoin="round" stroke-linecap="round">
      <!-- orejas -->
      <ellipse cx="32" cy="40" rx="6.5" ry="7.5" fill="#8A5A3C" stroke-width="3.5" />
      <ellipse cx="88" cy="40" rx="6.5" ry="7.5" fill="#8A5A3C" stroke-width="3.5" />
      <!-- cabeza cuadrada y hocico ancho, como buen capibara -->
      <rect x="25" y="36" width="70" height="76" rx="25" fill="#B07A4F" stroke-width="4" />
      <rect x="31" y="68" width="58" height="40" rx="19" fill="#D2A274" stroke-width="3" />
      <g fill="#2B1B3D" stroke="none">
        <ellipse cx="50" cy="80" rx="3.4" ry="2.3" transform="rotate(-20 50 80)" />
        <ellipse cx="70" cy="80" rx="3.4" ry="2.3" transform="rotate(20 70 80)" />
      </g>
      <path
        :d="animo === 'triste' ? 'M53 97q7-5 14 0' : animo === 'feliz' ? 'M51 93q9 9 18 0' : 'M53 94q7 5 14 0'"
        fill="none"
        stroke="#2B1B3D"
        stroke-width="2.8"
      />

      <!-- en la cabeza: bola disco de noche, limón de día -->
      <template v-if="esNoche">
        <circle cx="60" cy="24" r="12.5" fill="#C9D2FF" stroke-width="3.5" />
        <path d="M48 24h24M60 12v24M52 15q8 9 0 18M68 15q-8 9 0 18" fill="none" stroke="#2B1B3D" stroke-width="1.4" opacity=".55" />
        <path d="M54 18l3-1" fill="none" stroke="#fff" stroke-width="2.500" />
      </template>
      <template v-else>
        <circle cx="60" cy="24" r="12.5" fill="#C6E03A" stroke-width="3.5" />
        <path d="M60 12.5c0-6 6-8 11-6-1 5-6 8-11 6z" fill="#3E8E41" stroke-width="2.5" />
        <path d="M53 21q2-4 6-5" fill="none" stroke="#fff" stroke-width="2.5" />
      </template>

      <!-- ojos: lentes oscuros de noche; de día, párpado caído salvo feliz o dormido -->
      <g v-if="esNoche">
        <path d="M27 54h66" fill="none" stroke-width="3" />
        <rect x="29" y="50" width="27" height="16" rx="7" fill="#1B1126" stroke-width="3" />
        <rect x="64" y="50" width="27" height="16" rx="7" fill="#1B1126" stroke-width="3" />
        <path d="M34 55h7M69 55h7" fill="none" stroke="#fff" stroke-width="2.500" opacity=".7" />
      </g>
      <g v-else-if="animo === 'feliz'" fill="none" stroke="#2B1B3D" stroke-width="3.5">
        <path d="M34 58q5-6 10 0M76 58q5-6 10 0" />
      </g>
      <g v-else-if="animo === 'dormido'" fill="none" stroke="#2B1B3D" stroke-width="3.5">
        <path d="M34 56q5 4 10 0M76 56q5 4 10 0" />
      </g>
      <g v-else stroke="#2B1B3D">
        <circle cx="39" cy="57" r="3.8" fill="#2B1B3D" stroke="none" />
        <circle cx="81" cy="57" r="3.8" fill="#2B1B3D" stroke="none" />
        <path v-if="animo === 'triste'" d="M33 50l10 3M87 50l-10 3" fill="none" stroke-width="3" />
        <path v-else d="M33.500 53.500h11M75.500 53.500h11" fill="none" stroke-width="3" />
      </g>
    </g>
    <g v-if="animo === 'feliz' || esNoche" fill="#F0492E" opacity=".45">
      <circle cx="31" cy="72" r="4.500" />
      <circle cx="89" cy="72" r="4.500" />
    </g>
    <!-- destellos de la bola disco -->
    <g v-if="esNoche" fill="#FFD23D">
      <path d="M38 14l1.500 4 4 1.500-4 1.500-1.500 4-1.500-4-4-1.500 4-1.500z" />
      <path d="M84 8l1.200 3.200 3.200 1.200-3.200 1.200L84 17l-1.200-3.200-3.200-1.200 3.200-1.200z" />
    </g>
  </svg>
</template>
