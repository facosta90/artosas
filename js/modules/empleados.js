/* ============================================================
   Módulo: Empleados
   ============================================================ */

/* ---------------- empleados ---------------- */
function crearEmpleado(ev){
  ev.preventDefault();
  const id = document.getElementById('em-cedula').value.trim();
  if(!id){ toast('La cédula es obligatoria.'); return; }
  if(state.empleados.some(e=>e.id===id)){ toast('Ya existe un colaborador con esa cédula.'); return; }
  const obj = {
    id, nombre: document.getElementById('em-nombre').value,
    telefono: document.getElementById('em-telefono').value,
    correo: document.getElementById('em-correo').value,
    cuentaPago: document.getElementById('em-cuentaPago').value,
    numeroCuenta: document.getElementById('em-numeroCuenta').value,
    eps: document.getElementById('em-eps').value,
    talla: document.getElementById('em-talla').value,
    encargado: document.getElementById('em-encargado').checked,
    docs: {
      cedula: document.getElementById('em-doc-cedula').checked,
      contrato: document.getElementById('em-doc-contrato').checked,
      eps: document.getElementById('em-doc-eps').checked,
    },
    tieneCuenta: false,
  };
  Data.addEmpleado(obj).then(()=>{ toast('Colaborador guardado.'); ev.target.reset(); });
}
function renderEmpleados(){
  const tbl = document.getElementById('tabla-empleados');
  const filas = state.empleados.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre)).map(e=>{
    const docsOk = (e.docs&&e.docs.cedula?1:0)+(e.docs&&e.docs.contrato?1:0)+(e.docs&&e.docs.eps?1:0);
    const acceso = e.tieneCuenta ? '<span class="pill ok">Registrado</span>' : '<span class="pill muted">Sin registrar</span>';
    return '<tr><td>'+e.nombre+(e.encargado?' <span class="pill ok" style="margin-left:.3rem;">encargado</span>':'')+'</td>'
      + '<td class="mono">'+e.id+'</td>'
      + '<td>'+(e.telefono || '<span style="color:var(--danger);">sin registrar</span>')+'</td>'
      + '<td>'+e.cuentaPago+' <span class="mono" style="color:var(--ink-soft);">'+(e.numeroCuenta||'')+'</span></td>'
      + '<td>'+(e.eps||'—')+'</td><td>'+e.talla+'</td>'
      + '<td>'+docsOk+'/3 <span style="color:var(--ink-soft);">docs</span></td>'
      + '<td>'+acceso+'</td></tr>';
  }).join('');
  tbl.innerHTML = '<thead><tr><th>Nombre</th><th>Cédula</th><th>Teléfono</th><th>Cuenta</th><th>EPS</th><th>Talla</th><th>Documentos</th><th>Acceso Mi Jornada</th></tr></thead><tbody>'+(filas||'<tr><td colspan="8" class="empty-msg">Sin colaboradores registrados.</td></tr>')+'</tbody>';
}
