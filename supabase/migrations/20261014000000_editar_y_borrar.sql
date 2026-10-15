-- Editar y borrar lo propio.
-- * Reseñas y comentarios guardan cuándo se editaron por última vez (lo pone la base).
-- * Borrar una reseña que tiene comentarios de otros la deja como "borrada": sale del
--   promedio y pierde su contenido, pero los comentarios ajenos se conservan.
-- * Un lugar solo puede borrarse si nadie más aportó en él.
-- * Cualquiera del grupo puede corregir los datos de un lugar.

alter table public.resenas
  add column editado_en timestamptz,
  add column borrada_en timestamptz;

alter table public.comentarios add column editado_en timestamptz;

-- Columnas que el autor puede cambiar desde la app (ni autor, ni lugar, ni grupo, ni fechas).
revoke update on public.resenas from authenticated, anon;
grant update (general, comida, ambiente, servicio, calidad_precio, plan, nota, privada, visitado_en)
  on public.resenas to authenticated;

revoke update on public.comentarios from authenticated, anon;
grant update (texto) on public.comentarios to authenticated;

create policy "editar mis comentarios" on public.comentarios
  for update to authenticated
  using (autor_id = (select auth.uid()))
  with check (autor_id = (select auth.uid()));

-- Datos del lugar que el grupo puede corregir.
revoke update on public.lugares from authenticated, anon;
grant update (nombre, direccion, lat, lng, categoria_id, precio) on public.lugares to authenticated;

-- Marca de edición y reglas al actualizar una reseña.
create function public.antes_de_editar_resena()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Al borrarla (lo hace borrar_resena) no cuenta como edición.
  if new.borrada_en is not null and old.borrada_en is null then
    return new;
  end if;

  if old.borrada_en is not null then
    raise exception 'La reseña fue borrada' using errcode = 'P0001';
  end if;

  -- No se puede ocultar una reseña en la que otras personas ya comentaron.
  if new.privada and not old.privada and exists (
    select 1 from public.comentarios c
    where c.resena_id = new.id and c.autor_id <> new.autor_id
  ) then
    raise exception 'resena_con_comentarios' using errcode = 'P0001';
  end if;

  if (new.general, new.comida, new.ambiente, new.servicio, new.calidad_precio, new.plan, new.nota, new.privada, new.visitado_en)
     is distinct from
     (old.general, old.comida, old.ambiente, old.servicio, old.calidad_precio, old.plan, old.nota, old.privada, old.visitado_en)
  then
    new.editado_en := now();
  end if;
  return new;
end;
$$;

create trigger antes_de_editar_resena
  before update on public.resenas
  for each row
  execute function public.antes_de_editar_resena();

create function public.antes_de_editar_comentario()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.texto is distinct from old.texto then
    new.editado_en := now();
  end if;
  return new;
end;
$$;

create trigger antes_de_editar_comentario
  before update on public.comentarios
  for each row
  execute function public.antes_de_editar_comentario();

-- Las reseñas borradas no cuentan en el promedio ni en el total.
create or replace view public.lugares_resumen
with (security_invoker = true) as
select
  l.*,
  round(avg(r.general) filter (where r.borrada_en is null)::numeric, 1)::double precision as promedio,
  (count(r.id) filter (where r.borrada_en is null))::int as total_resenas,
  max(r.creado_en) filter (where r.borrada_en is null) as ultima_resena
from public.lugares l
left join public.resenas r on r.lugar_id = l.id
group by l.id;

-- Borra una reseña propia. Si otras personas comentaron, la deja como borrada
-- conservando esos comentarios; si no, la elimina del todo.
-- Devuelve las rutas de fotos que quien llama debe quitar de Storage.
create function public.borrar_resena(p_resena uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resena public.resenas;
  v_rutas text[];
begin
  select * into v_resena from public.resenas where id = p_resena;
  if not found or v_resena.autor_id <> (select auth.uid()) then
    raise exception 'No puedes borrar esta reseña' using errcode = '42501';
  end if;

  select coalesce(array_agg(path), '{}') into v_rutas from public.fotos where resena_id = p_resena;

  if exists (
    select 1 from public.comentarios c
    where c.resena_id = p_resena and c.autor_id <> v_resena.autor_id
  ) then
    delete from public.fotos where resena_id = p_resena;
    delete from public.resena_tags where resena_id = p_resena;
    delete from public.reacciones where resena_id = p_resena;
    delete from public.comentarios where resena_id = p_resena and autor_id = v_resena.autor_id;
    update public.resenas
      set borrada_en = now(), nota = null, plan = null,
          comida = null, ambiente = null, servicio = null, calidad_precio = null, privada = false
      where id = p_resena;
  else
    delete from public.resenas where id = p_resena;
  end if;

  return v_rutas;
end;
$$;

-- ¿Puedo borrar este lugar? Solo quien lo creó, y solo si nadie más aportó en él
-- (reseñas, "Quiero ir", comentarios o reacciones), contando también lo privado.
create function public.puedo_borrar_lugar(p_lugar uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lugares l
    where l.id = p_lugar
      and l.creado_por = (select auth.uid())
      and l.grupo_id = (select public.mi_grupo())
  )
  and not exists (select 1 from public.resenas r where r.lugar_id = p_lugar and r.autor_id <> (select auth.uid()))
  and not exists (select 1 from public.pendientes q where q.lugar_id = p_lugar and q.usuario_id <> (select auth.uid()))
  and not exists (
    select 1 from public.comentarios c join public.resenas r on r.id = c.resena_id
    where r.lugar_id = p_lugar and c.autor_id <> (select auth.uid())
  )
  and not exists (
    select 1 from public.reacciones x join public.resenas r on r.id = x.resena_id
    where r.lugar_id = p_lugar and x.usuario_id <> (select auth.uid())
  )
$$;

-- Borra el lugar con todo lo propio que tenga. Devuelve las rutas de fotos a quitar de Storage.
create function public.borrar_lugar(p_lugar uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rutas text[];
begin
  if not public.puedo_borrar_lugar(p_lugar) then
    raise exception 'Otras personas ya aportaron en este lugar' using errcode = '42501';
  end if;

  select coalesce(array_agg(f.path), '{}') into v_rutas
  from public.fotos f join public.resenas r on r.id = f.resena_id
  where r.lugar_id = p_lugar;

  delete from public.lugares where id = p_lugar;
  return v_rutas;
end;
$$;

revoke execute on function public.borrar_resena(uuid) from public, anon;
revoke execute on function public.puedo_borrar_lugar(uuid) from public, anon;
revoke execute on function public.borrar_lugar(uuid) from public, anon;
grant execute on function public.borrar_resena(uuid) to authenticated;
grant execute on function public.puedo_borrar_lugar(uuid) to authenticated;
grant execute on function public.borrar_lugar(uuid) to authenticated;

-- Los triggers solo los dispara la base.
revoke execute on function public.antes_de_editar_resena() from public, anon, authenticated;
revoke execute on function public.antes_de_editar_comentario() from public, anon, authenticated;
