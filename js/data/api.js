/* ============================================================
   Recarga desde Supabase
   ============================================================ */

/* ---------------- refetch (Supabase no usa "onSnapshot"; recargamos y refrescamos) ---------------- */
async function refetchEmpleados(){ const {data} = await sb.from('empleados').select('*'); state.empleados = (data||[]).map(fromEmpleadoRow); poblarSelectsEmpleados(); }
async function refetchTipos(){ const {data} = await sb.from('tipos_evento').select('*'); state.tiposEvento = (data||[]).map(fromTipoRow); poblarSelectTipos(); }
async function refetchEventos(){ const {data} = await sb.from('eventos').select('*').order('fecha'); state.eventos = (data||[]).map(fromEventoRow); }
async function refetchGastos(){ const {data} = await sb.from('gastos').select('*').order('fecha', {ascending:false}); state.gastos = (data||[]).map(fromGastoRow); }
async function refetchDirectorio(){ const {data} = await sb.from('directorio').select('*'); state.directorio = data||[]; }
async function refetchConfig(){
  const {data} = await sb.from('config').select('*').eq('id','general').maybeSingle();
  if(data) state.config = {valorHoraExtra:data.valor_hora_extra||8000, bonoEncargado:data.bono_encargado||15000, bonoFestivo:data.bono_festivo||20000};
}
async function cargarTodoSupabase(){
  await Promise.all([refetchEmpleados(), refetchTipos(), refetchEventos(), refetchGastos(), refetchDirectorio(), refetchConfig()]);
  renderActiveTab();
}
