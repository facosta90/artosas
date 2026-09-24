/* ============================================================
   Mapeo camelCase (app) <-> snake_case (Supabase)
   ============================================================ */

/* ---------------- mapeo camelCase (app) <-> snake_case (Supabase/Postgres) ---------------- */
function fromEventoRow(r){
  return {
    id:r.id, fecha:r.fecha, horaAlistamiento:r.hora_alistamiento||'', horaInicio:r.hora_inicio||'', horaFin:r.hora_fin||'',
    empresa:r.empresa||'', lugar:r.lugar||'', modalidad:r.modalidad||'Presencial', tipoEventoId:r.tipo_evento_id||'', tipoEventoNombre:r.tipo_evento_nombre||'',
    tarifaBase:r.tarifa_base||0, refrigerio1:r.refrigerio1||0, refrigerio2:r.refrigerio2||0, subsidioTransporte:r.subsidio_transporte||0,
    esFestivo:!!r.es_festivo, estado:r.estado||'Programado', observaciones:r.observaciones||'', cambios:r.cambios||[], colaboradores:r.colaboradores||[],
  };
}
function toEventoRow(o){
  const row = {};
  if('fecha' in o) row.fecha = o.fecha;
  if('horaAlistamiento' in o) row.hora_alistamiento = o.horaAlistamiento;
  if('horaInicio' in o) row.hora_inicio = o.horaInicio;
  if('horaFin' in o) row.hora_fin = o.horaFin;
  if('empresa' in o) row.empresa = o.empresa;
  if('lugar' in o) row.lugar = o.lugar;
  if('modalidad' in o) row.modalidad = o.modalidad;
  if('tipoEventoId' in o) row.tipo_evento_id = o.tipoEventoId;
  if('tipoEventoNombre' in o) row.tipo_evento_nombre = o.tipoEventoNombre;
  if('tarifaBase' in o) row.tarifa_base = o.tarifaBase;
  if('refrigerio1' in o) row.refrigerio1 = o.refrigerio1;
  if('refrigerio2' in o) row.refrigerio2 = o.refrigerio2;
  if('subsidioTransporte' in o) row.subsidio_transporte = o.subsidioTransporte;
  if('esFestivo' in o) row.es_festivo = o.esFestivo;
  if('estado' in o) row.estado = o.estado;
  if('observaciones' in o) row.observaciones = o.observaciones;
  if('cambios' in o) row.cambios = o.cambios;
  if('colaboradores' in o) row.colaboradores = o.colaboradores;
  return row;
}
function fromEmpleadoRow(r){
  return {
    id:r.id, nombre:r.nombre||'', telefono:r.telefono||'', correo:r.correo||'', cuentaPago:r.cuenta_pago||'Nequi',
    numeroCuenta:r.numero_cuenta||'', eps:r.eps||'', talla:r.talla||'M', encargado:!!r.encargado,
    docs:r.docs||{cedula:false,contrato:false,eps:false}, tieneCuenta:!!r.tiene_cuenta,
  };
}
function toEmpleadoRow(o){
  const row = {};
  if('id' in o) row.id = o.id;
  if('nombre' in o) row.nombre = o.nombre;
  if('telefono' in o) row.telefono = o.telefono;
  if('correo' in o) row.correo = o.correo;
  if('cuentaPago' in o) row.cuenta_pago = o.cuentaPago;
  if('numeroCuenta' in o) row.numero_cuenta = o.numeroCuenta;
  if('eps' in o) row.eps = o.eps;
  if('talla' in o) row.talla = o.talla;
  if('encargado' in o) row.encargado = o.encargado;
  if('docs' in o) row.docs = o.docs;
  if('tieneCuenta' in o) row.tiene_cuenta = o.tieneCuenta;
  return row;
}
function fromGastoRow(r){
  return {id:r.id, fecha:r.fecha, empleadoId:r.empleado_id, empleadoNombre:r.empleado_nombre||'', concepto:r.concepto||'', valor:r.valor||0, comprobante:r.comprobante||'', estadoReembolso:r.estado_reembolso||'Pendiente'};
}
function toGastoRow(o){
  const row = {};
  if('fecha' in o) row.fecha = o.fecha;
  if('empleadoId' in o) row.empleado_id = o.empleadoId;
  if('empleadoNombre' in o) row.empleado_nombre = o.empleadoNombre;
  if('concepto' in o) row.concepto = o.concepto;
  if('valor' in o) row.valor = o.valor;
  if('comprobante' in o) row.comprobante = o.comprobante;
  if('estadoReembolso' in o) row.estado_reembolso = o.estadoReembolso;
  return row;
}
function fromTipoRow(r){
  return {id:r.id, nombre:r.nombre, tarifaBase:r.tarifa_base||0, refrigerio1:r.refrigerio1||0, refrigerio2:r.refrigerio2||0, subsidioTransporte:r.subsidio_transporte||0};
}
