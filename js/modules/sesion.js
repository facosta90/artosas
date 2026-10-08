/* ============================================================
   Módulo: Sesión y roles
   - Lo primero que se ve es el inicio de sesión.
   - Gerente: ve todas las pestañas.
   - Empleado: solo Mi Jornada, Calendario y Eventos (consulta).
   El rol lo decide Supabase (tabla "administradores"); aquí solo se
   muestra u oculta. La protección real son las reglas de la base.
   ============================================================ */

const TABS_EMPLEADO = ['mijornada','calendario','eventos'];
let refrescoTimer = null;

function esGerente(){ return state.rol === 'gerente'; }
function puedeVerTab(tab){ return esGerente() || TABS_EMPLEADO.includes(tab); }

function mostrarPantallaLogin(){
  document.getElementById('app-shell').hidden = true;
  document.getElementById('login-screen').hidden = false;
  document.getElementById('login-demo').hidden = !usandoLocal;
}
function mostrarAplicativo(){
  document.getElementById('login-screen').hidden = true;
  document.getElementById('app-shell').hidden = false;
}

function aplicarRol(){
  document.querySelectorAll('[data-rol="gerente"]').forEach(el=>{ el.hidden = !esGerente(); });
  document.querySelectorAll('[data-rol="empleado"]').forEach(el=>{ el.hidden = esGerente(); });
  document.getElementById('settings-pop').hidden = true;
  const emp = state.empleados.find(e=>e.id===state.miId);
  // un gerente que no está en la lista de colaboradores no necesita la pestaña Mi Jornada
  const btnMJ = document.querySelector('.tab-btn[data-tab="mijornada"]');
  if(btnMJ) btnMJ.hidden = esGerente() && !emp;
  document.getElementById('sesion-nombre').textContent = (emp && emp.nombre) || state.miNombre || state.miId || '';
  document.getElementById('sesion-rol').textContent = esGerente() ? 'Gerente' : 'Empleado';
}

/* Entra al aplicativo con la sesión ya validada. En modo Supabase recibe el usuario autenticado. */
async function entrarAlAplicativo(user, opciones){
  opciones = opciones || {};
  if(sb){
    state.miId = (user.email||'').split('@')[0];
    state.miNombre = (user.user_metadata && user.user_metadata.nombre) || '';
    const r = await sb.rpc('es_gerente');
    if(r.error){
      console.error('es_gerente:', r.error);
      toast('⚠ Falta ejecutar en Supabase el SQL de roles y seguridad. Se entra como empleado.');
      state.rol = 'empleado';
    }else{
      state.rol = r.data === true ? 'gerente' : 'empleado';
    }
    // marca la ficha del colaborador como "con cuenta" (y guarda el teléfono dado al registrarse)
    const telPend = opciones.telefono || safeGetLocal('arto_tel_pend') || '';
    const reg = await sb.rpc('registrar_mi_cuenta', { p_telefono: telPend });
    if(!reg.error) safeRemoveLocal('arto_tel_pend');
    try{
      await cargarTodoSupabase();
      document.getElementById('modo-datos').textContent = 'Datos en vivo — compartidos para todo el equipo';
    }catch(e){
      console.error(e);
      document.getElementById('modo-datos').textContent = 'No se pudo conectar a Supabase — revisa la consola del navegador.';
    }
    clearInterval(refrescoTimer);
    refrescoTimer = setInterval(()=>{ if(state.miId) cargarTodoSupabase().catch(()=>{}); }, 25000); // refresco liviano para ver los cambios de otros
  }
  state.selectedEventId = null;
  state.filtroFecha = null;
  aplicarRol();
  mostrarAplicativo();
  onDataReady();
  switchTab(esGerente() ? 'calendario' : 'mijornada');
}

function limpiarSesionLocal(){
  if(typeof cerrarModal==='function') cerrarModal();
  clearInterval(refrescoTimer); refrescoTimer = null;
  state.miId = null; state.miNombre = ''; state.rol = null;
  state.selectedEventId = null; state.filtroFecha = null;
  if(sb){ state.empleados = []; state.eventos = []; state.gastos = []; state.directorio = []; }
  safeRemoveLocal('arto_mi_id'); safeRemoveLocal('arto_rol');
  mostrarLogin();
  ['mj-login-cedula','mj-login-pass'].forEach(id=>{ const el = document.getElementById(id); if(el) el.value = ''; });
  mostrarPantallaLogin();
}

async function cerrarSesion(){
  if(sb){ try{ await sb.auth.signOut(); }catch(e){} }
  limpiarSesionLocal();
}
function cambiarUsuario(){ return cerrarSesion(); }

/* ---- modo de demostración (sin Supabase) ---- */
function entrarDemoGerente(){
  state.miId = 'gerente-demo'; state.miNombre = 'Gerente (demo)'; state.rol = 'gerente';
  safeSetLocal('arto_mi_id', state.miId); safeSetLocal('arto_rol', 'gerente');
  entrarAlAplicativo();
}
function entrarLocalEmpleado(cedula){
  state.miId = cedula; state.rol = 'empleado';
  safeSetLocal('arto_mi_id', cedula); safeSetLocal('arto_rol', 'empleado');
  entrarAlAplicativo();
}
