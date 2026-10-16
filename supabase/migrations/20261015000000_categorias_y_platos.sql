-- Más categorías de comida peruana, agrupadas, y los platos que se pidieron en cada reseña.

-- 1. Grupos de categorías (para mostrarlas ordenadas en el wizard) ------------------
alter table public.categorias
  add column grupo text not null default 'otros'
  check (grupo in ('peruana', 'rapido', 'dulce', 'salir', 'otros'));

update public.categorias set grupo = 'peruana'
  where id in ('cevicheria', 'criollo', 'chifa', 'nikkei', 'polleria');
update public.categorias set grupo = 'rapido' where id in ('sanguche', 'amanecida');
update public.categorias set grupo = 'dulce' where id in ('cafe', 'postres');
update public.categorias set grupo = 'salir'
  where id in ('bar', 'discoteca', 'karaoke', 'lounge', 'en-vivo', 'juegos');
-- parrilla, refugio y otro se quedan en 'otros'.

update public.categorias set nombre = 'Cevichería y mariscos' where id = 'cevicheria';
update public.categorias set nombre = 'Postres y panadería' where id = 'postres';

insert into public.categorias (id, nombre, emoji, color, orden, ambito, grupo) values
  ('anticucheria', 'Anticuchería', '🍢', '#E07A4F', 2, 'ambos', 'peruana'),
  ('menu', 'Menú del día', '🍲', '#F2C14E', 3, 'dia', 'peruana'),
  ('desayuno', 'Desayuno criollo', '🥓', '#E8A87C', 4, 'dia', 'peruana'),
  ('regional', 'Regional', '🌶️', '#F26B5B', 7, 'dia', 'peruana'),
  ('al-paso', 'Al paso', '🌭', '#F6B352', 6, 'ambos', 'rapido'),
  ('hamburguesas', 'Hamburguesas y salchipapas', '🍔', '#E9967A', 6, 'ambos', 'rapido'),
  ('pizzeria', 'Pizzería', '🍕', '#F08A5D', 7, 'ambos', 'rapido'),
  ('jugueria', 'Juguería', '🥤', '#9BE15D', 9, 'dia', 'dulce'),
  ('internacional', 'Internacional', '🌮', '#7FC8F8', 30, 'ambos', 'otros');

-- 2. Platos pedidos en cada reseña (texto libre, con sugerencias en la app) ---------
alter table public.resenas
  add column platos text[] not null default '{}'
  check (cardinality(platos) <= 8);

grant update (platos) on public.resenas to authenticated;

-- Editar los platos también cuenta como edición.
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

  if (new.general, new.comida, new.ambiente, new.servicio, new.calidad_precio, new.plan, new.nota, new.privada, new.visitado_en, new.platos)
     is distinct from
     (old.general, old.comida, old.ambiente, old.servicio, old.calidad_precio, old.plan, old.nota, old.privada, old.visitado_en, old.platos)
  then
    new.editado_en := now();
  end if;
  return new;
end;
$$;

-- Al borrar una reseña que conserva comentarios ajenos, también se vacían sus platos.
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
      set borrada_en = now(), nota = null, plan = null, platos = '{}',
          comida = null, ambiente = null, servicio = null, calidad_precio = null, privada = false
      where id = p_resena;
  else
    delete from public.resenas where id = p_resena;
  end if;

  return v_rutas;
end;
$$;
