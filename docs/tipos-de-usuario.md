# Tipos de usuario y permisos

Este documento define los tipos de usuario del sistema y los permisos acordados.

## Regla general de username

Todos los usuarios deben autenticarse con este patron:

- `[nombre]@gobiernodecanarias.org`

Ejemplos validos:

- `admin@gobiernodecanarias.org`
- `prospector.consejeria@gobiernodecanarias.org`
- `prospector.centro@gobiernodecanarias.org`
- `tutor@gobiernodecanarias.org`

## Tipos de usuario

### 1) Admin

Permisos:

- Puede realizar todas las acciones.
- Puede ver, crear, editar y eliminar cualquier registro.
- No tiene restricciones por propiedad del registro ni por familia profesional.

### 2) Prospector de la consejeria

Permisos:

- Puede ver toda la informacion.
- Puede crear y editar todos los registros.
- Solo puede eliminar registros creados por el mismo usuario.

Regla de eliminacion:

- Si `created_by` del registro coincide con su `user_id`, puede eliminar.
- Si no coincide, no puede eliminar.

### 3) Prospector del centro educativo

Permisos:

- Solo lectura.
- Puede ver informacion, pero no puede crear, editar ni eliminar.

### 4) Tutor

Permisos:

- Solo lectura.
- Solo puede ver contactos de su familia profesional asignada.
- Solo puede ver la pestana de Contactos.
- No puede acceder a las otras pestanas funcionales (por ejemplo, Empresas u Organizaciones).
- No puede crear, editar ni eliminar.

## Resumen rapido de capacidades

| Tipo de usuario | Ver | Crear | Editar | Eliminar | Alcance |
|---|---|---|---|---|---|
| Admin | Si | Si | Si | Si | Todo |
| Prospector consejeria | Si | Si | Si | Solo propios | Todo |
| Prospector centro educativo | Si | No | No | No | Todo (solo lectura) |
| Tutor | Si | No | No | No | Solo Contactos de su familia |

## Modelo de datos recomendado para usuarios

Para mantener coherencia en base de datos:

- `auth.users` es la fuente de verdad de identidad/autenticacion.
- `profiles` guarda datos de aplicacion (rol, nombre, familia profesional, etc.).
- `profiles.user_id` debe referenciar un `auth.users.id` existente.

## Trazabilidad recomendada en entidades

Para que los permisos funcionen correctamente en borrado por propiedad:

- `created_by`: usuario que creo el registro.
- `updated_by`: usuario que actualizo el registro por ultima vez.
- En interacciones, `user_id` debe estar informado.

Sin estos campos completos no se puede aplicar correctamente la regla de "solo elimina lo que creo".
