-- "Quiero ir" también puede ser privado: solo lo ve quien lo guardó,
-- y un lugar que solo tiene pendientes privados no se muestra al resto del grupo.

alter table public.pendientes add column privado boolean not null default false;

-- Una recomendación es entre dos personas: nunca es privada.
alter table public.pendientes
  add constraint pendientes_recomendacion_publica check (recomendado_por is null or not privado);

drop policy "ver pendientes de mi grupo" on public.pendientes;
create policy "ver pendientes de mi grupo" on public.pendientes
  for select to authenticated
  using (
    (not privado or usuario_id = (select auth.uid()))
    and exists (
      select 1 from public.lugares l
      where l.id = lugar_id and l.grupo_id = (select public.mi_grupo())
    )
  );

-- Cada quien puede volver privado o público lo suyo.
create policy "cambiar mis pendientes" on public.pendientes
  for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

revoke update on public.pendientes from authenticated, anon;
grant update (privado) on public.pendientes to authenticated;

-- Los pendientes privados ya no hacen visible el lugar.
create or replace function public.lugar_publico(p_lugar uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.resenas r where r.lugar_id = p_lugar and not r.privada)
      or exists (select 1 from public.pendientes q where q.lugar_id = p_lugar and not q.privado)
$$;
