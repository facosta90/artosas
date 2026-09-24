/* ============================================================
   Módulo: Mi jornada (autoservicio colaborador)
   ============================================================ */

function marcarHoraToggle(eventoId){
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===state.miId);
  if(!colab) return;
  if(!colab.horaLlegadaReal){
    actualizarColab(eventoId, state.miId, {horaLlegadaReal: nowHHMM()});
    toast('🟢 Hora de ingreso registrada: '+nowHHMM()+'. ¡Buen evento!');
  }else if(!colab.horaFinReal){
    actualizarColab(eventoId, state.miId, {horaFinReal: nowHHMM()});
    toast('🔴 Hora de salida registrada: '+nowHHMM()+'. Gracias por tu trabajo hoy.');
  }
}
function guardarComprobanteMJ(eventoId, empleadoId){
  const val = document.getElementById('mj-comp-'+eventoId).value;
  actualizarColab(eventoId, empleadoId, {comprobanteTransporte: val});
  toast('Comprobante guardado.');
}
function agregarMomentoMJ(eventoId, empleadoId){
  const key = eventoId+'|'+empleadoId;
  const texto = (state.momentoDraft[key]||'').trim();
  if(!texto){ toast('Escribe una nota antes de agregar.'); return; }
  const evento = state.eventos.find(e=>e.id===eventoId);
  const colab = evento.colaboradores.find(c=>c.empleadoId===empleadoId);
  const momentos = [...(colab.momentosDestacados||[]), {nota:texto, fecha:todayStr()}];
  actualizarColab(eventoId, empleadoId, {momentosDestacados:momentos});
  state.momentoDraft[key] = '';
}

function mjTarjetaEvento(evento, colab){
  const cls = evento.estado==='Cancelado' ? 'canc' : (evento.estado==='Realizado' ? 'ok' : 'pend');
  const cancelado = evento.estado==='Cancelado';
  const total = calcularTotal(evento, colab);
  const momentos = (colab.momentosDestacados||[]).map(m=>'<li><span class="fecha">'+fmtFecha(m.fecha)+'</span>'+m.nota+'</li>').join('') || '<li style="color:var(--ink-soft); background:none; padding:0;">Sin momentos registrados aún.</li>';

  let accionesHtml;
  if(cancelado){
    accionesHtml = '<p class="sub" style="margin:.4rem 0 0;">Este evento fue cancelado — no se requiere registrar llegada ni salida.</p>';
  }else{
    let botonPrincipal;
    if(!colab.horaLlegadaReal){
      botonPrincipal = '<button class="btn primary mj-toggle-btn" onclick="marcarHoraToggle(\''+evento.id+'\')">🟢 Marcar hora de ingreso</button>';
    }else if(!colab.horaFinReal){
      botonPrincipal = '<button class="btn primary mj-toggle-btn" onclick="marcarHoraToggle(\''+evento.id+'\')">🔴 Marcar hora de salida</button>';
    }else{
      botonPrincipal = '<button class="btn mj-toggle-btn" disabled>✓ Jornada completa</button>';
    }
    accionesHtml = ''
      + botonPrincipal
      + '<div class="mj-times"><span>Ingreso: <b>'+(colab.horaLlegadaReal||'—')+'</b></span><span>Salida: <b>'+(colab.horaFinReal||'—')+'</b></span></div>'
      + '<details class="mj-correct"><summary>✎ Corregir horas manualmente</summary>'
      + '<div class="colab-grid">'
      + '<div class="field"><label>Ingreso</label><input type="time" value="'+colab.horaLlegadaReal+'" onchange="actualizarColab(\''+evento.id+'\',\''+colab.empleadoId+'\',{horaLlegadaReal:this.value})"></div>'
      + '<div class="field"><label>Salida</label><input type="time" value="'+colab.horaFinReal+'" onchange="actualizarColab(\''+evento.id+'\',\''+colab.empleadoId+'\',{horaFinReal:this.value})"></div>'
      + '</div></details>'
      + '<div class="field" style="margin-top:.8rem;"><label>Comprobante de transporte (referencia)</label>'
      + '<div style="display:flex; gap:.4rem;"><input type="text" id="mj-comp-'+evento.id+'" value="'+(colab.comprobanteTransporte||'').replace(/"/g,'&quot;')+'" placeholder="Ej. Recibo Uber $8.000">'
      + '<button class="btn small" onclick="guardarComprobanteMJ(\''+evento.id+'\',\''+colab.empleadoId+'\')">Guardar</button></div></div>'
      + '<div class="field"><label>Momentos destacados</label><ul class="momentos-list">'+momentos+'</ul>'
      + '<div class="add-momento-row"><input type="text" placeholder="Agregar una nota del evento…" oninput="state.momentoDraft[\''+evento.id+'|'+colab.empleadoId+'\']=this.value">'
      + '<button class="btn small" onclick="agregarMomentoMJ(\''+evento.id+'\',\''+colab.empleadoId+'\')">Agregar</button></div></div>';
  }

  return '<div class="card colab-card">'
    + '<div class="colab-head"><span class="colab-name">'+evento.empresa+(colab.esEncargado?' <span class="pill ok">encargado</span>':'')+'</span>'
    + '<span class="pill '+cls+'">'+evento.estado+'</span></div>'
    + '<div class="ev-meta" style="margin-bottom:.7rem;">'+fmtFecha(evento.fecha)+' · '+evento.horaAlistamiento+' → '+evento.horaFin+' · '+evento.tipoEventoNombre+(evento.esFestivo?' · <span style="color:var(--pend);">festivo</span>':'')+(evento.lugar?(' · '+evento.lugar):'')+'</div>'
    + accionesHtml
    + '<div class="colab-total"><span>Pago estimado <span class="pill '+(colab.estadoPago==='Pagado'?'ok':'pend')+'" style="margin-left:.4rem;">'+colab.estadoPago+'</span></span><b>'+fmtCOP(total)+'</b></div>'
    + '</div>';
}

function renderMiJornada(){
  const identBox = document.getElementById('mj-identificacion');
  const panel = document.getElementById('mj-panel');
  if(!state.miId){
    identBox.hidden = false;
    panel.hidden = true;
    return;
  }
  const emp = state.empleados.find(e=>e.id===state.miId);
  if(!emp){
    // el id guardado ya no existe (p.ej. datos de ejemplo distintos) — pedir de nuevo
    cambiarUsuario();
    return;
  }
  identBox.hidden = true;
  panel.hidden = false;
  document.getElementById('mj-hola').textContent = 'Hola, ' + emp.nombre;

  const misEventos = state.eventos.filter(e => (e.colaboradores||[]).some(c=>c.empleadoId===state.miId));
  const today = todayStr();
  const proximos = misEventos.filter(e=> e.fecha>=today && e.estado!=='Cancelado').sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const anteriores = misEventos.filter(e=> e.fecha<today || e.estado==='Cancelado').sort((a,b)=>b.fecha.localeCompare(a.fecha));

  let html = '';
  html += '<div class="mj-section-label">Hoy y próximos</div>';
  html += proximos.length
    ? proximos.map(e=>mjTarjetaEvento(e, e.colaboradores.find(c=>c.empleadoId===state.miId))).join('')
    : '<div class="empty-msg card">No tienes eventos programados por ahora.</div>';

  if(anteriores.length){
    html += '<div class="mj-section-label">Eventos anteriores</div>';
    html += anteriores.slice(0,8).map(e=>mjTarjetaEvento(e, e.colaboradores.find(c=>c.empleadoId===state.miId))).join('');
  }
  document.getElementById('mj-eventos').innerHTML = html;

  const ym = today.slice(0,7);
  const jornadasMes = misEventos.filter(e=> e.fecha.startsWith(ym) && e.estado!=='Cancelado');
  let totalMes = 0;
  jornadasMes.forEach(e=>{ totalMes += calcularTotal(e, e.colaboradores.find(c=>c.empleadoId===state.miId)); });
  document.getElementById('mj-recap').innerHTML = '<div class="nomina-total-box">'
    + '<div class="stat"><div class="n">'+jornadasMes.length+'</div><div class="l">Eventos este mes</div></div>'
    + '<div class="stat"><div class="n">'+fmtCOP(totalMes)+'</div><div class="l">Total estimado del mes</div></div>'
    + '</div>';
}
