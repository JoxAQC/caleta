# Caleta

Reseñas de lugares entre amigos, sobre un mapa de Lima. PWA en Nuxt 4 + Supabase, desplegada en Vercel.

## Desarrollo local

Requiere Docker encendido.

```bash
pnpm install
pnpm db:start          # Supabase local en el puerto 56321
cp .env.example .env   # usa la URL y la clave publishable que imprime db:start
pnpm dev
```

Con `NUXT_PUBLIC_DEMO_LOGIN=true` el login muestra cuatro usuarios demo (Ana, Beto, Caro, Dani)
en lugar de Google. Solo funcionan contra el stack local, donde `supabase/seed.sql` los invita.

- `pnpm db:reset` borra la base local y vuelve a aplicar migraciones y seed.
- `pnpm db:types` regenera `shared/types/database.types.ts` tras cambiar el esquema.

El mapa usa MapLibre con teselas de OpenFreeMap y el buscador de locales usa Photon (OpenStreetMap).
Ninguno necesita clave. Para pasar a Google Places basta reemplazar `app/utils/buscador.ts`.

La nota de voz se convierte en texto y la grabación no se guarda. Con `NUXT_PUBLIC_TRANSCRIPCION=navegador`
se usa el dictado del navegador (sin clave; en iPhone es poco fiable). Con `servidor` se graba, se envía a
`/api/transcribir` y se transcribe con Whisper vía Groq, lo que requiere `NUXT_GROQ_API_KEY`.

## Puesta en marcha (una sola vez)

1. **Supabase**: crea un proyecto, luego aplica el esquema:
   ```bash
   pnpm exec supabase link --project-ref TU_REF
   pnpm db:push
   ```
2. **Google OAuth**: en Google Cloud crea un cliente OAuth "Web" con la URI de redirección
   `https://TU_REF.supabase.co/auth/v1/callback`. Pega el Client ID y el Secret en
   Supabase → Authentication → Providers → Google. Desactiva el proveedor Email.
3. **URLs de retorno**: en Supabase → Authentication → URL Configuration agrega
   `http://localhost:3000/confirm` y `https://TU-DOMINIO.vercel.app/confirm`.
4. **Invitados**: en el SQL editor de Supabase:
   ```sql
   insert into public.grupos (nombre) values ('La mancha') returning id;
   insert into public.invitados (email, grupo_id) values
     ('correo1@gmail.com', 'ID_DEL_GRUPO'),
     ('correo2@gmail.com', 'ID_DEL_GRUPO');
   ```
   Los correos van en minúsculas. Quien entre con un correo fuera de la lista ve una pantalla de "no invitado".
5. **Vercel**: importa el repo y define `SUPABASE_URL` y `SUPABASE_KEY` como variables de entorno.

## Estructura

- `app/` — páginas, componentes y estilos (tokens de marca en `app/assets/css/main.css`).
- `supabase/migrations/` — esquema y políticas RLS.
- `public/logo.svg` — fuente de los íconos; `pnpm icons` los regenera.
