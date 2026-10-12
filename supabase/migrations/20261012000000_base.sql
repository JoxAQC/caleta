-- Fase 1: grupo cerrado, lista de invitados y perfiles.

create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  creado_en timestamptz not null default now()
);

create table public.invitados (
  email text primary key check (email = lower(email)),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  creado_en timestamptz not null default now()
);

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  grupo_id uuid not null references public.grupos (id),
  nombre text not null,
  avatar_url text,
  creado_en timestamptz not null default now()
);

create index perfiles_grupo_id_idx on public.perfiles (grupo_id);

alter table public.grupos enable row level security;
alter table public.invitados enable row level security;
alter table public.perfiles enable row level security;

-- Grupo del usuario actual. security definer para que las políticas de
-- perfiles no se consulten a sí mismas (recursión de RLS).
create function public.mi_grupo()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select grupo_id from public.perfiles where id = (select auth.uid())
$$;

-- invitados no tiene políticas: solo se administra desde el panel o con service role.

create policy "ver mi grupo" on public.grupos
  for select to authenticated
  using (id = (select public.mi_grupo()));

create policy "ver perfiles de mi grupo" on public.perfiles
  for select to authenticated
  using (grupo_id = (select public.mi_grupo()));

create policy "editar mi perfil" on public.perfiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and grupo_id = (select public.mi_grupo()));

-- Devuelve el perfil del usuario; si no existe y su correo está invitado, lo crea.
-- Devuelve null si el correo no está en la lista.
create function public.reclamar_invitacion()
returns public.perfiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfiles;
  v_email text := lower(auth.jwt() ->> 'email');
  v_meta jsonb := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  v_grupo uuid;
begin
  if auth.uid() is null then
    return null;
  end if;

  select * into v_perfil from public.perfiles where id = auth.uid();
  if found then
    return v_perfil;
  end if;

  select grupo_id into v_grupo from public.invitados where email = v_email;
  if v_grupo is null then
    return null;
  end if;

  insert into public.perfiles (id, grupo_id, nombre, avatar_url)
  values (
    auth.uid(),
    v_grupo,
    coalesce(v_meta ->> 'full_name', v_meta ->> 'name', split_part(v_email, '@', 1)),
    v_meta ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  select * into v_perfil from public.perfiles where id = auth.uid();
  return v_perfil;
end;
$$;

revoke execute on function public.mi_grupo() from public, anon;
revoke execute on function public.reclamar_invitacion() from public, anon;
grant execute on function public.mi_grupo() to authenticated;
grant execute on function public.reclamar_invitacion() to authenticated;
