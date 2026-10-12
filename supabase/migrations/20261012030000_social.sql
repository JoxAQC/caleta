-- Fase 6: lista "quiero ir", reacciones y comentarios.

create table public.pendientes (
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  lugar_id uuid not null references public.lugares (id) on delete cascade,
  -- Quién lo recomendó; null si el propio usuario lo guardó.
  recomendado_por uuid references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, lugar_id)
);

create index pendientes_lugar_id_idx on public.pendientes (lugar_id);

create table public.reacciones (
  resena_id uuid not null references public.resenas (id) on delete cascade,
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  emoji text not null check (emoji in ('🔥', '😋', '👀', '😂')),
  creado_en timestamptz not null default now(),
  primary key (resena_id, usuario_id, emoji)
);

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  resena_id uuid not null references public.resenas (id) on delete cascade,
  autor_id uuid not null references public.perfiles (id) on delete cascade,
  texto text not null check (length(trim(texto)) between 1 and 500),
  creado_en timestamptz not null default now()
);

create index comentarios_resena_id_idx on public.comentarios (resena_id);

alter table public.pendientes enable row level security;
alter table public.reacciones enable row level security;
alter table public.comentarios enable row level security;

create policy "ver pendientes de mi grupo" on public.pendientes
  for select to authenticated
  using (exists (
    select 1 from public.lugares l
    where l.id = lugar_id and l.grupo_id = (select public.mi_grupo())
  ));

-- Uno guarda para sí mismo, o recomienda a alguien de su mismo grupo.
create policy "guardar o recomendar pendientes" on public.pendientes
  for insert to authenticated
  with check (
    exists (
      select 1 from public.lugares l
      where l.id = lugar_id and l.grupo_id = (select public.mi_grupo())
    )
    and (
      (usuario_id = (select auth.uid()) and recomendado_por is null)
      or (
        recomendado_por = (select auth.uid())
        and usuario_id <> (select auth.uid())
        and exists (
          select 1 from public.perfiles p
          where p.id = usuario_id and p.grupo_id = (select public.mi_grupo())
        )
      )
    )
  );

create policy "quitar mis pendientes" on public.pendientes
  for delete to authenticated
  using (usuario_id = (select auth.uid()));

create policy "ver reacciones de mi grupo" on public.reacciones
  for select to authenticated
  using (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.grupo_id = (select public.mi_grupo())
  ));

create policy "reaccionar" on public.reacciones
  for insert to authenticated
  with check (
    usuario_id = (select auth.uid())
    and exists (
      select 1 from public.resenas r
      where r.id = resena_id and r.grupo_id = (select public.mi_grupo())
    )
  );

create policy "quitar mis reacciones" on public.reacciones
  for delete to authenticated
  using (usuario_id = (select auth.uid()));

create policy "ver comentarios de mi grupo" on public.comentarios
  for select to authenticated
  using (exists (
    select 1 from public.resenas r
    where r.id = resena_id and r.grupo_id = (select public.mi_grupo())
  ));

create policy "comentar" on public.comentarios
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and exists (
      select 1 from public.resenas r
      where r.id = resena_id and r.grupo_id = (select public.mi_grupo())
    )
  );

create policy "borrar mis comentarios" on public.comentarios
  for delete to authenticated
  using (autor_id = (select auth.uid()));
