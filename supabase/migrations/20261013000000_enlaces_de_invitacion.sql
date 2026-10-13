-- Enlaces de invitación: quien entra con un código vigente queda en el grupo.
-- La lista por correo (invitados) sigue funcionando como antes.

create table public.invitaciones (
  codigo text primary key default replace(gen_random_uuid()::text, '-', ''),
  grupo_id uuid not null references public.grupos (id) on delete cascade,
  creado_por uuid not null references public.perfiles (id) on delete cascade,
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null default now() + interval '7 days',
  anulada boolean not null default false,
  usos int not null default 0
);

create index invitaciones_grupo_id_idx on public.invitaciones (grupo_id);

alter table public.invitaciones enable row level security;

create policy "ver invitaciones de mi grupo" on public.invitaciones
  for select to authenticated
  using (grupo_id = (select public.mi_grupo()));

create policy "crear invitaciones para mi grupo" on public.invitaciones
  for insert to authenticated
  with check (grupo_id = (select public.mi_grupo()) and creado_por = (select auth.uid()));

create policy "anular invitaciones de mi grupo" on public.invitaciones
  for update to authenticated
  using (grupo_id = (select public.mi_grupo()))
  with check (grupo_id = (select public.mi_grupo()));

-- Desde la app solo se puede anular; ni alargar la vigencia ni cambiar el código.
-- El código y la fecha de vencimiento los pone siempre la base.
revoke insert, update on public.invitaciones from authenticated, anon;
grant insert (grupo_id, creado_por) on public.invitaciones to authenticated;
grant update (anulada) on public.invitaciones to authenticated;

-- Ahora acepta un código de invitación además del correo en la lista.
drop function public.reclamar_invitacion();

create function public.reclamar_invitacion(p_codigo text default null)
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

  if v_grupo is null and p_codigo is not null then
    update public.invitaciones
    set usos = usos + 1
    where codigo = p_codigo and not anulada and expira_en > now()
    returning grupo_id into v_grupo;
  end if;

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

revoke execute on function public.reclamar_invitacion(text) from public, anon;
grant execute on function public.reclamar_invitacion(text) to authenticated;
