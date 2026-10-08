/* ============================================================
   Utilidades: formatos, toast, ids, localStorage
   ============================================================ */

/* Fecha de hoy en la hora del dispositivo (Colombia), no en UTC: antes, después de las 7 p. m. "hoy" ya era mañana. */
function todayStr(){ const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
/* Texto seguro para insertar en HTML (nombres con comillas, <, &, etc.). */
function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
/* Quincena de una fecha AAAA-MM-DD: Q1 = días 1 a 15, Q2 = día 16 en adelante. */
function quincenaDe(iso){ return Number(String(iso||'').slice(8,10)) <= 15 ? 'Q1' : 'Q2'; }
function nombreMes(ym){ const p = String(ym||'').split('-'); return (MESES[Number(p[1])-1]||'')+' '+(p[0]||''); }
function fmtCOP(n){ n = Number(n)||0; return '$ ' + n.toLocaleString('es-CO'); }
function fmtFecha(iso){
  if(!iso) return '—';
  const [y,m,d] = iso.split('-');
  return d+'/'+m+'/'+y;
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2600);
}
function uid(){ return 'id-' + Math.random().toString(36).slice(2,10) + Date.now().toString(36); }
function nowHHMM(){ const d = new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function safeGetLocal(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
function safeSetLocal(key, val){ try{ localStorage.setItem(key, val); }catch(e){} }
function safeRemoveLocal(key){ try{ localStorage.removeItem(key); }catch(e){} }

/* En celular las tablas se muestran como tarjetas: cada celda necesita saber el nombre de su columna. */
function etiquetarTablas(raiz){
  (raiz||document).querySelectorAll('table.data').forEach(tbl=>{
    const titulos = Array.from(tbl.querySelectorAll('thead th')).map(th=>th.textContent.trim());
    tbl.querySelectorAll('tbody tr').forEach(tr=>{
      Array.from(tr.children).forEach((td,i)=>{ if(!td.hasAttribute('colspan') && td.getAttribute('data-label')!==titulos[i]) td.setAttribute('data-label', titulos[i]||''); });
    });
  });
}
function vigilarTablas(){
  const main = document.querySelector('main');
  if(!main || !window.MutationObserver) return;
  etiquetarTablas(main);
  new MutationObserver(()=>etiquetarTablas(main)).observe(main, {childList:true, subtree:true});
}

/* ---------------- ventana emergente (formularios de edición) ----------------
   Vive fuera de <main>, así el refresco automático de datos no borra lo que se está escribiendo. */
function abrirModal(titulo, html){
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-cuerpo').innerHTML = html;
  document.getElementById('modal-fondo').hidden = false;
  document.body.classList.add('con-modal');
  const m = document.getElementById('modal'); if(m) m.scrollTop = 0;
}
function cerrarModal(){
  document.getElementById('modal-fondo').hidden = true;
  document.getElementById('modal-cuerpo').innerHTML = '';
  document.body.classList.remove('con-modal');
}
function modalAbierto(){ const f = document.getElementById('modal-fondo'); return !!f && !f.hidden; }
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && modalAbierto()) cerrarModal(); });
