/* ============================================================
   Recarga desde Supabase
   El gerente lee las tablas completas. El empleado lee solo lo que
   las reglas de la base le permiten: su propia ficha y la
   programación (por la función "eventos_para_mi", que oculta los
   pagos de los demás).
   ============================================================ */

function avisarError(donde, error){ if(error) console.error('Supabase ('+donde+'):', error.message || error); }

async function refetchEmpleados(){ const {data, error} = await sb.from('empleados').select('*'); avisarError('empleados', error); state.empleados = (data||[]).map(fromEmpleadoRow); poblarSelectsEmpleados(); }
async function refetchTipos(){ const {data, error} = await sb.from('tipos_evento').select('*'); avisarError('tipos_evento', error); state.tiposEvento = (data||[]).map(fromTipoRow); poblarSelectTipos(); }
async function refetchEventos(){
  const {data, error} = esGerente()
    ? await sb.from('eventos').select('*').order('fecha')
    : await sb.rpc('eventos_para_mi');
  avisarError('eventos', error);
  state.eventos = (data||[]).map(fromEventoRow).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
}
async function refetchGastos(){ const {data, error} = await sb.from('gastos').select('*').order('fecha', {ascending:false}); avisarError('gastos', error); state.gastos = (data||[]).map(fromGastoRow); }
async function refetchDirectorio(){ const {data, error} = await sb.from('directorio').select('*'); avisarError('directorio', error); state.directorio = data||[]; }
async function refetchConfig(){
  const {data, error} = await sb.from('config').select('*').eq('id','general').maybeSingle();
  avisarError('config', error);
  if(data) state.config = {
    valorHoraExtra:data.valor_hora_extra||8000, bonoEncargado:data.bono_encargado||15000, bonoFestivo:data.bono_festivo||20000,
    // reglas del cálculo automático (columnas de 06_horas_extra.sql; si aún no existen se usan estos valores)
    autoHorario: data.auto_horario!==false,
    toleranciaMin: data.tolerancia_min==null ? 10 : Number(data.tolerancia_min),
    extraBloqueMin: Number(data.extra_bloque_min)===30 ? 30 : 60,
  };
}
async function cargarTodoSupabase(){
  if(!state.miId) return;
  if(esGerente()){
    await Promise.all([refetchEmpleados(), refetchTipos(), refetchEventos(), refetchGastos(), refetchDirectorio(), refetchConfig()]);
  }else{
    state.gastos = []; state.directorio = [];
    await Promise.all([refetchEmpleados(), refetchTipos(), refetchEventos(), refetchConfig()]);
  }
  if(!document.getElementById('app-shell').hidden){ aplicarRol(); renderActiveTab(); }
}
