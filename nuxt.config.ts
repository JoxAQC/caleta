import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  // App detrás de login y centrada en el mapa: se sirve como SPA.
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/supabase', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  app: {
    head: {
      title: 'Caleta',
      htmlAttrs: { lang: 'es' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#C6E03A' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    // Clave de Groq (Whisper) para transcribir en el servidor: NUXT_GROQ_API_KEY.
    groqApiKey: '',
    public: {
      // 'navegador' usa el dictado del propio navegador; 'servidor' graba y transcribe con Whisper.
      // Se cambia con NUXT_PUBLIC_TRANSCRIPCION.
      transcripcion: 'navegador',
      // Muestra el login demo en lugar de Google. Solo para el stack local.
      // Se activa con NUXT_PUBLIC_DEMO_LOGIN=true en .env.
      demoLogin: false,
    },
  },

  supabase: {
    types: '~~/shared/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // Los enlaces de invitación se abren sin sesión.
      exclude: ['/unirse/*'],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Caleta',
      short_name: 'Caleta',
      description: 'Los datos de la mancha: reseñas entre amigos.',
      lang: 'es',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      background_color: '#EEF1EC',
      theme_color: '#C6E03A',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
  },
})
