/* ============================================================
   Módulo: Nómina
   ============================================================ */

/* ---------------- nomina ---------------- */
function renderNomina(){
  const empId = document.getElementById('nomina-empleado').value;
  const ym = document.getElementById('nomina-mes').value;
  const cont = document.getElementById('nomina-resultado');
  if(!empId){ cont.innerHTML = '<div class="empty-msg card">Selecciona un colaborador para ver su recibo.</div>'; return; }
  const emp = state.empleados.find(e=>e.id===empId);
  const jornadas = state.eventos.filter(e=> e.fecha.startsWith(ym) && e.estado!=='Cancelado' && (e.colaboradores||[]).some(c=>c.empleadoId===empId));
  jornadas.sort((a,b)=>a.fecha.localeCompare(b.fecha));
  let total = 0;
  const filas = jornadas.map(e=>{
    const colab = e.colaboradores.find(c=>c.empleadoId===empId);
    const t = calcularTotal(e, colab);
    total += t;
    return '<tr><td>'+fmtFecha(e.fecha)+'</td><td>'+e.empresa+'</td><td>'+e.tipoEventoNombre+(colab.esEncargado?' · encargado':'')+'</td><td><span class="pill '+(colab.estadoPago==='Pagado'?'ok':'pend')+'">'+colab.estadoPago+'</span></td><td class="mono" style="text-align:right;">'+fmtCOP(t)+'</td></tr>';
  }).join('');

  cont.innerHTML = '<div class="nomina-total-box">'
    + '<div class="stat"><div class="n">'+jornadas.length+'</div><div class="l">Eventos en el periodo</div></div>'
    + '<div class="stat"><div class="n">'+fmtCOP(total)+'</div><div class="l">Total a pagar</div></div>'
    + '</div>'
    + '<div class="tbl-wrap card"><table class="data"><thead><tr><th>Fecha</th><th>Empresa</th><th>Servicio</th><th>Estado pago</th><th style="text-align:right;">Total jornada</th></tr></thead><tbody>'
    + (filas || '<tr><td colspan="5" class="empty-msg">'+emp.nombre+' no tiene jornadas registradas en este periodo.</td></tr>')
    + '</tbody></table></div>';
}
