-- Precio por reseña, "con quién" de selección múltiple y tags según el tono de la nota.

-- 1. Precio por persona en cada reseña --------------------------------------------
alter table public.resenas add column precio smallint check (precio between 1 and 4);

-- Punto de partida: las reseñas existentes heredan el precio que tenía su lugar.
update public.resenas r set precio = l.precio from public.lugares l where l.id = r.lugar_id;

-- 2. Con quién: varias opciones por reseña ----------------------------------------
-- `plan` se conserva como el primero elegido: define el ícono de la calificación.
alter table public.resenas
  add column planes text[] not null default '{}'
  check (planes <@ array['mancha', 'cita', 'solo', 'familia', 'juerga']);

update public.resenas set planes = array[plan] where plan is not null;

grant update (precio, planes) on public.resenas to authenticated;

-- 3. Precio del lugar: el que más se repite entre sus reseñas; si no hay, el del lugar.
--    (Columna nueva al final para poder reemplazar la vista.)
create or replace view public.lugares_resumen
with (security_invoker = true) as
select
  l.*,
  round(avg(r.general) filter (where r.borrada_en is null)::numeric, 1)::double precision as promedio,
  (count(r.id) filter (where r.borrada_en is null))::int as total_resenas,
  max(r.creado_en) filter (where r.borrada_en is null) as ultima_resena,
  mode() within group (order by r.precio) filter (where r.borrada_en is null and r.precio is not null) as precio_resenas
from public.lugares l
left join public.resenas r on r.lugar_id = l.id
group by l.id;

-- 4. Tono de los tags: los evaluativos se sugieren según la nota ------------------
alter table public.tags
  add column tono text not null default 'descriptivo'
  check (tono in ('positivo', 'neutro', 'negativo', 'descriptivo'));

update public.tags set tono = 'positivo' where id in ('volveria', 'barato', 'porcion-generosa', 'rapido');

insert into public.tags (id, nombre, orden, ambito, tono) values
  ('buena-atencion', 'Buena atención', 3, 'ambos', 'positivo'),
  ('cumple', 'Cumple sin más', 40, 'ambos', 'neutro'),
  ('algo-caro', 'Algo caro', 41, 'ambos', 'neutro'),
  ('demoran-un-poco', 'Demoran un poco', 42, 'ambos', 'neutro'),
  ('puede-mejorar', 'Puede mejorar', 43, 'ambos', 'neutro'),
  ('salir-del-paso', 'Para salir del paso', 44, 'ambos', 'neutro'),
  ('mala-atencion', 'Mala atención', 50, 'ambos', 'negativo'),
  ('demoran-mucho', 'Demoran mucho', 51, 'ambos', 'negativo'),
  ('caro-para-lo-que-es', 'Caro para lo que es', 52, 'ambos', 'negativo'),
  ('porciones-pequenas', 'Porciones pequeñas', 53, 'ambos', 'negativo'),
  ('comida-fria', 'Comida fría', 54, 'ambos', 'negativo'),
  ('no-volveria', 'No volvería', 55, 'ambos', 'negativo');

-- 5. Edición y borrado consideran los campos nuevos -------------------------------
create or replace function public.antes_de_editar_resena()
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

  if (new.general, new.comida, new.ambiente, new.servicio, new.calidad_precio, new.plan, new.planes,
      new.precio, new.nota, new.privada, new.visitado_en, new.platos)
     is distinct from
     (old.general, old.comida, old.ambiente, old.servicio, old.calidad_precio, old.plan, old.planes,
      old.precio, old.nota, old.privada, old.visitado_en, old.platos)
  then
    new.editado_en := now();
  end if;
  return new;
end;
$$;

create or replace function public.borrar_resena(p_resena uuid)
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
      set borrada_en = now(), nota = null, plan = null, planes = '{}', precio = null, platos = '{}',
          comida = null, ambiente = null, servicio = null, calidad_precio = null, privada = false
      where id = p_resena;
  else
    delete from public.resenas where id = p_resena;
  end if;

  return v_rutas;
end;
$$;
