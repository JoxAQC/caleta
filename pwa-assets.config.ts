import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

const FONDO = '#FFB81C'

// Android recorta el ícono "maskable" en círculo (u otra forma) y iOS lo redondea:
// el fondo debe llegar hasta el borde, sin transparencia ni blanco.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { sizes: [512], padding: 0.12, resizeOptions: { background: FONDO, fit: 'contain' } },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: FONDO, fit: 'contain' } },
  },
  images: ['public/logo.svg'],
})
