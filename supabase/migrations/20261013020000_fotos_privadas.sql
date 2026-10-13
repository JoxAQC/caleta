-- Las fotos de una reseña privada tampoco deben poder listarse ni abrirse desde Storage.
-- Antes bastaba con ser del grupo; ahora hace falta poder ver la fila de fotos (que ya
-- respeta la privacidad de la reseña) o haber subido el archivo.
drop policy "fotos: ver las de mi grupo" on storage.objects;

create policy "fotos: ver las de resenas visibles" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and (
      owner_id = (select auth.uid())::text
      or exists (select 1 from public.fotos f where f.path = name)
    )
  );
