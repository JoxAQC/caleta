-- Fases 2 y 3: catálogos, lugares, reseñas, tags y fotos.

create table public.categorias (
  id text primary key,
  nombre text not null,
  emoji text not null,
  color text not null,
  orden int not null default 0
);

create table public.tags (
  id text primary key,
  nombre text not null,
  orden int not null default 0
);

insert into public.categorias (id, nombre, emoji, color, orden) values
  ('cevicheria', 'Cevichería', '🐟', '#C6E03A', 1),
  ('criollo', 'Criollo', '🍛', '#FFB81C', 2),
  ('chifa', 'Chifa', '🥡', '#F0492E', 3),
  ('nikkei', 'Nikkei y makis', '🍣', '#FF8FA3', 4),
  ('polleria', 'Pollería', '🍗', '#F4A259', 5),
  ('parrilla', 'Parrilla', '🥩', '#D9694C', 6),
  ('sanguche', 'Sánguches', '🥪', '#E8C07D', 7),
  ('bar', 'Bar', '🍻', '#A97BE0', 8),
  ('cafe', 'Café', '☕', '#C99766', 9),
  ('postres', 'Postres', '🍰', '#F7A8D8', 10),
  ('otro', 'Otro', '📍', '#2FB6C4', 99);

insert into public.tags (id, nombre, orden) values
  ('volveria', 'Volvería', 1),
  ('barato', 'Barato', 2),
  ('porcion-generosa', 'Porción generosa', 3),
  ('rapido', 'Atienden rápido', 4),
  ('hay-cola', 'Hay cola', 5),
  ('ruidoso', 'Ruidoso', 6),
  ('buena-musica', 'Buena música', 7),
  ('buena-barra', 'Buena barra', 8),
  ('aire-libre', 'Al aire libre', 9),
  ('pet-friendly', 'Pet friendly', 10),
  ('solo-efectivo', 'Solo efectivo', 11),
  ('para-la-foto', 'Para la foto', 12);

create table public.lugares (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  nombre text not null check (length(trim(nombre)) > 0),
  direccion text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  categoria_id text not null references public.categorias (id),
  precio smallint check (precio between 1 and 4),
  -- Origen del lugar en un buscador externo (hoy 'osm'; 'google' al conectar Places).
  proveedor text,
  ref_externa text,
  creado_por uuid not null references public.perfiles (id),
  creado_en timestamptz not null default now(),
  unique (grupo_id, proveedor, ref_externa)
);

create index lugares_grupo_id_idx on public.lugares (grupo_id);

create table public.resenas (
  id uuid primary key default gen_random_uuid(),
  lugar_id uuid not null references public.lugares (id) on delete cascade,
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  autor_id uuid not null references public.perfiles (id),
  -- general es la única nota obligatoria: filtros y promedios leen solo esta.
  general smallint not null check (general between 1 and 5),
  comida smallint check (comida between 1 and 5),
  ambiente smallint check (ambiente between 1 and 5),
  servicio smallint check (servicio between 1 and 5),
  calidad_precio smallint check (calidad_precio between 1 and 5),
  plan text check (plan in ('mancha', 'cita', 'solo', 'familia')),
  nota text,
  audio_path text,
  transcripcion text,
  visitado_en date not null default current_date,
  creado_en timestamptz not null default now()
);

create index resenas_lugar_id_idx on public.resenas (lugar_id);
create index resenas_grupo_id_idx on public.resenas (grupo_id);
create index resenas_autor_id_idx on public.resenas (autor_id);

create table public.resena_tags (
  resena_id uuid not null references public.resenas (id) on delete cascade,
  tag_id text not null references public.tags (id),
  primary key (resena_id, tag_id)
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  resena_id uuid not null references public.resenas (id) on delete cascade,
  path text not null unique,
  creado_en timestamptz not null default now()
);

create index fotos_resena_id_idx on public.fotos (resena_id);

alter table public.categorias enable row level security;
alter table public.tags enable row level security;
alter table public.lugares enable row level security;
alter table public.resenas enable row level security;
alter table public.resena_tags enable row level security;
alter table public.fotos enable row level security;

create policy "leer categorias" on public.categorias for select to authenticated using (true);
create policy "leer tags" on public.tags for select to authenticated using (true);

create policy "ver lugares de mi grupo" on public.lugares
  for select to authenticated
  using (grupo_id = (select public.mi_grupo()));

create policy "crear lugares en mi grupo" on public.lugares
  for insert to authenticated
  with check (grupo_id = (select public.mi_grupo()) and creado_por = (select auth.uid()));

create policy "editar lugares de mi grupo" on public.lugares
  for update to authenticated
  using (grupo_id = (select public.mi_grupo()))
  with check (grupo_id = (select public.mi_grupo()));

create policy "ver resenas de mi grupo" on public.resenas
  for select to authenticated
  using (grupo_id = (select public.mi_grupo()));

create policy "crear mis resenas" on public.resenas
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and grupo_id = (select public.mi_grupo())
    and exists (
      select 1 from public.lugares l
      where l.id = lugar_id and l.grupo_id = (select public.mi_grupo())
    )
  );

create policy "editar mis resenas" on public.resenas
  for update to authenticated
  using (autor_id = (select auth.uid()))
  with check (autor_id = (select auth.uid()) and grupo_id = (select public.mi_grupo()));

create policy "borrar mis resenas" on public.resenas
  for delete to authenticated
  using (autor_id = (select auth.uid()));

create policy "ver tags de resenas de mi grupo" on public.resena_tags
  for select to authenticated
  using (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.grupo_id = (select public.mi_grupo())
  ));

create policy "etiquetar mis resenas" on public.resena_tags
  for insert to authenticated
  with check (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.autor_id = (select auth.uid())
  ));

create policy "quitar tags de mis resenas" on public.resena_tags
  for delete to authenticated
  using (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.autor_id = (select auth.uid())
  ));

create policy "ver fotos de mi grupo" on public.fotos
  for select to authenticated
  using (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.grupo_id = (select public.mi_grupo())
  ));

create policy "agregar fotos a mis resenas" on public.fotos
  for insert to authenticated
  with check (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.autor_id = (select auth.uid())
  ));

create policy "borrar fotos de mis resenas" on public.fotos
  for delete to authenticated
  using (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.autor_id = (select auth.uid())
  ));

-- Lugar + promedio y cantidad de reseñas. security_invoker para que aplique el RLS de quien consulta.
create view public.lugares_resumen
with (security_invoker = true) as
select
  l.*,
  round(avg(r.general)::numeric, 1)::double precision as promedio,
  count(r.id)::int as total_resenas,
  max(r.creado_en) as ultima_resena
from public.lugares l
left join public.resenas r on r.lugar_id = l.id
group by l.id;

-- Fotos: bucket privado; la primera carpeta de la ruta es el grupo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "fotos: ver las de mi grupo" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select public.mi_grupo())::text);

create policy "fotos: subir a mi grupo" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select public.mi_grupo())::text);

create policy "fotos: borrar las mias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and owner_id = (select auth.uid())::text);
