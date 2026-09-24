/* ============================================================
   Módulo: Eventos (crear, lista, pago, WhatsApp, detalle)
   ============================================================ */

/* ---------------- eventos: crear ---------------- */
function crearEvento(ev){
  ev.preventDefault();
  const seleccionados = Array.from(document.querySelectorAll('#nv-colabs .nv-colab-chk:checked')).map(chk=>chk.value);
  if(seleccionados.length===0){ toast('Selecciona al menos un colaborador.'); return; }
  const encargadoStar = document.querySelector('#nv-colabs .star[data-selected="1"]');
  const encargadoId = encargadoStar ? encargadoStar.dataset.enc : null;
  const tipo = state.tiposEvento.find(t=>t.id===document.getElementById('nv-tipo').value);
  const colaboradores = seleccionados.map(id=>{
    const emp = state.empleados.find(e=>e.id===id);
    return {empleadoId:id, nombre:emp?emp.nombre:id, esEncargado:id===encargadoId, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'};
  });
  const obj = {
    fecha: document.getElementById('nv-fecha').value,
    horaAlistamiento: document.getElementById('nv-hAlist').value,
    horaInicio: document.getElementById('nv-hInicio').value,
    horaFin: document.getElementById('nv-hFin').value,
    empresa: document.getElementById('nv-empresa').value,
    lugar: document.getElementById('nv-lugar').value,
    modalidad: document.getElementById('nv-modalidad').value,
    tipoEventoId: tipo?tipo.id:'', tipoEventoNombre: tipo?tipo.nombre:'',
    tarifaBase: tipo?tipo.tarifaBase:0, refrigerio1: tipo?tipo.refrigerio1:0, refrigerio2: tipo?tipo.refrigerio2:0, subsidioTransporte: tipo?tipo.subsidioTransporte:0,
    esFestivo: document.getElementById('nv-festivo').checked,
    estado: 'Programado',
    observaciones: document.getElementById('nv-obs').value,
    cambios: [],
    colaboradores,
  };
  Data.addEvento(obj).then(()=>{
    toast('Evento programado. Se generó el calendario automáticamente.');
    ev.target.reset();
    document.getElementById('nv-fecha').value = todayStr();
    document.querySelectorAll('#nv-colabs .star').forEach(s=>{ s.textContent='☆ encargado'; delete s.dataset.selected; });
    previsualizarTarifa();
  });
}

/* ---------------- eventos: lista ---------------- */
function limpiarFiltroFecha(){ state.filtroFecha = null; renderEventos(); }

function renderEventos(){
  const chipBox = document.getElementById('filtro-fecha-chip');
  if(state.filtroFecha){
    chipBox.innerHTML = '<span class="filtro-chip">Fecha: '+fmtFecha(state.filtroFecha)+' <button onclick="limpiarFiltroFecha()">✕</button></span>';
  } else chipBox.innerHTML = '';

  const estadoF = document.getElementById('filtro-estado').value;
  const textoF = (document.getElementById('filtro-texto').value||'').toLowerCase();

  let lista = state.eventos.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha));
  if(state.filtroFecha) lista = lista.filter(e=>e.fecha===state.filtroFecha);
  if(estadoF) lista = lista.filter(e=>e.estado===estadoF);
  if(textoF){
    lista = lista.filter(e=> e.empresa.toLowerCase().includes(textoF) || (e.colaboradores||[]).some(c=>c.nombre.toLowerCase().includes(textoF)) );
  }

  const cont = document.getElementById('eventos-lista');
  if(lista.length===0){ cont.innerHTML = '<div class="empty-msg card">No hay eventos con estos filtros.</div>'; return; }

  cont.innerHTML = lista.map(e=>{
    const cls = e.estado==='Cancelado' ? 'canc' : (e.estado==='Realizado' ? 'ok' : 'pend');
    const colabsHtml = (e.colaboradores||[]).map(c=>'<span class="chip'+(c.esEncargado?' enc':'')+'">'+(c.esEncargado?'★ ':'')+c.nombre+'</span>').join('');
    return '<div class="card ev-card">'
      + '<div class="ev-card-top">'
      + '<div><div class="ev-empresa">'+e.empresa+'</div>'
      + '<div class="ev-meta">'+fmtFecha(e.fecha)+' · '+e.horaAlistamiento+' – '+e.horaFin+' · '+e.tipoEventoNombre+' · '+e.modalidad+(e.esFestivo?' · <span style="color:var(--pend);">festivo</span>':'')+'</div></div>'
      + '<div style="display:flex; align-items:center; gap:.6rem;"><span class="pill '+cls+'">'+e.estado+'</span>'
      + '<button class="btn small" onclick="verDetalle(\''+e.id+'\')">Ver detalle →</button></div>'
      + '</div>'
      + '<div class="ev-colabs">'+colabsHtml+'</div>'
      + '</div>';
  }).join('');
}

function verDetalle(id){
  state.selectedEventId = id;
  document.getElementById('eventos-lista-wrap').hidden = true;
  document.getElementById('eventos-detalle-wrap').hidden = false;
  renderDetalle();
}
function volverALista(){
  state.selectedEventId = null;
  document.getElementById('eventos-lista-wrap').hidden = false;
  document.getElementById('eventos-detalle-wrap').hidden = true;
  renderEventos();
}

/* ---------------- cálculo de pago ---------------- */
function calcularTotal(evento, colab){
  let total = Number(evento.tarifaBase)||0;
  total += (Number(colab.horasExtra)||0) * (state.config.valorHoraExtra||0);
  if(colab.cumpleHorario && colab.cumpleUniforme){
    total += (Number(evento.refrigerio1)||0) + (Number(evento.refrigerio2)||0) + (Number(evento.subsidioTransporte)||0);
  }
  if(colab.esEncargado) total += state.config.bonoEncargado||0;
  if(evento.esFestivo) total += state.config.bonoFestivo||0;
  total += Number(colab.bonoLibre)||0;
  return total;
}

/* ---------------- WhatsApp ---------------- */
function buildMensaje(evento, colab){
  return 'Hola '+colab.nombre+', bonito día 👋\n\nEvento:\n'+fmtFecha(evento.fecha)+'\n'+evento.empresa+(evento.lugar?(' - '+evento.lugar):'')+'\n\nHora: '+evento.horaAlistamiento+' a '+evento.horaFin+'\nServicio: '+evento.tipoEventoNombre+(colab.esEncargado?'\nRol: Encargado(a) del evento':'')+(evento.esFestivo?'\n(Evento en día festivo)':'');
}
function enviarWhatsApp(eventoId, empleadoId){
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===empleadoId);
  const emp = state.empleados.find(e=>e.id===empleadoId);
  const tel = (emp && emp.telefono) ? emp.telefono.replace(/\\D/g,'') : '';
  const texto = buildMensaje(evento, colab);
  if(!tel){ toast('❌ '+colab.nombre+' no tiene teléfono registrado — no se puede enviar.'); return; }
  const link = 'https://wa.me/57'+tel+'?text='+encodeURIComponent(texto);
  window.open(link, '_blank');
  toast('✅ Mensaje generado para '+colab.nombre+'.');
}

/* ---------------- detalle de evento ---------------- */
function renderDetalle(){
  const wrap = document.getElementById('eventos-detalle-wrap');
  if(!state.selectedEventId){ wrap.innerHTML=''; return; }
  const evento = state.eventos.find(e=>e.id===state.selectedEventId);
  if(!evento){ wrap.innerHTML = '<div class="empty-msg card">Este evento ya no existe.</div>'; return; }
  const cls = evento.estado==='Cancelado' ? 'canc' : (evento.estado==='Realizado' ? 'ok' : 'pend');

  let html = '<button class="btn ghost detail-back" onclick="volverALista()">← Volver a la lista</button>';

  html += '<div class="card detail-head"><div class="row1"><div>'
    + '<h3>'+evento.empresa+'</h3>'
    + '<div class="ev-meta">'+fmtFecha(evento.fecha)+' · '+evento.horaAlistamiento+' → '+evento.horaFin+' · '+evento.tipoEventoNombre+' · '+evento.modalidad+(evento.lugar?(' · '+evento.lugar):'')+(evento.esFestivo?' · <span style="color:var(--pend);">festivo</span>':'')+'</div>'
    + (evento.observaciones?('<div class="ev-meta" style="margin-top:.3rem;">Obs: '+evento.observaciones+'</div>'):'')
    + '</div><span class="pill '+cls+'">'+evento.estado+'</span></div>'
    + '<div class="detail-actions">'
    + (evento.estado!=='Cancelado' ? '<button class="btn small" onclick="marcarRealizado(\''+evento.id+'\')">Marcar como realizado</button>' : '')
    + (evento.estado!=='Cancelado' ? '<button class="btn small danger" onclick="cancelarEvento(\''+evento.id+'\')">Cancelar evento</button>' : '<span class="pill canc">Cancelado — el registro se conserva</span>')
    + '</div></div>';

  html += (evento.colaboradores||[]).map(c=>{
    const total = calcularTotal(evento, c);
    const pagoCls = c.estadoPago==='Pagado' ? 'ok' : 'pend';
    const momentos = (c.momentosDestacados||[]).map(m=>'<li><span class="fecha">'+fmtFecha(m.fecha)+'</span>'+m.nota+'</li>').join('') || '<li style="color:var(--ink-soft); background:none; padding:0;">Sin momentos registrados aún.</li>';
    const draftKey = evento.id+'|'+c.empleadoId;
    return '<div class="card colab-card">'
      + '<div class="colab-head"><span class="colab-name">'+(c.esEncargado?'★ ':'')+c.nombre+'</span>'
      + '<div style="display:flex; gap:.5rem; align-items:center;">'
      + '<span class="pill '+pagoCls+'">'+c.estadoPago+'</span>'
      + '<button class="btn small" onclick="togglePago(\''+evento.id+'\',\''+c.empleadoId+'\')">Marcar '+(c.estadoPago==='Pagado'?'pendiente':'pagado')+'</button>'
      + '<button class="btn small primary" onclick="enviarWhatsApp(\''+evento.id+'\',\''+c.empleadoId+'\')">WhatsApp</button>'
      + '</div></div>'

      + '<div class="colab-grid">'
      + '<div class="field"><label>Llegada real</label><input type="time" value="'+c.horaLlegadaReal+'" onchange="actualizarColab(\''+evento.id+'\',\''+c.empleadoId+'\',{horaLlegadaReal:this.value})"></div>'
      + '<div class="field"><label>Fin real</label><input type="time" value="'+c.horaFinReal+'" onchange="actualizarColab(\''+evento.id+'\',\''+c.empleadoId+'\',{horaFinReal:this.value})"></div>'
      + '<div class="field"><label>Horas extra</label><input type="number" min="0" step="1" value="'+(c.horasExtra||0)+'" onchange="actualizarColab(\''+evento.id+'\',\''+c.empleadoId+'\',{horasExtra:Number(this.value)||0})"></div>'
      + '<div class="field"><label>Bono libre (sin tema)</label><input type="number" min="0" step="1000" value="'+(c.bonoLibre||0)+'" onchange="actualizarColab(\''+evento.id+'\',\''+c.empleadoId+'\',{bonoLibre:Number(this.value)||0})"></div>'
      + '</div>'

      + '<div style="display:flex; gap:1.4rem; margin:.7rem 0;">'
      + '<label class="check-row" style="text-transform:none; font-family:inherit;"><input type="checkbox" '+(c.cumpleHorario?'checked':'')+' onchange="actualizarColab(\''+evento.id+'\',\''+c.empleadoId+'\',{cumpleHorario:this.checked})"> Cumplió horario</label>'
      + '<label class="check-row" style="text-transform:none; font-family:inherit;"><input type="checkbox" '+(c.cumpleUniforme?'checked':'')+' onchange="actualizarColab(\''+evento.id+'\',\''+c.empleadoId+'\',{cumpleUniforme:this.checked})"> Cumplió uniforme</label>'
      + '</div>'

      + '<div class="field"><label>Comprobante de transporte (referencia)</label>'
      + '<div style="display:flex; gap:.4rem;"><input type="text" id="comp-'+evento.id+'-'+c.empleadoId+'" value="'+(c.comprobanteTransporte||'').replace(/"/g,'&quot;')+'" placeholder="Ej. Recibo Uber $8.000">'
      + '<button class="btn small" onclick="guardarComprobante(\''+evento.id+'\',\''+c.empleadoId+'\')">Guardar</button></div></div>'

      + '<div class="field"><label>Momentos destacados</label><ul class="momentos-list">'+momentos+'</ul>'
      + '<div class="add-momento-row"><input type="text" id="momento-'+evento.id+'-'+c.empleadoId+'" placeholder="Agregar una nota del evento…" oninput="state.momentoDraft[\''+draftKey+'\']=this.value">'
      + '<button class="btn small" onclick="agregarMomento(\''+evento.id+'\',\''+c.empleadoId+'\')">Agregar</button></div></div>'

      + '<div class="colab-total"><span>Total a pagar</span><b>'+fmtCOP(total)+'</b></div>'
      + '</div>';
  }).join('');

  wrap.innerHTML = html;
}

function actualizarColab(eventoId, empleadoId, patch){
  const evento = state.eventos.find(e=>e.id===eventoId);
  const nuevos = evento.colaboradores.map(c=> c.empleadoId===empleadoId ? {...c, ...patch} : c);
  Data.updateEvento(eventoId, {colaboradores: nuevos}).then(()=>{ if(usandoLocal) renderActiveTab(); });
}
function guardarComprobante(eventoId, empleadoId){
  const val = document.getElementById('comp-'+eventoId+'-'+empleadoId).value;
  actualizarColab(eventoId, empleadoId, {comprobanteTransporte: val});
  toast('Comprobante guardado.');
}
function agregarMomento(eventoId, empleadoId){
  const key = eventoId+'|'+empleadoId;
  const texto = (state.momentoDraft[key]||'').trim();
  if(!texto){ toast('Escribe una nota antes de agregar.'); return; }
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===empleadoId);
  const momentos = [...(colab.momentosDestacados||[]), {nota:texto, fecha:todayStr()}];
  actualizarColab(eventoId, empleadoId, {momentosDestacados:momentos});
  state.momentoDraft[key] = '';
}
function togglePago(eventoId, empleadoId){
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===empleadoId);
  actualizarColab(eventoId, empleadoId, {estadoPago: colab.estadoPago==='Pagado' ? 'Pendiente' : 'Pagado'});
}
function marcarRealizado(eventoId){
  Data.updateEvento(eventoId, {estado:'Realizado'}).then(()=>{ toast('Evento marcado como realizado.'); if(usandoLocal) renderDetalle(); });
}
function cancelarEvento(eventoId){
  if(!confirm('¿Cancelar este evento? Quedará marcado como "Cancelado" y se conserva en el historial — no se borra.')) return;
  const evento = state.eventos.find(e=>e.id===eventoId);
  const cambios = [...(evento.cambios||[]), {fecha:new Date().toISOString(), resumen:'Evento cancelado.'}];
  Data.updateEvento(eventoId, {estado:'Cancelado', cambios}).then(()=>{ toast('Evento cancelado (registro conservado).'); if(usandoLocal) renderDetalle(); });
}
