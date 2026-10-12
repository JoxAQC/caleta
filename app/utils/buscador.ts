import type { Coordenada } from './tipos'

export interface ResultadoBusqueda extends Coordenada {
  nombre: string
  direccion: string
  proveedor: string
  ref_externa: string
}

// Buscador de locales sobre OpenStreetMap (Photon). Al conectar Google Places,
// basta con reemplazar esta función manteniendo la misma forma de resultado.
export async function buscarLugares(texto: string, cerca: Coordenada, signal?: AbortSignal): Promise<ResultadoBusqueda[]> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', texto)
  url.searchParams.set('lat', String(cerca.lat))
  url.searchParams.set('lon', String(cerca.lng))
  url.searchParams.set('limit', '6')
  // Lima y Callao
  url.searchParams.set('bbox', '-77.25,-12.4,-76.7,-11.7')

  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error('El buscador no respondió')
  const json = await res.json()

  return (json.features ?? [])
    .filter((f: any) => f.properties?.name)
    .map((f: any) => {
      const p = f.properties
      const calle = [p.street, p.housenumber].filter(Boolean).join(' ')
      return {
        nombre: p.name,
        direccion: [calle, p.district ?? p.locality, p.city].filter(Boolean).join(', '),
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        proveedor: 'osm',
        ref_externa: `${p.osm_type}${p.osm_id}`,
      }
    })
}
