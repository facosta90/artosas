-- ============================================================
-- Arto Operaciones — roles y seguridad (gerente / empleado)
-- Pegar COMPLETO en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez.
--
-- Qué hace:
--   1. Crea la tabla "administradores" (lista de gerentes; solo se
--      modifica desde Supabase).
--   2. REEMPLAZA las reglas de acceso (RLS) de las 6 tablas:
--        gerente  -> ve y edita todo
--        empleado -> su propia ficha, tipos de evento, configuración
--                    de bonos y la programación (sin pagos ajenos)
--        sin sesión -> nada
--   3. Crea las funciones que usa la app para el empleado.
--
-- IMPORTANTE: justo después ejecuta 02_agregar_gerente.sql.
-- Hasta que haya al menos un gerente, nadie ve las pestañas de
-- administración.
-- ============================================================

begin;

-- ---------- 1) Lista de gerentes ----------
create table if not exists public.administradores (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  cedula    text,
  nombre    text,
  creado_en timestamptz not null default now()
);
alter table public.administradores enable row level security;
revoke all on public.administradores from anon, authenticated;
grant select on public.administradores to authenticated;
drop policy if exists "cada gerente ve su propia fila" on public.administradores;
create policy "cada gerente ve su propia fila" on public.administradores
  for select to authenticated using (user_id = auth.uid());

-- ---------- 2) Funciones de identidad ----------
-- ¿Quien tiene la sesión es gerente?
create or replace function public.es_gerente() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.administradores where user_id = auth.uid());
$$;

-- Cédula de quien tiene la sesión (la app usa <cédula>@colaboradores.arto-app.co como usuario).
create or replace function public.mi_cedula() returns text
language sql stable as $$
  select case
    when coalesce(auth.jwt()->>'email','') like '%@colaboradores.arto-app.co'
    then nullif(split_part(auth.jwt()->>'email','@',1), '')
  end;
$$;

-- ---------- 3) Reglas de acceso de las tablas ----------
alter table public.empleados add column if not exists tiene_cuenta boolean default false;

-- se eliminan las reglas anteriores de estas 6 tablas
do $$
declare r record;
begin
  for r in select tablename, policyname from pg_policies
           where schemaname = 'public'
             and tablename in ('empleados','tipos_evento','eventos','gastos','directorio','config')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.empleados    enable row level security;
alter table public.tipos_evento enable row level security;
alter table public.eventos      enable row level security;
alter table public.gastos       enable row level security;
alter table public.directorio   enable row level security;
alter table public.config       enable row level security;

-- Gerente: todo, en las 6 tablas
create policy "gerente todo" on public.empleados    for all to authenticated using (public.es_gerente()) with check (public.es_gerente());
create policy "gerente todo" on public.tipos_evento for all to authenticated using (public.es_gerente()) with check (public.es_gerente());
create policy "gerente todo" on public.eventos      for all to authenticated using (public.es_gerente()) with check (public.es_gerente());
create policy "gerente todo" on public.gastos       for all to authenticated using (public.es_gerente()) with check (public.es_gerente());
create policy "gerente todo" on public.directorio   for all to authenticated using (public.es_gerente()) with check (public.es_gerente());
create policy "gerente todo" on public.config       for all to authenticated using (public.es_gerente()) with check (public.es_gerente());

-- Empleado: solo lectura de su propia ficha
create policy "empleado ve su ficha" on public.empleados
  for select to authenticated using (id::text = public.mi_cedula());

-- Empleado: lectura de tipos de evento y de la configuración de bonos (para calcular su propio pago)
create policy "sesion lee tipos"  on public.tipos_evento for select to authenticated using (true);
create policy "sesion lee config" on public.config       for select to authenticated using (true);

-- eventos, gastos y directorio: el empleado NO lee las tablas directamente.

-- ---------- 4) Funciones para el empleado ----------

-- Programación para el empleado: todos los eventos, pero
--   * de los compañeros solo nombre y si es encargado
--   * tarifas y bonos del evento solo si él está asignado
create or replace function public.eventos_para_mi() returns setof public.eventos
language plpgsql stable security definer set search_path = public as $$
declare v_ced text := public.mi_cedula();
begin
  if v_ced is null or not exists (select 1 from public.empleados where id::text = v_ced) then
    return;  -- la cédula no está en la lista de colaboradores: no ve nada
  end if;
  return query
  select (jsonb_populate_record(null::public.eventos,
            to_jsonb(e)
            || jsonb_build_object('colaboradores', x.cols)
            || case when x.mio then '{}'::jsonb
                    else jsonb_build_object('tarifa_base',0,'refrigerio1',0,'refrigerio2',0,'subsidio_transporte',0) end
         )).*
  from public.eventos e
  cross join lateral (
    select coalesce(jsonb_agg(
             case when c->>'empleadoId' = v_ced then c
                  else jsonb_build_object('empleadoId', c->'empleadoId', 'nombre', c->'nombre', 'esEncargado', coalesce(c->'esEncargado','false'::jsonb))
             end order by ord), '[]'::jsonb) as cols,
           coalesce(bool_or(c->>'empleadoId' = v_ced), false) as mio
    from jsonb_array_elements(
           case when jsonb_typeof(to_jsonb(e)->'colaboradores') = 'array' then to_jsonb(e)->'colaboradores' else '[]'::jsonb end
         ) with ordinality as t(c, ord)
  ) x
  order by e.fecha;
end $$;

-- El empleado registra SOLO lo suyo en un evento donde está asignado:
-- hora de llegada, hora de salida, comprobante de transporte y momentos destacados.
create or replace function public.actualizar_mi_jornada(p_evento text, p_patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ced  text := public.mi_cedula();
  v_cols jsonb;
  v_estado text;
  k text;
begin
  if v_ced is null then raise exception 'Sesión no válida.'; end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then raise exception 'Datos no válidos.'; end if;
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('horaLlegadaReal','horaFinReal','comprobanteTransporte','momentosDestacados') then
      raise exception 'No tienes permiso para cambiar "%".', k;
    end if;
  end loop;

  select to_jsonb(e)->'colaboradores', to_jsonb(e)->>'estado' into v_cols, v_estado
  from public.eventos e where e.id::text = p_evento for update;
  if not found then raise exception 'Evento no encontrado.'; end if;
  if v_estado = 'Cancelado' then raise exception 'El evento está cancelado.'; end if;
  if jsonb_typeof(v_cols) <> 'array'
     or not exists (select 1 from jsonb_array_elements(v_cols) c where c->>'empleadoId' = v_ced) then
    raise exception 'No estás asignado a este evento.';
  end if;

  update public.eventos e
  set colaboradores = (
    select jsonb_agg(case when c->>'empleadoId' = v_ced then c || p_patch else c end order by ord)
    from jsonb_array_elements(v_cols) with ordinality as t(c, ord))
  where e.id::text = p_evento;
end $$;

-- Al entrar, marca la ficha del colaborador como "con cuenta" y guarda su teléfono si lo dio.
-- No crea fichas: los colaboradores los registra el gerente en la pestaña Empleados.
create or replace function public.registrar_mi_cuenta(p_telefono text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_ced text := public.mi_cedula();
begin
  if v_ced is null then return false; end if;
  update public.empleados
  set tiene_cuenta = true,
      telefono = coalesce(nullif(trim(p_telefono), ''), telefono)
  where id::text = v_ced;
  return found;
end $$;

revoke execute on function public.es_gerente()                        from public, anon;
revoke execute on function public.mi_cedula()                         from public, anon;
revoke execute on function public.eventos_para_mi()                   from public, anon;
revoke execute on function public.actualizar_mi_jornada(text, jsonb)  from public, anon;
revoke execute on function public.registrar_mi_cuenta(text)           from public, anon;
grant  execute on function public.es_gerente()                        to authenticated;
grant  execute on function public.mi_cedula()                         to authenticated;
grant  execute on function public.eventos_para_mi()                   to authenticated;
grant  execute on function public.actualizar_mi_jornada(text, jsonb)  to authenticated;
grant  execute on function public.registrar_mi_cuenta(text)           to authenticated;

commit;

-- avisa a la API de Supabase que hay funciones nuevas
notify pgrst, 'reload schema';
