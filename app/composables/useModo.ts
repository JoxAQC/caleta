export type Modo = 'dia' | 'noche'

const CLAVE = 'caleta:modo'

// Modo día / modo noche. Noche cambia la paleta, el mapa, a Capi y qué categorías se muestran.
// La elección es manual y se recuerda en el dispositivo.
export function useModo() {
  const modo = useState<Modo>('modo', () => 'dia')
  const esNoche = computed(() => modo.value === 'noche')

  function aplicar() {
    document.documentElement.classList.toggle('noche', esNoche.value)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', esNoche.value ? '#140B1E' : '#C6E03A')
  }

  function leerGuardado() {
    try {
      if (localStorage.getItem(CLAVE) === 'noche') modo.value = 'noche'
    }
    catch {}
    aplicar()
  }

  function alternar() {
    modo.value = esNoche.value ? 'dia' : 'noche'
    try {
      localStorage.setItem(CLAVE, modo.value)
    }
    catch {}
    aplicar()
  }

  return { modo, esNoche, alternar, leerGuardado }
}
