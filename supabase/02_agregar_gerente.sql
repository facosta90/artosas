-- ============================================================
-- Arto Operaciones — agregar un gerente
-- 1. La persona debe haber creado ya su cuenta en el aplicativo
--    (pantalla de inicio de sesión → "Regístrate").
-- 2. Cambia 0000000000 por su número de cédula y dale Run.
-- Repite para cada gerente adicional.
-- ============================================================

insert into public.administradores (user_id, cedula, nombre)
select id, split_part(email,'@',1), raw_user_meta_data->>'nombre'
from auth.users
where email = '0000000000' || '@colaboradores.arto-app.co'
on conflict (user_id) do nothing;

-- Comprobación: debe aparecer la persona en esta lista.
select cedula, nombre, creado_en from public.administradores order by creado_en;

-- Para quitar un gerente:
-- delete from public.administradores where cedula = '0000000000';
