/* ============================================================
   Arranque: init, pestañas, ajustes, selects. Se carga al final.
   ============================================================ */

/* ---------------- init ---------------- */
async function init(){
  const configListo = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_URL.indexOf('PEGA_AQUI')===-1
    && CONFIG.SUPABASE_ANON_KEY && CONFIG.SUPABASE_ANON_KEY.indexOf('PEGA_AQUI')===-1;

  if(configListo && window.supabase && window.supabase.createClient){
    try{ sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY); }catch(e){ sb = null; }
  }

  if(sb){
    usandoLocal = false;
    document.getElementById('login-estado').textContent = 'Conectado a la base de datos';
    // Si la sesión se cierra (aquí o en otra pestaña), se vuelve al inicio de sesión.
    sb.auth.onAuthStateChange((event)=>{ if(event==='SIGNED_OUT' && state.miId) limpiarSesionLocal(); });
    let session = null;
    try{ session = (await sb.auth.getSession()).data.session; }catch(e){ session = null; }
    if(session && session.user){ await entrarAlAplicativo(session.user); }
    else{ mostrarPantallaLogin(); }
  }else{
    usandoLocal = true;
    document.getElementById('login-estado').textContent = 'Modo de demostración local';
    document.getElementById('modo-datos').textContent = 'Vista de demostración local — configura Supabase en js/config.js para compartir datos de verdad';
    state.tiposEvento = SEED.tiposEvento.map(x=>({...x}));
    state.empleados = SEED.empleados.map(x=>({...x}));
    state.eventos = SEED.eventos.map(x=>({...x, colaboradores:x.colaboradores.map(c=>({...c, momentosDestacados:[...c.momentosDestacados]}))}));
    state.gastos = SEED.gastos.map(x=>({...x}));
    state.directorio = SEED.directorio.map(x=>({...x}));
    state.config = {...SEED.config};
    // recordar la sesión de demostración al recargar
    const guardado = safeGetLocal('arto_mi_id'), rolGuardado = safeGetLocal('arto_rol');
    if(guardado && rolGuardado==='gerente'){ entrarDemoGerente(); }
    else if(guardado && state.empleados.some(e=>e.id===guardado)){ entrarLocalEmpleado(guardado); }
    else{ mostrarPantallaLogin(); }
  }
}

let dataReadyDone = false;
function onDataReady(){
  dataReadyDone = true;
  poblarSelectsEmpleados();
  poblarSelectTipos();
  document.getElementById('ga-fecha').value = todayStr();
  document.getElementById('nv-fecha').value = todayStr();
  previsualizarTarifa();
}


/* ---------------- tabs ---------------- */
function switchTab(tab){
  if(!puedeVerTab(tab)) tab = 'mijornada';   // un empleado no puede abrir pestañas de gerente
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.panel').forEach(p=>p.hidden = (p.id !== 'tab-'+tab));
  if(tab==='eventos'){
    document.getElementById('eventos-lista-wrap').hidden = !!state.selectedEventId;
    document.getElementById('eventos-detalle-wrap').hidden = !state.selectedEventId;
  }
  renderActiveTab();
}
function renderActiveTab(){
  renderMiniStats();
  switch(state.activeTab){
    case 'mijornada': renderMiJornada(); break;
    case 'calendario': renderCalendario(); break;
    case 'eventos': renderEventos(); renderDetalle(); break;
    case 'empleados': renderEmpleados(); break;
    case 'nomina': renderNomina(); break;
    case 'gastos': renderGastos(); break;
    case 'directorio': renderDirectorio(); break;
  }
}
function renderAll(){ renderActiveTab(); }

function toggleSettings(){
  if(!esGerente()) return;
  const pop = document.getElementById('settings-pop');
  pop.hidden = !pop.hidden;
  if(!pop.hidden){
    document.getElementById('cfg-horaExtra').value = state.config.valorHoraExtra;
    document.getElementById('cfg-bonoEncargado').value = state.config.bonoEncargado;
    document.getElementById('cfg-bonoFestivo').value = state.config.bonoFestivo;
    document.getElementById('cfg-autoHorario').checked = state.config.autoHorario!==false;
    document.getElementById('cfg-tolerancia').value = state.config.toleranciaMin;
    document.getElementById('cfg-bloque').value = String(state.config.extraBloqueMin||60);
  }
}
function guardarConfig(){
  if(!esGerente()) return;
  const obj = {
    valorHoraExtra: Number(document.getElementById('cfg-horaExtra').value)||0,
    bonoEncargado: Number(document.getElementById('cfg-bonoEncargado').value)||0,
    bonoFestivo: Number(document.getElementById('cfg-bonoFestivo').value)||0,
    autoHorario: document.getElementById('cfg-autoHorario').checked,
    toleranciaMin: Math.min(120, Math.max(0, Math.round(Number(document.getElementById('cfg-tolerancia').value)||0))),
    extraBloqueMin: document.getElementById('cfg-bloque').value==='30' ? 30 : 60,
  };
  Data.setConfig(obj).then(()=>{
    document.getElementById('settings-pop').hidden = true;
    toast('Ajustes guardados.');
    renderActiveTab();
  }).catch(()=>{});
}

/* ---------------- mini stats ---------------- */
function renderMiniStats(){
  const ym = state.calYear + '-' + String(state.calMonth+1).padStart(2,'0');
  const nowYm = todayStr().slice(0,7);
  const evMes = state.eventos.filter(e=>e.fecha && e.fecha.startsWith(nowYm) && e.estado!=='Cancelado').length;
  let pend = 0;
  state.eventos.forEach(e=>{ if(e.estado==='Cancelado') return; (e.colaboradores||[]).forEach(c=>{ if(c.estadoPago!=='Pagado') pend++; }); });
  const gastosPend = state.gastos.filter(g=>g.estadoReembolso!=='Reembolsado').length;
  document.getElementById('mini-mes').textContent = evMes;
  document.getElementById('mini-pend').textContent = pend;
  document.getElementById('mini-gastos').textContent = gastosPend;
}

/* ---------------- selects ---------------- */
function poblarSelectTipos(){
  const sel = document.getElementById('nv-tipo');
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = state.tiposEvento.map(t=>'<option value="'+t.id+'">'+t.nombre+'</option>').join('');
  if(cur) sel.value = cur;
  previsualizarTarifa();
}
function poblarSelectsEmpleados(){
  const box = document.getElementById('nv-colabs');
  const activos = state.empleados.filter(e=>e.activo!==false).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(box){
    // Se conserva lo que el gerente ya había marcado: la lista se vuelve a pintar con cada refresco automático de datos.
    const marcados = Array.from(box.querySelectorAll('.nv-colab-chk:checked')).map(c=>c.value);
    const encSel = box.querySelector('.star[data-selected="1"]');
    const encId = encSel ? encSel.dataset.enc : null;
    box.innerHTML = activos.map(e=>(
      '<label><input type="checkbox" class="nv-colab-chk" value="'+esc(e.id)+'"'+(marcados.includes(e.id)?' checked':'')+'>'+
      '<span>'+esc(e.nombre)+(e.telefono?'':' <em style="color:var(--danger); font-style:normal;">(sin teléfono)</em>')+'</span>'+
      (e.id===encId
        ? '<span class="star" data-enc="'+esc(e.id)+'" data-selected="1" style="color:var(--accent-ink);" onclick="marcarEncargado(this); event.preventDefault();">★ encargado</span></label>'
        : '<span class="star" data-enc="'+esc(e.id)+'" onclick="marcarEncargado(this); event.preventDefault();">☆ encargado</span></label>')
    )).join('') || '<div class="empty-msg">Aún no hay colaboradores activos.</div>';
  }
  const gaSel = document.getElementById('ga-empleado');
  if(gaSel){ const cur = gaSel.value; gaSel.innerHTML = activos.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.nombre)+'</option>').join(''); if(cur) gaSel.value = cur; }
  const noSel = document.getElementById('nomina-empleado');
  if(noSel){
    const cur = noSel.value;
    const todos = state.empleados.slice().sort((a,b)=>a.nombre.localeCompare(b.nombre));
    noSel.innerHTML = '<option value="">Todos los colaboradores (resumen)</option>' + todos.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.nombre)+(e.activo===false?' (inactivo)':'')+'</option>').join('');
    if(cur) noSel.value = cur;
  }
  poblarSelectMeses();
}
function poblarSelectMeses(){
  const sel = document.getElementById('nomina-mes');
  if(!sel) return;
  const cur = sel.value;
  const meses = Array.from(new Set(state.eventos.map(e=>e.fecha.slice(0,7)))).sort();
  if(meses.length===0) meses.push(todayStr().slice(0,7));
  sel.innerHTML = meses.map(ym=>{
    const [y,m] = ym.split('-');
    return '<option value="'+ym+'">'+MESES[Number(m)-1]+' '+y+'</option>';
  }).join('');
  if(cur && meses.includes(cur)) sel.value = cur;
  else{
    // primera vez: mes y quincena de hoy (si hay eventos ese mes)
    const hoy = todayStr();
    sel.value = meses.includes(hoy.slice(0,7)) ? hoy.slice(0,7) : meses[meses.length-1];
    const per = document.getElementById('nomina-periodo');
    if(per && sel.value===hoy.slice(0,7)) per.value = quincenaDe(hoy);
  }
}

function marcarEncargado(el){
  // el encargado siempre queda marcado como asistente
  const chk = el.parentElement.querySelector('.nv-colab-chk'); if(chk) chk.checked = true;
  document.querySelectorAll('#nv-colabs .star').forEach(s=>{ s.textContent = '☆ encargado'; s.style.color=''; });
  el.textContent = '★ encargado';
  el.style.color = 'var(--accent-ink)';
  el.dataset.selected = '1';
  document.querySelectorAll('#nv-colabs .star').forEach(s=>{ if(s!==el) delete s.dataset.selected; });
}

function previsualizarTarifa(){
  const tipo = state.tiposEvento.find(t=>t.id===document.getElementById('nv-tipo').value);
  const box = document.getElementById('nv-preview');
  if(!box) return;
  if(!tipo){ box.textContent=''; return; }
  box.innerHTML = 'Tarifa base '+fmtCOP(tipo.tarifaBase)+' · Refrigerios '+fmtCOP(tipo.refrigerio1+tipo.refrigerio2)+' · Subsidio transporte '+fmtCOP(tipo.subsidioTransporte)+' <span style="color:var(--ink-soft);">(editable luego en el detalle del evento)</span>';
}


vigilarTablas();
init();
