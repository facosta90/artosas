/* ============================================================
   Módulo: Calendario
   ============================================================ */

/* ---------------- calendario ---------------- */
function cambiarMes(delta){
  state.calMonth += delta;
  if(state.calMonth<0){ state.calMonth=11; state.calYear--; }
  if(state.calMonth>11){ state.calMonth=0; state.calYear++; }
  renderCalendario();
}
function renderCalendario(){
  document.getElementById('cal-titulo').textContent = MESES[state.calMonth]+' '+state.calYear;
  const first = new Date(state.calYear, state.calMonth, 1);
  const startIdx = (first.getDay()+6)%7; // Monday=0
  const daysInMonth = new Date(state.calYear, state.calMonth+1, 0).getDate();
  const today = todayStr();

  let html = DIAS.map(d=>'<div class="cal-dow">'+d+'</div>').join('');
  for(let i=0;i<startIdx;i++) html += '<div class="cal-cell blank"></div>';
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = state.calYear+'-'+String(state.calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const evs = state.eventos.filter(e=>e.fecha===dateStr);
    const isToday = dateStr===today;
    let evsHtml = evs.slice(0,3).map(e=>{
      const cls = e.estado==='Cancelado' ? 'canc' : (e.estado==='Realizado' ? 'ok' : 'pend');
      const label = e.empresa.length>16 ? e.empresa.slice(0,15)+'…' : e.empresa;
      return '<div class="cal-ev '+cls+'" onclick="irAFecha(\''+dateStr+'\')">'+label+'</div>';
    }).join('');
    if(evs.length>3) evsHtml += '<div class="cal-more">+'+(evs.length-3)+' más</div>';
    html += '<div class="cal-cell'+(isToday?' today':'')+'"><div class="dnum">'+d+'</div>'+evsHtml+'</div>';
  }
  document.getElementById('cal-grid').innerHTML = html;
}
function irAFecha(dateStr){
  state.filtroFecha = dateStr;
  state.selectedEventId = null;
  switchTab('eventos');
}
