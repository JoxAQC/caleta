import { serverSupabaseClient } from '#supabase/server'

const MAX_BYTES = 4 * 1024 * 1024

// Transcribe una nota de voz con Whisper (Groq). El audio solo pasa por memoria: no se guarda.
export default defineEventHandler(async (event) => {
  // Solo miembros de un grupo: evita que la ruta sirva de proxy abierto a la API.
  const supabase = await serverSupabaseClient(event)
  const { data: grupo } = await supabase.rpc('mi_grupo')
  if (!grupo) throw createError({ statusCode: 401, statusMessage: 'Sesión no válida' })

  const { groqApiKey } = useRuntimeConfig(event)
  if (!groqApiKey) throw createError({ statusCode: 503, statusMessage: 'Transcripción no configurada' })

  const partes = await readMultipartFormData(event)
  const audio = partes?.find(p => p.name === 'audio')
  if (!audio?.data.length) throw createError({ statusCode: 400, statusMessage: 'Falta el audio' })
  if (audio.data.length > MAX_BYTES) throw createError({ statusCode: 413, statusMessage: 'Audio demasiado largo' })

  const cuerpo = new FormData()
  cuerpo.append('file', new Blob([new Uint8Array(audio.data)], { type: audio.type ?? 'audio/webm' }), audio.filename ?? 'nota.webm')
  cuerpo.append('model', 'whisper-large-v3-turbo')
  cuerpo.append('language', 'es')
  cuerpo.append('response_format', 'json')

  try {
    const res = await $fetch<{ text: string }>('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: cuerpo,
    })
    return { texto: res.text.trim() }
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'El servicio de transcripción falló' })
  }
})
