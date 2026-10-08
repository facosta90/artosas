/* ============================================================
   Módulo: Exportar la nómina a Excel
   Mismo formato del archivo de pagos de la oficina: una hoja por
   colaborador ("Resumen de Pago") y, cuando se exportan todos, una
   primera hoja "Resumen" con el total por persona.
   Usa la librería SheetJS incluida en js/vendor (se carga solo al exportar).
   ============================================================ */

let xlsxCargando = null;
function cargarXlsx(){
  if(window.XLSX) return Promise.resolve(window.XLSX);
  if(xlsxCargando) return xlsxCargando;
  xlsxCargando = new Promise((ok, mal)=>{
    const s = document.createElement('script');
    s.src = 'js/vendor/xlsx.mini.min.js';
    s.onload = ()=> window.XLSX ? ok(window.XLSX) : mal(new Error('XLSX no disponible'));
    s.onerror = ()=>{ xlsxCargando = null; mal(new Error('No se pudo cargar js/vendor/xlsx.mini.min.js')); };
    document.head.appendChild(s);
  });
  return xlsxCargando;
}

const FMT_PESOS = '"$"#,##0';
const COLS_RECIBO = ['Fecha','Quincena','Nombre Colaborador','Cuenta Pago + Numero Cuenta','Hora Alistamiento','Hora Inicio','Hora Fin',
  'Tarifa Jornada','Ref 1','Ref 2','Bonificaciones adicionales','Subsidio transporte','Empresa','Tipo Evento','Pago Horas Extras','Total Jornada',
  'Llegada real','Salida real','Horas extra','Estado pago','Observación'];

function celdaPesos(v){ return {t:'n', v:Number(v)||0, z:FMT_PESOS}; }
function nombreHoja(nombre, usados){
  let base = String(nombre||'Hoja').replace(/[\[\]\*\?\/\\:]/g,' ').trim().slice(0,31) || 'Hoja';
  let n = base, i = 2;
  while(usados.has(n.toLowerCase())){ const suf = ' ('+i+')'; n = base.slice(0, 31-suf.length)+suf; i++; }
  usados.add(n.toLowerCase());
  return n;
}

/* Hoja de un colaborador, con el encabezado "Resumen de Pago" y la fila TOTAL. */
function hojaRecibo(XLSX, emp, jornadas, ym, q){
  const cuenta = ((emp.cuentaPago||'')+' '+(emp.numeroCuenta||'')).trim();
  const filaIni = 8, filaFin = filaIni + jornadas.length - 1, filaTotal = filaIni + jornadas.length;
  let total = 0;
  const aoa = [
    ['Resumen de Pago'],
    ['Empleado:', emp.nombre],
    ['Mes:', nombreMes(ym)],
    ['Quincena:', q || 'Mes completo'],
    ['TOTAL A PAGAR:', null],
    [],
    COLS_RECIBO,
  ];
  jornadas.forEach((j, i)=>{
    const e = j.evento, c = j.colab, d = desglosePago(e, c), f = filaIni + i;
    total += d.total;
    const obs = [];
    if(c.esEncargado) obs.push('Encargado');
    if(e.esFestivo) obs.push('Festivo');
    if(!d.cumple) obs.push('Sin refrigerios ni transporte: no cumplió '+(!d.calc.cumpleHorario?'horario':'uniforme'));
    else if(d.calc.minutosTarde>0) obs.push('Llegó '+d.calc.minutosTarde+' min después (dentro de la tolerancia)');
    if(d.calc.origenHorario==='manual' || d.calc.origenExtra==='manual') obs.push('Ajuste manual');
    aoa.push([
      fmtFecha(e.fecha), quincenaDe(e.fecha), emp.nombre, cuenta, e.horaAlistamiento||'', e.horaInicio||'', e.horaFin||'',
      celdaPesos(d.tarifa), celdaPesos(d.ref1), celdaPesos(d.ref2), celdaPesos(d.encargado + d.festivo + d.bonoLibre), celdaPesos(d.transporte),
      e.empresa, e.tipoEventoNombre, celdaPesos(d.horasExtra),
      {t:'n', v:d.total, z:FMT_PESOS, f:'SUM(H'+f+'+I'+f+'+J'+f+'+K'+f+'+L'+f+'+O'+f+')'},
      c.horaLlegadaReal||'', c.horaFinReal||'', {t:'n', v:d.horasExtraCant}, c.estadoPago||'Pendiente', obs.join(' · '),
    ]);
  });
  const filaT = new Array(16).fill(null);
  filaT[14] = 'TOTAL';
  filaT[15] = jornadas.length ? {t:'n', v:total, z:FMT_PESOS, f:'SUM(P'+filaIni+':P'+filaFin+')'} : celdaPesos(0);
  aoa.push(filaT);
  aoa[4][1] = {t:'n', v:total, z:FMT_PESOS, f:'P'+filaTotal};

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [12,9,30,24,11,9,9,13,10,10,14,13,32,22,13,14,11,11,10,12,48].map(w=>({wch:w}));
  return {ws, total};
}

function hojaResumen(XLSX, filas, ym, q){
  const aoa = [
    ['Resumen de pagos — Arto Operaciones'],
    ['Periodo:', textoPeriodo(ym, q)],
    ['Generado:', new Date().toLocaleString('es-CO')],
    [],
    ['Colaborador','Cédula','Cuenta Pago + Numero Cuenta','Jornadas','Pagado','Pendiente','Total'],
  ];
  const ini = aoa.length + 1;
  filas.forEach(r=>aoa.push([r.nombre, r.id, r.cuenta, {t:'n', v:r.jornadas}, celdaPesos(r.total - r.pendiente), celdaPesos(r.pendiente), celdaPesos(r.total)]));
  const fin = aoa.length;
  if(filas.length){
    const s = col=>({t:'n', z:FMT_PESOS, v:filas.reduce((a,r)=>a+(col==='E'?r.total-r.pendiente:col==='F'?r.pendiente:r.total),0), f:'SUM('+col+ini+':'+col+fin+')'});
    aoa.push(['TOTAL', null, null, {t:'n', v:filas.reduce((a,r)=>a+r.jornadas,0), f:'SUM(D'+ini+':D'+fin+')'}, s('E'), s('F'), s('G')]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [34,14,28,10,14,14,14].map(w=>({wch:w}));
  return ws;
}

async function exportarNominaExcel(){
  if(!esGerente()) return;
  const empId = document.getElementById('nomina-empleado').value;
  const {ym, q, lista} = jornadasDelPeriodo(empId);
  if(!lista.length){ toast('No hay jornadas en este periodo para exportar.'); return; }
  let XLSX;
  try{ XLSX = await cargarXlsx(); }
  catch(e){ console.error(e); toast('❌ No se pudo cargar el exportador de Excel. Revisa que exista js/vendor/xlsx.mini.min.js.'); return; }

  // agrupar por colaborador
  const grupos = {};
  lista.forEach(j=>{ (grupos[j.colab.empleadoId] = grupos[j.colab.empleadoId] || {nombreEvento:j.colab.nombre, jornadas:[]}).jornadas.push(j); });
  const personas = Object.keys(grupos).map(id=>{
    const emp = state.empleados.find(e=>e.id===id) || {id, nombre:grupos[id].nombreEvento, cuentaPago:'', numeroCuenta:''};
    return {emp, jornadas:grupos[id].jornadas};
  }).sort((a,b)=>a.emp.nombre.localeCompare(b.emp.nombre));

  const wb = XLSX.utils.book_new();
  const usados = new Set();
  const hojas = [], resumen = [];
  personas.forEach(p=>{
    const {ws, total} = hojaRecibo(XLSX, p.emp, p.jornadas, ym, q);
    const pendiente = p.jornadas.reduce((s,j)=> s + (j.colab.estadoPago!=='Pagado' ? calcularTotal(j.evento, j.colab) : 0), 0);
    resumen.push({id:p.emp.id, nombre:p.emp.nombre, cuenta:((p.emp.cuentaPago||'')+' '+(p.emp.numeroCuenta||'')).trim(), jornadas:p.jornadas.length, total, pendiente});
    hojas.push({nombre:p.emp.nombre, ws});
  });
  if(!empId){ usados.add('resumen'); XLSX.utils.book_append_sheet(wb, hojaResumen(XLSX, resumen, ym, q), 'Resumen'); }
  hojas.forEach(h=>XLSX.utils.book_append_sheet(wb, h.ws, nombreHoja(h.nombre, usados)));

  const mes = nombreMes(ym).replace(' ', '_');
  const quien = empId ? '_'+personas[0].emp.nombre.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g,'_').slice(0,40) : '';
  XLSX.writeFile(wb, 'Pagos_'+mes+(q?'_'+q:'')+quien+'.xlsx');
  toast('Excel generado: '+personas.length+' colaborador(es).');
}
