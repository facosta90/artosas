/* ============================================================
   Módulo: Empleados (crear, editar, activar / desactivar)
   ============================================================ */

/* ---------------- empleados ---------------- */
function empleadosActivos(){ return state.empleados.filter(e=>e.activo!==false); }

function crearEmpleado(ev){
  ev.preventDefault();
  const id = document.getElementById('em-cedula').value.trim();
  if(!id){ toast('La cédula es obligatoria.'); return; }
  if(state.empleados.some(e=>e.id===id)){ toast('Ya existe un colaborador con esa cédula.'); return; }
  const obj = {
    id, nombre: document.getElementById('em-nombre').value.trim(),
    telefono: document.getElementById('em-telefono').value.trim(),
    correo: document.getElementById('em-correo').value.trim(),
    cuentaPago: document.getElementById('em-cuentaPago').value,
    numeroCuenta: document.getElementById('em-numeroCuenta').value.trim(),
    eps: document.getElementById('em-eps').value.trim(),
    talla: document.getElementById('em-talla').value,
    encargado: document.getElementById('em-encargado').checked,
    docs: {
      cedula: document.getElementById('em-doc-cedula').checked,
      contrato: document.getElementById('em-doc-contrato').checked,
      eps: document.getElementById('em-doc-eps').checked,
    },
    tieneCuenta: false,
  };
  // "activo" no se envía al crear: la base lo deja en verdadero por defecto.
  Data.addEmpleado(obj).then(()=>{ toast('Colaborador guardado.'); ev.target.reset(); }).catch(()=>{});
}

function renderEmpleados(){
  const tbl = document.getElementById('tabla-empleados');
  const texto = (document.getElementById('emp-buscar').value||'').toLowerCase().trim();
  const verInactivos = document.getElementById('emp-inactivos').checked;
  const inactivos = state.empleados.filter(e=>e.activo===false).length;
  document.getElementById('emp-inactivos-n').textContent = inactivos ? ' ('+inactivos+')' : '';

  let lista = state.empleados.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(!verInactivos) lista = lista.filter(e=>e.activo!==false);
  if(texto) lista = lista.filter(e=> e.nombre.toLowerCase().includes(texto) || String(e.id).includes(texto) || String(e.telefono||'').includes(texto));

  const filas = lista.map(e=>{
    const docsOk = (e.docs&&e.docs.cedula?1:0)+(e.docs&&e.docs.contrato?1:0)+(e.docs&&e.docs.eps?1:0);
    const acceso = e.tieneCuenta ? '<span class="pill ok">Registrado</span>' : '<span class="pill muted">Sin registrar</span>';
    const inactivo = e.activo===false;
    return '<tr'+(inactivo?' class="fila-inactiva"':'')+'><td>'+esc(e.nombre)
      + (e.encargado?' <span class="pill ok" style="margin-left:.3rem;">encargado</span>':'')
      + (inactivo?' <span class="pill canc" style="margin-left:.3rem;">inactivo</span>':'')+'</td>'
      + '<td class="mono">'+esc(e.id)+'</td>'
      + '<td>'+(esc(e.telefono) || '<span style="color:var(--danger);">sin registrar</span>')+'</td>'
      + '<td>'+esc(e.cuentaPago)+' <span class="mono" style="color:var(--ink-soft);">'+esc(e.numeroCuenta||'')+'</span></td>'
      + '<td>'+(esc(e.eps)||'—')+'</td><td>'+esc(e.talla)+'</td>'
      + '<td>'+docsOk+'/3 <span style="color:var(--ink-soft);">docs</span></td>'
      + '<td>'+acceso+(e.correo ? '' : ' <span class="pill pend" title="Sin correo no puede recuperar la contraseña por su cuenta">sin correo</span>')+'</td>'
      + '<td><div class="acciones-fila">'
      + '<button class="btn small" onclick="abrirEditarEmpleado(\''+esc(e.id)+'\')">Editar</button>'
      + (e.tieneCuenta ? '<button class="btn small" onclick="abrirReinicioClave(\''+esc(e.id)+'\')">Contraseña</button>' : '')
      + '</div></td></tr>';
  }).join('');
  tbl.innerHTML = '<thead><tr><th>Nombre</th><th>Cédula</th><th>Teléfono</th><th>Cuenta</th><th>EPS</th><th>Talla</th><th>Documentos</th><th>Acceso</th><th>Acciones</th></tr></thead><tbody>'
    + (filas||'<tr><td colspan="9" class="empty-msg">'+(state.empleados.length?'Ningún colaborador coincide con la búsqueda.':'Sin colaboradores registrados.')+'</td></tr>')+'</tbody>';
}

/* ---------------- editar ---------------- */
function opcionesSelect(lista, actual){
  const vals = lista.includes(actual) || !actual ? lista : lista.concat([actual]);
  return vals.map(v=>'<option'+(v===actual?' selected':'')+'>'+esc(v)+'</option>').join('');
}

function abrirEditarEmpleado(id){
  if(!esGerente()) return;
  const e = state.empleados.find(x=>x.id===id);
  if(!e) return;
  const docs = e.docs||{};
  const inactivo = e.activo===false;
  const chk = (idc, on, txt)=>'<label class="check-row check-linea"><input type="checkbox" id="'+idc+'"'+(on?' checked':'')+'> '+txt+'</label>';
  abrirModal('Editar colaborador',
    '<form onsubmit="guardarEmpleado(event,\''+esc(e.id)+'\')">'
    + '<div class="grid-3">'
    + '<div class="field"><label>Cédula</label><input type="text" value="'+esc(e.id)+'" disabled title="La cédula es el usuario de acceso; no se puede cambiar."></div>'
    + '<div class="field"><label>Nombre completo</label><input type="text" id="ee-nombre" value="'+esc(e.nombre)+'" required></div>'
    + '<div class="field"><label>Teléfono (WhatsApp)</label><input type="text" id="ee-telefono" value="'+esc(e.telefono)+'" placeholder="3001234567"></div>'
    + '</div><div class="grid-3">'
    + '<div class="field"><label>Medio de pago</label><select id="ee-cuentaPago">'+opcionesSelect(['Nequi','Daviplata','Cuenta bancaria'], e.cuentaPago)+'</select></div>'
    + '<div class="field"><label>Número de cuenta / llave</label><input type="text" id="ee-numeroCuenta" value="'+esc(e.numeroCuenta)+'"></div>'
    + '<div class="field"><label>EPS</label><input type="text" id="ee-eps" value="'+esc(e.eps)+'"></div>'
    + '</div><div class="grid-3">'
    + '<div class="field"><label>Talla de uniforme</label><select id="ee-talla">'+opcionesSelect(['XS','S','M','L','XL'], e.talla)+'</select></div>'
    + '<div class="field"><label>Correo (recuperar contraseña)</label><input type="email" id="ee-correo" value="'+esc(e.correo)+'" placeholder="correo@ejemplo.com"></div>'
    + '<div class="field" style="align-self:end;">'+chk('ee-encargado', e.encargado, 'Habilitado como encargado')+'</div>'
    + '</div>'
    + '<div class="field"><label>Documentos adjuntos en archivo</label><div class="checks-fila">'
    + chk('ee-doc-cedula', docs.cedula, 'Cédula')+chk('ee-doc-contrato', docs.contrato, 'Contrato')+chk('ee-doc-eps', docs.eps, 'Certificado EPS')
    + '</div></div>'
    + '<p class="nota-modal">La cédula no se puede cambiar porque es el usuario con el que la persona entra. Si quedó mal escrita, desactiva esta ficha y crea una nueva con la cédula correcta.</p>'
    + '<div class="modal-acciones">'
    + '<button type="button" class="btn '+(inactivo?'':'danger')+'" onclick="cambiarEstadoEmpleado(\''+esc(e.id)+'\')">'+(inactivo?'Reactivar colaborador':'Desactivar colaborador')+'</button>'
    + '<span class="espacio"></span>'
    + '<button type="button" class="btn ghost" onclick="cerrarModal()">Cancelar</button>'
    + '<button type="submit" class="btn primary">Guardar cambios</button>'
    + '</div></form>');
}

function guardarEmpleado(ev, id){
  ev.preventDefault();
  if(!esGerente()) return;
  const nombre = document.getElementById('ee-nombre').value.trim();
  if(!nombre){ toast('El nombre es obligatorio.'); return; }
  const patch = {
    nombre,
    telefono: document.getElementById('ee-telefono').value.trim(),
    correo: document.getElementById('ee-correo').value.trim().toLowerCase(),
    cuentaPago: document.getElementById('ee-cuentaPago').value,
    numeroCuenta: document.getElementById('ee-numeroCuenta').value.trim(),
    eps: document.getElementById('ee-eps').value.trim(),
    talla: document.getElementById('ee-talla').value,
    encargado: document.getElementById('ee-encargado').checked,
    docs: {
      cedula: document.getElementById('ee-doc-cedula').checked,
      contrato: document.getElementById('ee-doc-contrato').checked,
      eps: document.getElementById('ee-doc-eps').checked,
    },
  };
  Data.updateEmpleado(id, patch).then(()=>{ cerrarModal(); toast('Datos de '+nombre+' actualizados.'); }).catch(()=>{});
}

/* Desactivar no borra nada: la persona deja de aparecer para programar y pierde el acceso,
   pero sus eventos y pagos anteriores se conservan. */
function cambiarEstadoEmpleado(id){
  if(!esGerente()) return;
  const e = state.empleados.find(x=>x.id===id);
  if(!e) return;
  const desactivar = e.activo!==false;
  if(desactivar){
    const hoy = todayStr();
    const futuros = state.eventos.filter(ev=> ev.fecha>=hoy && ev.estado!=='Cancelado' && (ev.colaboradores||[]).some(c=>c.empleadoId===id)).length;
    let msg = '¿Desactivar a '+e.nombre+'?\n\nDeja de aparecer para programar eventos y ya no podrá ver la programación ni marcar su jornada. Su historial y sus pagos se conservan.';
    if(futuros) msg += '\n\nOJO: sigue asignado/a a '+futuros+' evento(s) de hoy en adelante. Retíralo/a de esos eventos desde "Editar evento".';
    if(!confirm(msg)) return;
  }
  Data.updateEmpleado(id, {activo: !desactivar}).then(()=>{
    cerrarModal();
    toast(desactivar ? e.nombre+' quedó inactivo/a.' : e.nombre+' quedó activo/a de nuevo.');
  }).catch(err=>{
    if(/activo/i.test((err&&err.message)||'')) toast('⚠ Falta ejecutar en Supabase el archivo 03_paquete1.sql.');
  });
}
