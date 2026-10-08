/* ============================================================
   Módulo: Eventos (crear, lista, pago, WhatsApp, detalle)
   ============================================================ */

/* ---------------- eventos: crear ---------------- */
function crearEvento(ev){
  ev.preventDefault();
  if(!esGerente()) return;
  const seleccionados = Array.from(document.querySelectorAll('#nv-colabs .nv-colab-chk:checked')).map(chk=>chk.value);
  if(seleccionados.length===0){ toast('Selecciona al menos un colaborador.'); return; }
  const encargadoStar = document.querySelector('#nv-colabs .star[data-selected="1"]');
  const encargadoId = encargadoStar ? encargadoStar.dataset.enc : null;
  const tipo = state.tiposEvento.find(t=>t.id===document.getElementById('nv-tipo').value);
  if(!confirmarCruces(seleccionados, document.getElementById('nv-fecha').value, document.getElementById('nv-hAlist').value, document.getElementById('nv-hFin').value, null)) return;
  const colaboradores = seleccionados.map(id=>{
    const emp = state.empleados.find(e=>e.id===id);
    return nuevoColab(id, emp?emp.nombre:id, id===encargadoId);
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

function nuevoColab(id, nombre, esEncargado){
  return {empleadoId:id, nombre:nombre, esEncargado:!!esEncargado, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'};
}

/* ¿Alguno de estos colaboradores ya está en otro evento ese día a la misma hora? Avisa y deja decidir. */
function crucesDeHorario(ids, fecha, desde, hasta, exceptoEventoId){
  const avisos = [];
  state.eventos.forEach(o=>{
    if(o.id===exceptoEventoId || o.estado==='Cancelado' || o.fecha!==fecha) return;
    const oDesde = o.horaAlistamiento||o.horaInicio||'00:00', oHasta = o.horaFin||'23:59';
    if(!((desde||'00:00') < oHasta && oDesde < (hasta||'23:59'))) return;
    (o.colaboradores||[]).forEach(c=>{ if(ids.includes(c.empleadoId)) avisos.push('• '+c.nombre+' ya está en "'+o.empresa+'" ('+oDesde+' a '+oHasta+')'); });
  });
  return avisos;
}
function confirmarCruces(ids, fecha, desde, hasta, exceptoEventoId){
  const avisos = crucesDeHorario(ids, fecha, desde, hasta, exceptoEventoId);
  if(!avisos.length) return true;
  return confirm('Cruce de horario el '+fmtFecha(fecha)+':\n\n'+avisos.join('\n')+'\n\n¿Guardar de todas formas?');
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
/* Misma fórmula de siempre, separada por concepto para poder mostrarla en el recibo. */
function desglosePago(evento, colab){
  const cumple = !!(colab.cumpleHorario && colab.cumpleUniforme);
  const d = {
    tarifa: Number(evento.tarifaBase)||0,
    horasExtra: (Number(colab.horasExtra)||0) * (state.config.valorHoraExtra||0),
    refrigerios: cumple ? (Number(evento.refrigerio1)||0) + (Number(evento.refrigerio2)||0) : 0,
    transporte: cumple ? (Number(evento.subsidioTransporte)||0) : 0,
    encargado: colab.esEncargado ? (state.config.bonoEncargado||0) : 0,
    festivo: evento.esFestivo ? (state.config.bonoFestivo||0) : 0,
    bonoLibre: Number(colab.bonoLibre)||0,
  };
  d.bonos = d.horasExtra + d.encargado + d.festivo + d.bonoLibre;
  d.total = d.tarifa + d.refrigerios + d.transporte + d.bonos;
  return d;
}
function calcularTotal(evento, colab){ return desglosePago(evento, colab).total; }

/* ---------------- WhatsApp ---------------- */
function buildMensaje(evento, colab){
  return 'Hola '+colab.nombre+', bonito día 👋\n\nEvento:\n'+fmtFecha(evento.fecha)+'\n'+evento.empresa+(evento.lugar?(' - '+evento.lugar):'')+'\n\nHora: '+evento.horaAlistamiento+' a '+evento.horaFin+'\nServicio: '+evento.tipoEventoNombre+(colab.esEncargado?'\nRol: Encargado(a) del evento':'')+(evento.esFestivo?'\n(Evento en día festivo)':'');
}
function enviarWhatsApp(eventoId, empleadoId){
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===empleadoId);
  const emp = state.empleados.find(e=>e.id===empleadoId);
  const tel = (emp && emp.telefono) ? emp.telefono.replace(/\D/g,'') : '';
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
  if(!esGerente()){ wrap.innerHTML = detalleSoloLectura(evento, cls); return; }

  let html = '<button class="btn ghost detail-back" onclick="volverALista()">← Volver a la lista</button>';

  html += '<div class="card detail-head"><div class="row1"><div>'
    + '<h3>'+evento.empresa+'</h3>'
    + '<div class="ev-meta">'+fmtFecha(evento.fecha)+' · '+evento.horaAlistamiento+' → '+evento.horaFin+' · '+evento.tipoEventoNombre+' · '+evento.modalidad+(evento.lugar?(' · '+evento.lugar):'')+(evento.esFestivo?' · <span style="color:var(--pend);">festivo</span>':'')+'</div>'
    + (evento.observaciones?('<div class="ev-meta" style="margin-top:.3rem;">Obs: '+evento.observaciones+'</div>'):'')
    + '</div><span class="pill '+cls+'">'+evento.estado+'</span></div>'
    + '<div class="detail-actions">'
    + (evento.estado!=='Cancelado' ? '<button class="btn small primary" onclick="abrirEditarEvento(\''+evento.id+'\')">✎ Editar evento</button>' : '')
    + (evento.estado==='Programado' ? '<button class="btn small" onclick="marcarRealizado(\''+evento.id+'\')">Marcar como realizado</button>' : '')
    + (evento.estado==='Realizado' ? '<button class="btn small" onclick="volverAProgramado(\''+evento.id+'\')">Volver a "Programado"</button>' : '')
    + (evento.estado!=='Cancelado' ? '<button class="btn small danger" onclick="cancelarEvento(\''+evento.id+'\')">Cancelar evento</button>' : '<span class="pill canc">Cancelado — el registro se conserva</span><button class="btn small" onclick="reactivarEvento(\''+evento.id+'\')">Reactivar evento</button>')
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

  if(!(evento.colaboradores||[]).length) html += '<div class="empty-msg card">Este evento no tiene colaboradores asignados. Usa "Editar evento" para agregarlos.</div>';
  html += historialHtml(evento);

  wrap.innerHTML = html;
}

function historialHtml(evento){
  const cambios = (evento.cambios||[]).slice().reverse();
  if(!cambios.length) return '';
  return '<details class="card historial"'+(cambios.length<=3?' open':'')+'><summary>Historial de cambios ('+cambios.length+')</summary><ul>'
    + cambios.map(c=>{
        const d = new Date(c.fecha);
        const cuando = isNaN(d) ? esc(c.fecha) : d.toLocaleString('es-CO', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
        return '<li><span class="fecha">'+cuando+(c.por?' · '+esc(c.por):'')+'</span>'+esc(c.resumen)+'</li>';
      }).join('')
    + '</ul></details>';
}
function quienSoy(){
  const emp = state.empleados.find(e=>e.id===state.miId);
  return (emp && emp.nombre) || state.miNombre || state.miId || '';
}
function registroCambio(evento, resumen){
  return [...(evento.cambios||[]), {fecha:new Date().toISOString(), resumen:resumen, por:quienSoy()}];
}

/* ---------------- editar evento ---------------- */
function abrirEditarEvento(id){
  if(!esGerente()) return;
  const ev = state.eventos.find(e=>e.id===id);
  if(!ev) return;
  const asignados = (ev.colaboradores||[]).map(c=>c.empleadoId);
  // activos + los que ya estaban asignados (aunque hoy estén inactivos o ya no existan en la lista)
  const filas = state.empleados.filter(e=>e.activo!==false || asignados.includes(e.id)).sort((a,b)=>a.nombre.localeCompare(b.nombre))
    .map(e=>({id:e.id, nombre:e.nombre, inactivo:e.activo===false}));
  (ev.colaboradores||[]).forEach(c=>{ if(!filas.some(f=>f.id===c.empleadoId)) filas.push({id:c.empleadoId, nombre:c.nombre, inactivo:true}); });
  const encActual = ((ev.colaboradores||[]).find(c=>c.esEncargado)||{}).empleadoId || '';
  const tipos = state.tiposEvento.slice();
  if(ev.tipoEventoId && !tipos.some(t=>t.id===ev.tipoEventoId)) tipos.push({id:ev.tipoEventoId, nombre:ev.tipoEventoNombre});

  const listaColabs = filas.map(f=>{
    const c = (ev.colaboradores||[]).find(x=>x.empleadoId===f.id);
    const marca = c && (c.horaLlegadaReal || c.estadoPago==='Pagado') ? ' <em class="nota-chica">('+(c.estadoPago==='Pagado'?'ya pagado':'ya marcó llegada')+')</em>' : '';
    return '<div class="fila-colab"><label><input type="checkbox" class="ed-colab-chk" value="'+esc(f.id)+'"'+(c?' checked':'')+'>'
      + '<span>'+esc(f.nombre)+(f.inactivo?' <em class="nota-chica">(inactivo)</em>':'')+marca+'</span></label>'
      + '<label class="enc-radio"><input type="radio" name="ed-enc" value="'+esc(f.id)+'"'+(encActual===f.id?' checked':'')+' onchange="edMarcarEncargado(this)"> encargado</label></div>';
  }).join('') || '<div class="empty-msg">Aún no hay colaboradores registrados.</div>';

  abrirModal('Editar evento',
    '<form onsubmit="guardarEdicionEvento(event,\''+esc(ev.id)+'\')">'
    + '<div class="grid-3">'
    + '<div class="field"><label>Fecha</label><input type="date" id="ed-fecha" value="'+esc(ev.fecha)+'" required></div>'
    + '<div class="field"><label>Modalidad</label><select id="ed-modalidad">'+opcionesSelect(['Presencial','Virtual'], ev.modalidad)+'</select></div>'
    + '<div class="field"><label>Tipo de evento</label><select id="ed-tipo" onchange="edCambioTipo()">'+tipos.map(t=>'<option value="'+esc(t.id)+'"'+(t.id===ev.tipoEventoId?' selected':'')+'>'+esc(t.nombre)+'</option>').join('')+'</select></div>'
    + '</div><div class="grid-2">'
    + '<div class="field"><label>Empresa / cliente</label><input type="text" id="ed-empresa" value="'+esc(ev.empresa)+'" required></div>'
    + '<div class="field"><label>Lugar</label><input type="text" id="ed-lugar" value="'+esc(ev.lugar)+'"></div>'
    + '</div><div class="grid-3">'
    + '<div class="field"><label>Hora alistamiento</label><input type="time" id="ed-hAlist" value="'+esc(ev.horaAlistamiento)+'" required></div>'
    + '<div class="field"><label>Hora inicio</label><input type="time" id="ed-hInicio" value="'+esc(ev.horaInicio)+'" required></div>'
    + '<div class="field"><label>Hora fin</label><input type="time" id="ed-hFin" value="'+esc(ev.horaFin)+'" required></div>'
    + '</div>'
    + '<div class="mj-section-label" style="margin-top:.4rem;">Tarifas de este evento</div>'
    + '<div class="grid-4">'
    + '<div class="field"><label>Tarifa jornada</label><input type="number" min="0" step="1000" id="ed-tarifa" value="'+(Number(ev.tarifaBase)||0)+'"></div>'
    + '<div class="field"><label>Refrigerio 1</label><input type="number" min="0" step="1000" id="ed-ref1" value="'+(Number(ev.refrigerio1)||0)+'"></div>'
    + '<div class="field"><label>Refrigerio 2</label><input type="number" min="0" step="1000" id="ed-ref2" value="'+(Number(ev.refrigerio2)||0)+'"></div>'
    + '<div class="field"><label>Subsidio transporte</label><input type="number" min="0" step="1000" id="ed-transp" value="'+(Number(ev.subsidioTransporte)||0)+'"></div>'
    + '</div>'
    + '<label class="check-row check-linea" style="margin-bottom:.9rem;"><input type="checkbox" id="ed-festivo"'+(ev.esFestivo?' checked':'')+'> Es día festivo</label>'
    + '<div class="field"><label>Colaboradores asignados</label><div class="checklist" id="ed-colabs">'+listaColabs+'</div>'
    + '<label class="check-row check-linea" style="margin-top:.5rem;"><input type="radio" name="ed-enc" value=""'+(encActual?'':' checked')+'> Sin encargado</label></div>'
    + '<div class="field"><label>Observaciones</label><textarea id="ed-obs" rows="2">'+esc(ev.observaciones)+'</textarea></div>'
    + '<p class="nota-modal">Al quitar a alguien se borra lo que tenía registrado en este evento (llegada, salida, momentos). Los que se mantienen conservan todo. El cambio queda en el historial.</p>'
    + '<div class="modal-acciones"><span class="espacio"></span>'
    + '<button type="button" class="btn ghost" onclick="cerrarModal()">Cancelar</button>'
    + '<button type="submit" class="btn primary">Guardar cambios</button></div></form>');
}

function edMarcarEncargado(radio){
  const chk = radio.closest('.fila-colab').querySelector('.ed-colab-chk'); if(chk) chk.checked = true;
}

/* Al cambiar el tipo de evento se proponen las tarifas de ese tipo (se pueden ajustar antes de guardar). */
function edCambioTipo(){
  const t = state.tiposEvento.find(x=>x.id===document.getElementById('ed-tipo').value);
  if(!t) return;
  document.getElementById('ed-tarifa').value = t.tarifaBase||0;
  document.getElementById('ed-ref1').value = t.refrigerio1||0;
  document.getElementById('ed-ref2').value = t.refrigerio2||0;
  document.getElementById('ed-transp').value = t.subsidioTransporte||0;
  toast('Se cargaron las tarifas de "'+t.nombre+'".');
}

function guardarEdicionEvento(e, id){
  e.preventDefault();
  if(!esGerente()) return;
  const ev = state.eventos.find(x=>x.id===id);
  if(!ev){ cerrarModal(); return; }
  const val = k=>document.getElementById(k).value;
  const num = k=>Math.max(0, Number(val(k))||0);

  const seleccionados = Array.from(document.querySelectorAll('#ed-colabs .ed-colab-chk:checked')).map(c=>c.value);
  if(seleccionados.length===0){ toast('Selecciona al menos un colaborador.'); return; }
  const encRadio = document.querySelector('input[name="ed-enc"]:checked');
  let encargadoId = encRadio ? encRadio.value : '';
  if(encargadoId && !seleccionados.includes(encargadoId)){ toast('El encargado debe estar entre los colaboradores asignados.'); return; }

  const antes = ev.colaboradores||[];
  const quitados = antes.filter(c=>!seleccionados.includes(c.empleadoId));
  const conDatos = quitados.filter(c=>c.horaLlegadaReal || c.horaFinReal || c.estadoPago==='Pagado');
  if(conDatos.length && !confirm('Vas a retirar a '+conDatos.map(c=>c.nombre).join(', ')+', que ya tiene registros en este evento (llegada o pago). Esos registros se pierden.\n\n¿Continuar?')) return;

  const fecha = val('ed-fecha'), hAlist = val('ed-hAlist'), hFin = val('ed-hFin');
  if(!confirmarCruces(seleccionados, fecha, hAlist, hFin, id)) return;

  const tipo = state.tiposEvento.find(t=>t.id===val('ed-tipo'));
  const nuevo = {
    fecha, horaAlistamiento:hAlist, horaInicio:val('ed-hInicio'), horaFin:hFin,
    empresa: val('ed-empresa').trim(), lugar: val('ed-lugar').trim(), modalidad: val('ed-modalidad'),
    tipoEventoId: tipo?tipo.id:ev.tipoEventoId, tipoEventoNombre: tipo?tipo.nombre:ev.tipoEventoNombre,
    tarifaBase:num('ed-tarifa'), refrigerio1:num('ed-ref1'), refrigerio2:num('ed-ref2'), subsidioTransporte:num('ed-transp'),
    esFestivo: document.getElementById('ed-festivo').checked,
    observaciones: val('ed-obs').trim(),
  };

  // --- qué cambió (para el historial) ---
  const cambios = [];
  if(nuevo.fecha!==ev.fecha) cambios.push('Fecha: '+fmtFecha(ev.fecha)+' → '+fmtFecha(nuevo.fecha));
  const hA = (ev.horaAlistamiento||'—')+' / '+(ev.horaInicio||'—')+' / '+(ev.horaFin||'—'), hN = nuevo.horaAlistamiento+' / '+nuevo.horaInicio+' / '+nuevo.horaFin;
  if(hA!==hN) cambios.push('Horario (alistamiento / inicio / fin): '+hA+' → '+hN);
  if(nuevo.empresa!==ev.empresa) cambios.push('Empresa: '+ev.empresa+' → '+nuevo.empresa);
  if(nuevo.lugar!==(ev.lugar||'')) cambios.push('Lugar: '+(ev.lugar||'—')+' → '+(nuevo.lugar||'—'));
  if(nuevo.modalidad!==ev.modalidad) cambios.push('Modalidad: '+ev.modalidad+' → '+nuevo.modalidad);
  if(nuevo.tipoEventoId!==ev.tipoEventoId) cambios.push('Tipo: '+ev.tipoEventoNombre+' → '+nuevo.tipoEventoNombre);
  [['tarifaBase','Tarifa jornada'],['refrigerio1','Refrigerio 1'],['refrigerio2','Refrigerio 2'],['subsidioTransporte','Subsidio transporte']].forEach(p=>{
    if(nuevo[p[0]]!==(Number(ev[p[0]])||0)) cambios.push(p[1]+': '+fmtCOP(ev[p[0]])+' → '+fmtCOP(nuevo[p[0]]));
  });
  if(nuevo.esFestivo!==!!ev.esFestivo) cambios.push(nuevo.esFestivo?'Se marcó como festivo':'Se quitó la marca de festivo');
  if(nuevo.observaciones!==(ev.observaciones||'')) cambios.push('Se cambiaron las observaciones');

  const colaboradores = seleccionados.map(cid=>{
    const previo = antes.find(c=>c.empleadoId===cid);
    const emp = state.empleados.find(x=>x.id===cid);
    if(previo) return {...previo, nombre: emp?emp.nombre:previo.nombre, esEncargado: cid===encargadoId};
    return nuevoColab(cid, emp?emp.nombre:cid, cid===encargadoId);
  });
  const agregados = colaboradores.filter(c=>!antes.some(a=>a.empleadoId===c.empleadoId));
  if(agregados.length) cambios.push('Se agregó a: '+agregados.map(c=>c.nombre).join(', '));
  if(quitados.length) cambios.push('Se retiró a: '+quitados.map(c=>c.nombre).join(', '));
  const encAntes = (antes.find(c=>c.esEncargado)||{}).empleadoId || '';
  if(encAntes!==encargadoId){
    const n = cid=>{ const c = colaboradores.concat(antes).find(x=>x.empleadoId===cid); return c?c.nombre:'nadie'; };
    cambios.push('Encargado: '+(encAntes?n(encAntes):'nadie')+' → '+(encargadoId?n(encargadoId):'nadie'));
  }

  if(!cambios.length){ cerrarModal(); toast('No hubo cambios.'); return; }
  nuevo.colaboradores = colaboradores;
  nuevo.cambios = registroCambio(ev, cambios.join(' · '));

  const avisar = cambios.some(c=>/^(Fecha|Horario|Lugar|Empresa|Se agregó)/.test(c));
  Data.updateEvento(id, nuevo).then(()=>{
    cerrarModal();
    toast(avisar ? 'Evento actualizado. Reenvía el WhatsApp a los colaboradores para avisarles.' : 'Evento actualizado.');
  }).catch(()=>{});
}

/* Vista del empleado: consulta. Ve quiénes van al evento y, si está asignado, solo su propio pago. */
function detalleSoloLectura(evento, cls){
  let html = '<button class="btn ghost detail-back" onclick="volverALista()">← Volver a la lista</button>';
  html += '<div class="card detail-head"><div class="row1"><div>'
    + '<h3>'+evento.empresa+'</h3>'
    + '<div class="ev-meta">'+fmtFecha(evento.fecha)+' · '+evento.horaAlistamiento+' → '+evento.horaFin+' · '+evento.tipoEventoNombre+' · '+evento.modalidad+(evento.lugar?(' · '+evento.lugar):'')+(evento.esFestivo?' · <span style="color:var(--pend);">festivo</span>':'')+'</div>'
    + (evento.observaciones?('<div class="ev-meta" style="margin-top:.3rem;">Obs: '+evento.observaciones+'</div>'):'')
    + '</div><span class="pill '+cls+'">'+evento.estado+'</span></div>'
    + '<div class="ev-colabs" style="margin-top:.8rem;">'
    + ((evento.colaboradores||[]).map(c=>'<span class="chip'+(c.esEncargado?' enc':'')+'">'+(c.esEncargado?'★ ':'')+c.nombre+'</span>').join('') || '<span class="sub">Sin colaboradores asignados.</span>')
    + '</div></div>';
  const yo = (evento.colaboradores||[]).find(c=>c.empleadoId===state.miId);
  if(yo){
    html += '<div class="card colab-card">'
      + '<div class="colab-head"><span class="colab-name">Tu participación'+(yo.esEncargado?' <span class="pill ok">encargado</span>':'')+'</span>'
      + '<span class="pill '+(yo.estadoPago==='Pagado'?'ok':'pend')+'">'+(yo.estadoPago||'Pendiente')+'</span></div>'
      + '<div class="mj-times"><span>Ingreso: <b>'+(yo.horaLlegadaReal||'—')+'</b></span><span>Salida: <b>'+(yo.horaFinReal||'—')+'</b></span></div>'
      + '<div class="colab-total"><span>Tu pago estimado</span><b>'+fmtCOP(calcularTotal(evento, yo))+'</b></div>'
      + '<button class="btn small" style="margin-top:.8rem;" onclick="switchTab(\'mijornada\')">Registrar llegada y salida en Mi Jornada →</button>'
      + '</div>';
  }else{
    html += '<div class="empty-msg card">No estás asignado a este evento.</div>';
  }
  return html;
}

function actualizarColab(eventoId, empleadoId, patch){
  if(sb && !esGerente()){
    if(empleadoId !== state.miId) return;
    Data.actualizarMiJornada(eventoId, patch).catch(()=>{});
    return;
  }
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
  if(!esGerente()) return;
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===empleadoId);
  actualizarColab(eventoId, empleadoId, {estadoPago: colab.estadoPago==='Pagado' ? 'Pendiente' : 'Pagado'});
}
function marcarRealizado(eventoId){
  if(!esGerente()) return;
  Data.updateEvento(eventoId, {estado:'Realizado'}).then(()=>{ toast('Evento marcado como realizado.'); if(usandoLocal) renderDetalle(); });
}
function volverAProgramado(eventoId){
  if(!esGerente()) return;
  Data.updateEvento(eventoId, {estado:'Programado'}).then(()=>{ toast('El evento volvió a "Programado".'); }).catch(()=>{});
}
function reactivarEvento(eventoId){
  if(!esGerente()) return;
  if(!confirm('¿Reactivar este evento? Volverá a quedar como "Programado".')) return;
  const evento = state.eventos.find(e=>e.id===eventoId);
  Data.updateEvento(eventoId, {estado:'Programado', cambios:registroCambio(evento, 'Evento reactivado.')}).then(()=>{ toast('Evento reactivado.'); }).catch(()=>{});
}
function cancelarEvento(eventoId){
  if(!esGerente()) return;
  if(!confirm('¿Cancelar este evento? Quedará marcado como "Cancelado" y se conserva en el historial — no se borra.')) return;
  const evento = state.eventos.find(e=>e.id===eventoId);
  const cambios = registroCambio(evento, 'Evento cancelado.');
  Data.updateEvento(eventoId, {estado:'Cancelado', cambios}).then(()=>{ toast('Evento cancelado (registro conservado).'); if(usandoLocal) renderDetalle(); });
}
