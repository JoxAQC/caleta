// Reduce la foto antes de subirla para cuidar el espacio de Storage.
export async function comprimirImagen(archivo: File, ladoMax = 1600, calidad = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', calidad)
  })
}
