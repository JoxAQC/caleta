-- La grabación de voz no se guarda: se transcribe y el texto queda en resenas.nota.
alter table public.resenas
  drop column audio_path,
  drop column transcripcion;
