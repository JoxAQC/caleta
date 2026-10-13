// Aplica el modo guardado antes de pintar la primera pantalla.
export default defineNuxtPlugin(() => {
  useModo().leerGuardado()
})
