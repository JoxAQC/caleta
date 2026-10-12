-- Datos para el stack local (supabase db reset). En producción, invita desde el SQL editor (ver README).
insert into public.grupos (id, nombre)
values ('00000000-0000-0000-0000-000000000001', 'La mancha');

-- Usuarios del login demo (app/utils/demo.ts).
insert into public.invitados (email, grupo_id) values
  ('ana@caleta.local', '00000000-0000-0000-0000-000000000001'),
  ('beto@caleta.local', '00000000-0000-0000-0000-000000000001'),
  ('caro@caleta.local', '00000000-0000-0000-0000-000000000001'),
  ('dani@caleta.local', '00000000-0000-0000-0000-000000000001');
