# Prospectors App


Aplicación web para la gestión de prospección de empresas y contactos en el contexto de Formación Profesional.


## Objetivo del proyecto


Este proyecto forma parte de un trabajo académico del curso de adaptación al Grado en Ingeniería Informática.
Su objetivo es implementar una aplicación realista, con control de roles, para gestionar:


- Grupos empresariales (`/organizations`)
- Empresas (`/enterprise`)
- Contactos e interacciones (`/contacts`)


La app permite simular diferentes perfiles de usuario (admin, prospector y tutor) y validar reglas de permisos sobre lectura, escritura y borrado.


## Stack técnico


- Next.js 16 (App Router)
- React 19
- Supabase (PostgreSQL + Auth)
- TypeScript
- Tailwind CSS


## Requisitos previos


- Git (Control de versiones)
- Node.js 20 o superior
- pnpm (recomendado) o npm
- Proyecto creado en Supabase


## Instalación local


1. Instala dependencias:


```bash
pnpm install
```


Si prefieres npm:


```bash
npm install
```


2. Crea el archivo `.env.local` en la raíz del proyecto con estas variables:


```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_publishable_key
```


Puedes obtener ambas en Supabase: `Project Settings -> API`.


3. Arranca el entorno de desarrollo:


```bash
pnpm dev
```


4. Abre `http://localhost:3000`.


## Crear tu propia base de datos en Supabase (desde cero)


### 1) Crear proyecto


1. Entra en https://supabase.com y crea un proyecto nuevo.
2. Espera a que la instancia esté activa.


### 2) Crear el esquema


1. Abre `SQL Editor` en Supabase.
2. Copia el contenido de `schema.sql` de este repositorio.
3. Ejecuta el script completo.


Esto crea tipos, tablas, índices, triggers y claves foráneas del proyecto.


### 3) Crear usuarios en Auth


En `Authentication -> Users`, crea estos 4 usuarios manualmente:


- `admin@gobiernodecanarias.org`
- `prospector.consejeria@gobiernodecanarias.org`
- `prospector.centro@gobiernodecanarias.org`
- `tutor@gobiernodecanarias.org`


Guarda los UUID de cada usuario, porque los vas a usar en el siguiente paso.


### 4) Crear perfiles y roles de aplicación


Ejecuta este SQL para crear o actualizar perfiles:


```sql
insert into public.professional_family (code, name)
values ('INF', 'Informatica y Comunicaciones')
on conflict (code) do nothing;


insert into public.profiles (user_id, full_name, role)
select id, 'Administrador', 'admin'::public.user_role
from auth.users
where email = 'admin@gobiernodecanarias.org'
on conflict (user_id) do update
set full_name = excluded.full_name,
   role = excluded.role;


insert into public.profiles (user_id, full_name, role)
select id, 'Prospector consejeria', 'prospector'::public.user_role
from auth.users
where email = 'prospector.consejeria@gobiernodecanarias.org'
on conflict (user_id) do update
set full_name = excluded.full_name,
   role = excluded.role;


insert into public.profiles (user_id, full_name, role)
select id, 'Prospector centro', 'prospector'::public.user_role
from auth.users
where email = 'prospector.centro@gobiernodecanarias.org'
on conflict (user_id) do update
set full_name = excluded.full_name,
   role = excluded.role;


insert into public.profiles (user_id, full_name, role, professional_family_id)
select
 u.id,
 'Tutor',
 'tutor'::public.user_role,
 pf.id
from auth.users u
cross join lateral (
 select id from public.professional_family where code = 'INF' limit 1
) pf
where u.email = 'tutor@gobiernodecanarias.org'
on conflict (user_id) do update
set full_name = excluded.full_name,
   role = excluded.role,
   professional_family_id = excluded.professional_family_id;
```


### 5) Sincronizar login fake con los UUID reales


La app usa autenticación de desarrollo basada en cookie (`lib/fake-auth.ts`), con credenciales fijas.


Debes sustituir los `userId` del objeto `CREDENTIALS` por los UUID reales que te dio Supabase en `Authentication -> Users`.


Si no haces este paso, podrás iniciar sesión, pero algunas operaciones de escritura pueden fallar por claves foráneas (`created_by`, `updated_by`, `user_id`).


### 6) (Opcional) Cargar datos iniciales


Con solo `schema.sql` la app arranca y funciona, pero estará casi vacía.
Puedes insertar datos de prueba en tablas como:


- `organizations`
- `enterprises`
- `contacts`
- `interactions`


## Credenciales de acceso en desarrollo


Estas credenciales las valida `lib/fake-auth.ts`:


- `admin@gobiernodecanarias.org / admin1234`
- `prospector.consejeria@gobiernodecanarias.org / prospector1234`
- `prospector.centro@gobiernodecanarias.org / centro1234`
- `tutor@gobiernodecanarias.org / tutor1234`


## Documentación adicional


- `docs/documentacion-aplicacion.md`: casos de uso y comportamiento funcional.
- `docs/tipos-de-usuario.md`: definición de roles y permisos.
- `docs/arquitectura-del-proyecto.md`: arquitectura técnica y flujo por capas.
- `app-plan.md`: plan técnico de implementación para filtros de contactos.



# COMO LEVANTAR EL PROYECTO EN LOCAL

## Requisitos

- Docker Desktop encendido
- Supabase CLI instalada
- pnpm instalado

## Pasos minimos

1. Instalar dependencias:

bash
pnpm install


2. Levantar todo en local (Supabase + reset DB + seed + app):

bash
pnpm dev:local


Con ese comando se hace automaticamente:

- Inicio de Supabase en Docker
- Reset de base de datos local
- Aplicacion de migraciones
- Carga de datos desde supabase/seed.sql
- Generacion/actualizacion de .env.local
- Arranque de Next.js

## Comandos utiles

Parar Supabase local:

bash
pnpm supabase:stop


Ejecutar solo la app (sin reset de base de datos):

bash
pnpm dev


## Credenciales de prueba

- admin@gobiernodecanarias.org / admin1234
- prospector.consejeria@gobiernodecanarias.org / prospector1234
- prospector.centro@gobiernodecanarias.org / centro1234
- tutor@gobiernodecanarias.org / tutor1234

## Nota importante

pnpm dev:local siempre restaura la data semilla en cada ejecucion.
Si haces cambios manuales en la base de datos local, se perderan al volver a ejecutar ese comando.
