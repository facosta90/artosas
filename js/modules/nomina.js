/* ============================================================
   Módulo: Nómina (por mes o por quincena)
   Q1 = días 1 a 15 · Q2 = día 16 a fin de mes
   ============================================================ */

/* ---------------- nomina ---------------- */
function enPeriodo(fecha, ym, quincena){
  return String(fecha||'').startsWith(ym) && (!quincena || quincenaDe(fecha)===quincena);
}
function textoPeriodo(ym, quincena){
  if(!quincena) return nombreMes(ym)+' (mes completo)';
  const p = ym.split('-'), fin = new Date(Number(p[0]), Number(p[1]), 0).getDate();
  return quincena+' de '+nombreMes(ym)+' ('+(quincena==='Q1' ? 'del 1 al 15' : 'del 16 al '+fin)+')';
}
function verReciboDe(empId){
  document.getElementById('nomina-empleado').value = empId;
  renderNomina();
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderNomina(){
  const empId = document.getElementById('nomina-empleado').value;
  const ym = document.getElementById('nomina-mes').value;
  const q = document.getElementById('nomina-periodo').value;
  const cont = document.getElementById('nomina-resultado');
  const eventos = state.eventos.filter(e=> enPeriodo(e.fecha, ym, q) && e.estado!=='Cancelado').sort((a,b)=>a.fecha.localeCompare(b.fecha));
  if(!empId){ cont.innerHTML = nominaResumen(eventos, ym, q); return; }

  const emp = state.empleados.find(e=>e.id===empId) || {nombre:empId, cuentaPago:'', numeroCuenta:''};
  const jornadas = eventos.filter(e=>(e.colaboradores||[]).some(c=>c.empleadoId===empId));
  let total = 0, pendiente = 0;
  const filas = jornadas.map(e=>{
    const colab = e.colaboradores.find(c=>c.empleadoId===empId);
    const d = desglosePago(e, colab);
    total += d.total;
    if(colab.estadoPago!=='Pagado') pendiente += d.total;
    const notas = [];
    if(colab.esEncargado) notas.push('encargado');
    if(e.esFestivo) notas.push('festivo');
    if(d.horasExtraCant>0) notas.push(fmtHoras(d.horasExtraCant)+' extra');
    if(!d.cumple) notas.push('sin bonificación: no cumplió '+(!d.calc.cumpleHorario?'horario':'uniforme'));
    return '<tr><td>'+fmtFecha(e.fecha)+' <span class="pill muted">'+quincenaDe(e.fecha)+'</span></td>'
      + '<td>'+esc(e.empresa)+'</td>'
      + '<td>'+esc(e.tipoEventoNombre)+(notas.length?' <span class="nota-chica">· '+notas.join(' · ')+'</span>':'')+'</td>'
      + '<td class="mono" style="white-space:nowrap;">'+esc(e.horaAlistamiento||'—')+' – '+esc(e.horaFin||'—')+'</td>'
      + '<td class="mono num">'+fmtCOP(d.tarifa)+'</td>'
      + '<td class="mono num">'+fmtCOP(d.refrigerios)+'</td>'
      + '<td class="mono num">'+fmtCOP(d.transporte)+'</td>'
      + '<td class="mono num">'+fmtCOP(d.bonos)+'</td>'
      + '<td><span class="pill '+(colab.estadoPago==='Pagado'?'ok':'pend')+'">'+esc(colab.estadoPago||'Pendiente')+'</span></td>'
      + '<td class="mono num"><b>'+fmtCOP(d.total)+'</b></td></tr>';
  }).join('');

  cont.innerHTML = '<div class="recibo-cabecera"><div><div class="disp">'+esc(emp.nombre)+'</div>'
    + '<div class="ev-meta">'+esc(textoPeriodo(ym, q))+' · '+esc(emp.cuentaPago||'')+' '+esc(emp.numeroCuenta||'')+'</div></div>'
    + '<div class="acciones-fila">'
    + (pendiente>0 ? '<button class="btn small primary" onclick="marcarPeriodoPagado(\''+esc(empId)+'\')">✓ Marcar periodo como pagado</button>' : '')
    + '<button class="btn small" onclick="verReciboDe(\'\')">← Ver resumen de todos</button></div></div>'
    + '<div class="nomina-total-box">'
    + '<div class="stat"><div class="n">'+jornadas.length+'</div><div class="l">Eventos en el periodo</div></div>'
    + '<div class="stat"><div class="n">'+fmtCOP(total)+'</div><div class="l">Total del periodo</div></div>'
    + '<div class="stat"><div class="n">'+fmtCOP(pendiente)+'</div><div class="l">Pendiente por pagar</div></div>'
    + '</div>'
    + '<div class="tbl-wrap card"><table class="data"><thead><tr><th>Fecha</th><th>Empresa</th><th>Servicio</th><th>Horario</th><th class="num">Tarifa</th><th class="num">Refrigerios</th><th class="num">Transporte</th><th class="num">Bonos</th><th>Estado pago</th><th class="num">Total jornada</th></tr></thead><tbody>'
    + (filas || '<tr><td colspan="10" class="empty-msg">'+esc(emp.nombre)+' no tiene jornadas registradas en este periodo.</td></tr>')
    + '</tbody></table></div>'
    + '<p class="nota-chica" style="margin-top:.6rem;">Bonos = horas extra + encargado + festivo + bono libre. Refrigerios y transporte solo se pagan si cumplió horario y uniforme.</p>';
}

/* Resumen del periodo: una fila por colaborador, para pagar la quincena completa. */
function nominaResumen(eventos, ym, q){
  const porEmp = {};
  eventos.forEach(e=>(e.colaboradores||[]).forEach(c=>{
    const r = porEmp[c.empleadoId] || (porEmp[c.empleadoId] = {id:c.empleadoId, nombre:c.nombre, eventos:0, total:0, pendiente:0});
    const t = calcularTotal(e, c);
    r.eventos++; r.total += t;
    if(c.estadoPago!=='Pagado') r.pendiente += t;
  }));
  const lista = Object.values(porEmp).map(r=>{
    const emp = state.empleados.find(x=>x.id===r.id);
    if(emp) r.nombre = emp.nombre;
    r.cuenta = emp ? (emp.cuentaPago+' '+(emp.numeroCuenta||'')).trim() : '';
    return r;
  }).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  const total = lista.reduce((s,r)=>s+r.total, 0), pendiente = lista.reduce((s,r)=>s+r.pendiente, 0);
  const jornadas = lista.reduce((s,r)=>s+r.eventos, 0);

  const filas = lista.map(r=>'<tr><td>'+esc(r.nombre)+'</td><td class="mono">'+(esc(r.cuenta)||'—')+'</td>'
    + '<td class="mono num">'+r.eventos+'</td>'
    + '<td class="mono num">'+fmtCOP(r.total-r.pendiente)+'</td>'
    + '<td class="mono num">'+fmtCOP(r.pendiente)+'</td>'
    + '<td class="mono num"><b>'+fmtCOP(r.total)+'</b></td>'
    + '<td><button class="btn small" onclick="verReciboDe(\''+esc(r.id)+'\')">Ver recibo →</button></td></tr>').join('');

  return '<div class="recibo-cabecera"><div><div class="disp">Resumen de pagos</div><div class="ev-meta">'+esc(textoPeriodo(ym, q))+'</div></div></div>'
    + '<div class="nomina-total-box">'
    + '<div class="stat"><div class="n">'+eventos.length+'</div><div class="l">Eventos en el periodo</div></div>'
    + '<div class="stat"><div class="n">'+lista.length+'</div><div class="l">Colaboradores con jornadas</div></div>'
    + '<div class="stat"><div class="n">'+fmtCOP(total)+'</div><div class="l">Total del periodo</div></div>'
    + '<div class="stat"><div class="n">'+fmtCOP(pendiente)+'</div><div class="l">Pendiente por pagar</div></div>'
    + '</div>'
    + '<div class="tbl-wrap card"><table class="data"><thead><tr><th>Colaborador</th><th>Cuenta de pago</th><th class="num">Jornadas</th><th class="num">Pagado</th><th class="num">Pendiente</th><th class="num">Total</th><th></th></tr></thead><tbody>'
    + (filas || '<tr><td colspan="7" class="empty-msg">No hay jornadas en este periodo.</td></tr>')
    + (lista.length ? '<tr class="fila-total"><td>Total</td><td></td><td class="mono num">'+jornadas+'</td><td class="mono num">'+fmtCOP(total-pendiente)+'</td><td class="mono num">'+fmtCOP(pendiente)+'</td><td class="mono num"><b>'+fmtCOP(total)+'</b></td><td></td></tr>' : '')
    + '</tbody></table></div>';
}

/* Jornadas (evento + colaborador) del periodo elegido en pantalla. empId vacío = todos. */
function jornadasDelPeriodo(empId){
  const ym = document.getElementById('nomina-mes').value, q = document.getElementById('nomina-periodo').value;
  const lista = [];
  state.eventos.filter(e=> enPeriodo(e.fecha, ym, q) && e.estado!=='Cancelado').sort((a,b)=>a.fecha.localeCompare(b.fecha))
    .forEach(e=>(e.colaboradores||[]).forEach(c=>{ if(!empId || c.empleadoId===empId) lista.push({evento:e, colab:c}); }));
  return {ym, q, lista};
}

/* Marca como pagadas todas las jornadas pendientes de un colaborador en el periodo. */
function marcarPeriodoPagado(empId){
  if(!esGerente()) return;
  const {ym, q, lista} = jornadasDelPeriodo(empId);
  const pendientes = lista.filter(j=>j.colab.estadoPago!=='Pagado');
  if(!pendientes.length){ toast('No hay jornadas pendientes en este periodo.'); return; }
  const total = pendientes.reduce((s,j)=>s+calcularTotal(j.evento, j.colab), 0);
  const emp = state.empleados.find(e=>e.id===empId);
  if(!confirm('¿Marcar como pagadas '+pendientes.length+' jornada(s) de '+(emp?emp.nombre:empId)+' por '+fmtCOP(total)+'?\n\n'+textoPeriodo(ym, q)+'\nLas horas extra y el cumplimiento de horario quedan fijados con los valores de hoy.')) return;
  Data.marcarPagados(pendientes.map(j=>({eventoId:j.evento.id, empleadoId:empId, patch:parchePagado(j.evento, j.colab)})))
    .then(()=>toast(pendientes.length+' jornada(s) marcadas como pagadas.')).catch(()=>{});
}

function imprimirNomina(){ window.print(); }
