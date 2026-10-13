-- Modo noche: categorías y tags por ámbito, plan "juerga" y reseñas privadas.

-- 1. Ámbito de categorías y tags -------------------------------------------------
alter table public.categorias
  add column ambito text not null default 'dia' check (ambito in ('dia', 'noche', 'ambos'));

update public.categorias set ambito = 'ambos' where id in ('bar', 'sanguche', 'otro');

insert into public.categorias (id, nombre, emoji, color, orden, ambito) values
  ('discoteca', 'Discoteca', '🪩', '#FF7AD9', 20, 'noche'),
  ('karaoke', 'Karaoke', '🎤', '#C49BFF', 21, 'noche'),
  ('lounge', 'Lounge y rooftop', '🍸', '#5FE3F0', 22, 'noche'),
  ('en-vivo', 'Música en vivo', '🎸', '#FF9A4D', 23, 'noche'),
  ('juegos', 'Billar y juegos', '🎱', '#6FE39A', 24, 'noche'),
  ('amanecida', 'Amanecida', '🌙', '#FFD95A', 25, 'noche'),
  ('refugio', 'Refugio', '🏨', '#FF8FA8', 26, 'noche');

alter table public.tags
  add column ambito text not null default 'ambos' check (ambito in ('ambos', 'noche'));

insert into public.tags (id, nombre, orden, ambito) values
  ('cover', 'Cobran cover', 20, 'noche'),
  ('se-baila', 'Se baila', 21, 'noche'),
  ('tragos-caros', 'Tragos caros', 22, 'noche'),
  ('cierra-tarde', 'Cierra tarde', 23, 'noche'),
  ('taxi-facil', 'Fácil conseguir taxi', 24, 'noche'),
  ('con-lista', 'Entrada con lista', 25, 'noche'),
  ('limpio', 'Limpio', 26, 'noche'),
  ('discreto', 'Discreto', 27, 'noche'),
  ('con-cochera', 'Con cochera', 28, 'noche');

-- 2. Plan "juerga" ---------------------------------------------------------------
alter table public.resenas drop constraint resenas_plan_check;
alter table public.resenas
  add constraint resenas_plan_check check (plan in ('mancha', 'cita', 'solo', 'familia', 'juerga'));

-- 3. Reseñas privadas ------------------------------------------------------------
alter table public.resenas add column privada boolean not null default false;

-- Una reseña privada solo la ve quien la escribió. Las políticas de tags, fotos,
-- reacciones y comentarios consultan resenas, así que heredan esta regla.
drop policy "ver resenas de mi grupo" on public.resenas;
create policy "ver resenas de mi grupo" on public.resenas
  for select to authenticated
  using (
    grupo_id = (select public.mi_grupo())
    and (not privada or autor_id = (select auth.uid()))
  );

-- Un lugar es visible para el grupo cuando alguien lo reseñó en público o lo tiene en
-- "Quiero ir". Si solo tiene reseñas privadas, lo ve únicamente quien lo creó.
-- security definer: debe poder contar reseñas y pendientes sin pasar por el RLS de quien pregunta.
create function public.lugar_publico(p_lugar uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.resenas r where r.lugar_id = p_lugar and not r.privada)
      or exists (select 1 from public.pendientes q where q.lugar_id = p_lugar)
$$;

-- ¿El lugar es de mi grupo? Sin pasar por la visibilidad de lugares, para poder
-- reseñar un lugar que otra persona registró en privado.
create function public.lugar_en_mi_grupo(p_lugar uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lugares l
    where l.id = p_lugar and l.grupo_id = (select public.mi_grupo())
  )
$$;

-- Id del lugar del grupo que ya corresponde a un local del buscador, aunque esté oculto.
-- Evita duplicarlo cuando dos personas registran el mismo local.
create function public.lugar_por_referencia(p_proveedor text, p_ref text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select l.id from public.lugares l
  where l.grupo_id = (select public.mi_grupo())
    and l.proveedor = p_proveedor
    and l.ref_externa = p_ref
$$;

revoke execute on function public.lugar_publico(uuid) from public, anon;
revoke execute on function public.lugar_en_mi_grupo(uuid) from public, anon;
revoke execute on function public.lugar_por_referencia(text, text) from public, anon;
grant execute on function public.lugar_publico(uuid) to authenticated;
grant execute on function public.lugar_en_mi_grupo(uuid) to authenticated;
grant execute on function public.lugar_por_referencia(text, text) to authenticated;

drop policy "ver lugares de mi grupo" on public.lugares;
create policy "ver lugares de mi grupo" on public.lugares
  for select to authenticated
  using (
    grupo_id = (select public.mi_grupo())
    and (creado_por = (select auth.uid()) or public.lugar_publico(id))
  );

drop policy "crear mis resenas" on public.resenas;
create policy "crear mis resenas" on public.resenas
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and grupo_id = (select public.mi_grupo())
    and public.lugar_en_mi_grupo(lugar_id)
  );
