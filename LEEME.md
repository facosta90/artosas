# Arto Operaciones — inicio de sesión y roles

## Qué cambia
- Lo primero que aparece es el **inicio de sesión** (cédula + contraseña). Sin sesión no se ve nada.
- **Gerente**: ve todas las pestañas y puede editar todo.
- **Empleado**: solo **Mi Jornada, Calendario y Eventos**.
  - Calendario y Eventos son de consulta: ve toda la programación, no puede crear, editar ni cancelar.
  - De los pagos solo ve el suyo. De los compañeros ve el nombre y si es encargado.
  - En Mi Jornada registra su llegada, salida, comprobante de transporte y momentos.
- La protección está en la base de datos (Supabase), no solo en la pantalla.

## Cómo ponerlo en marcha (en este orden)
1. **Supabase → SQL Editor**: pegar y ejecutar `supabase/01_roles_y_seguridad.sql`.
   Reemplaza las reglas de acceso de las 6 tablas y crea la lista de gerentes.
2. El gerente crea su cuenta en el aplicativo si aún no la tiene ("Regístrate").
3. **Supabase → SQL Editor**: abrir `supabase/02_agregar_gerente.sql`, cambiar `0000000000`
   por la cédula del gerente y ejecutar. Repetir por cada gerente.
4. Subir al repositorio los archivos de la app (`index.html`, `css/`, `js/`).
   La carpeta `supabase/` es solo para guardar los SQL; no hace falta publicarla.

Entre el paso 1 y el 3 nadie ve las pestañas de gestión. Conviene hacer los tres seguidos.

## Cómo entra un empleado
1. El gerente lo registra en la pestaña **Empleados** con su número de cédula.
2. El empleado abre el aplicativo, elige "Regístrate" y crea su contraseña con esa misma cédula.
Si alguien crea una cuenta con una cédula que el gerente no ha registrado, entra pero no ve ningún dato.

## Archivos
- `index.html` — pantalla de inicio de sesión + aplicativo
- `js/modules/sesion.js` — **nuevo**: sesión, rol y qué pestañas se muestran
- `js/modules/auth.js` — iniciar sesión y registrarse
- `js/data/api.js` — carga de datos según el rol
- `js/data/data.js`, `js/modules/eventos.js`, `js/modules/mijornada.js`, `js/app.js`, `js/state.js`, `css/styles.css` — ajustes
- `supabase/01_roles_y_seguridad.sql`, `supabase/02_agregar_gerente.sql` — **nuevos**

## Orden de carga de scripts (importante)
config → utils → state → data/* → calendario → eventos → **sesion** → auth → resto de módulos → app.js
