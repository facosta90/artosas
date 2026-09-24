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
    document.getElementById('modo-datos').textContent = 'Conectando…';
    sb.auth.onAuthStateChange((_event, session)=>{
      if(session && session.user){
        state.miId = (session.user.user_metadata && session.user.user_metadata.cedula) || (session.user.email||'').split('@')[0];
      }else{
        state.miId = null;
      }
      if(dataReadyDone) renderMiJornada();
    });
    try{
      await cargarTodoSupabase();
      document.getElementById('modo-datos').textContent = 'Datos en vivo — compartidos para todo el equipo';
    }catch(e){
      document.getElementById('modo-datos').textContent = 'No se pudo conectar a Supabase — revisa la consola del navegador.';
    }
    onDataReady();
    setInterval(()=>{ cargarTodoSupabase().catch(()=>{}); }, 25000); // refresco liviano para ver los cambios de otros
  }else{
    usandoLocal = true;
    document.getElementById('modo-datos').textContent = 'Vista de demostración local — configura Supabase en index.html para compartir datos de verdad (ver GUIA_DESPLIEGUE.md)';
    state.tiposEvento = SEED.tiposEvento.map(x=>({...x}));
    state.empleados = SEED.empleados.map(x=>({...x}));
    state.eventos = SEED.eventos.map(x=>({...x, colaboradores:x.colaboradores.map(c=>({...c, momentosDestacados:[...c.momentosDestacados]}))}));
    state.gastos = SEED.gastos.map(x=>({...x}));
    state.directorio = SEED.directorio.map(x=>({...x}));
    state.config = {...SEED.config};
    onDataReady();
  }
}

let dataReadyDone = false;
function onDataReady(){
  if(dataReadyDone) return;
  dataReadyDone = true;
  poblarSelectsEmpleados();
  poblarSelectTipos();
  document.getElementById('ga-fecha').value = todayStr();
  document.getElementById('nv-fecha').value = todayStr();
  previsualizarTarifa();
  renderAll();
}


/* ---------------- tabs ---------------- */
function switchTab(tab){
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
  const pop = document.getElementById('settings-pop');
  pop.hidden = !pop.hidden;
  if(!pop.hidden){
    document.getElementById('cfg-horaExtra').value = state.config.valorHoraExtra;
    document.getElementById('cfg-bonoEncargado').value = state.config.bonoEncargado;
    document.getElementById('cfg-bonoFestivo').value = state.config.bonoFestivo;
  }
}
function guardarConfig(){
  const obj = {
    valorHoraExtra: Number(document.getElementById('cfg-horaExtra').value)||0,
    bonoEncargado: Number(document.getElementById('cfg-bonoEncargado').value)||0,
    bonoFestivo: Number(document.getElementById('cfg-bonoFestivo').value)||0,
  };
  Data.setConfig(obj);
  document.getElementById('settings-pop').hidden = true;
  toast('Configuración de bonos actualizada.');
  renderActiveTab();
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
  if(box){
    box.innerHTML = state.empleados.map(e=>(
      '<label><input type="checkbox" class="nv-colab-chk" value="'+e.id+'">'+
      '<span>'+e.nombre+(e.telefono?'':' <em style="color:var(--danger); font-style:normal;">(sin teléfono)</em>')+'</span>'+
      '<span class="star" data-enc="'+e.id+'" onclick="marcarEncargado(this)">☆ encargado</span></label>'
    )).join('') || '<div class="empty-msg">Aún no hay colaboradores registrados.</div>';
  }
  const gaSel = document.getElementById('ga-empleado');
  if(gaSel){ gaSel.innerHTML = state.empleados.map(e=>'<option value="'+e.id+'">'+e.nombre+'</option>').join(''); }
  const noSel = document.getElementById('nomina-empleado');
  if(noSel){
    const cur = noSel.value;
    noSel.innerHTML = '<option value="">Selecciona un colaborador…</option>' + state.empleados.map(e=>'<option value="'+e.id+'">'+e.nombre+'</option>').join('');
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
  if(cur && meses.includes(cur)) sel.value = cur; else sel.value = meses[meses.length-1];
}

function marcarEncargado(el){
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


init();
