/* ============================================================
   Módulo: Gastos
   ============================================================ */

/* ---------------- gastos ---------------- */
function crearGasto(ev){
  ev.preventDefault();
  const empId = document.getElementById('ga-empleado').value;
  const emp = state.empleados.find(e=>e.id===empId);
  const obj = {
    fecha: document.getElementById('ga-fecha').value,
    empleadoId: empId, empleadoNombre: emp?emp.nombre:'',
    concepto: document.getElementById('ga-concepto').value,
    valor: Number(document.getElementById('ga-valor').value)||0,
    comprobante: document.getElementById('ga-comprobante').value,
    estadoReembolso: 'Pendiente',
  };
  Data.addGasto(obj).then(()=>{ toast('Gasto registrado.'); ev.target.reset(); document.getElementById('ga-fecha').value = todayStr(); });
}
function toggleReembolso(id){
  const g = state.gastos.find(x=>x.id===id);
  Data.updateGasto(id, {estadoReembolso: g.estadoReembolso==='Reembolsado' ? 'Pendiente' : 'Reembolsado'});
}
function renderGastos(){
  const tbl = document.getElementById('tabla-gastos');
  const filas = state.gastos.slice().sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(g=>{
    const cls = g.estadoReembolso==='Reembolsado' ? 'ok' : 'pend';
    return '<tr><td>'+fmtFecha(g.fecha)+'</td><td>'+g.empleadoNombre+'</td><td>'+g.concepto+'</td><td class="mono">'+g.comprobante+'</td>'
      + '<td class="mono" style="text-align:right;">'+fmtCOP(g.valor)+'</td>'
      + '<td><span class="pill '+cls+'">'+g.estadoReembolso+'</span></td>'
      + '<td><button class="btn small" onclick="toggleReembolso(\''+g.id+'\')">Marcar '+(g.estadoReembolso==='Reembolsado'?'pendiente':'reembolsado')+'</button></td></tr>';
  }).join('');
  tbl.innerHTML = '<thead><tr><th>Fecha</th><th>Colaborador</th><th>Concepto</th><th>Comprobante</th><th style="text-align:right;">Valor</th><th>Estado</th><th></th></tr></thead><tbody>'+(filas||'<tr><td colspan="7" class="empty-msg">Sin gastos registrados.</td></tr>')+'</tbody>';
}
