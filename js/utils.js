/* ============================================================
   Utilidades: formatos, toast, ids, localStorage
   ============================================================ */

function todayStr(){ return new Date().toISOString().slice(0,10); }
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
