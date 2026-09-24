/* ============================================================
   Módulo: Directorio
   ============================================================ */

/* ---------------- directorio ---------------- */
function crearDirectorio(ev){
  ev.preventDefault();
  const obj = {
    canal: document.getElementById('di-canal').value,
    responsable: document.getElementById('di-responsable').value,
    tipo: document.getElementById('di-tipo').value,
    contacto: document.getElementById('di-contacto').value,
  };
  Data.addDirectorio(obj).then(()=>{ toast('Contacto agregado al directorio.'); ev.target.reset(); });
}
function renderDirectorio(){
  const tbl = document.getElementById('tabla-directorio');
  const filas = state.directorio.map(d=>'<tr><td>'+d.canal+'</td><td>'+d.responsable+'</td><td><span class="pill muted">'+d.tipo+'</span></td><td class="mono">'+d.contacto+'</td></tr>').join('');
  tbl.innerHTML = '<thead><tr><th>Área / motivo</th><th>Responsable</th><th>Canal</th><th>Contacto</th></tr></thead><tbody>'+(filas||'<tr><td colspan="4" class="empty-msg">Sin contactos registrados.</td></tr>')+'</tbody>';
}
