/* ============================================================
   Módulo: Autenticación de colaboradores
   ============================================================ */

async function sha256Hex(texto){
  try{
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }catch(e){
    // Contexto sin SubtleCrypto (poco común) — hash simple de respaldo, solo para que el prototipo no se rompa.
    let h = 0;
    for(let i=0;i<texto.length;i++){ h = ((h<<5)-h+texto.charCodeAt(i))|0; }
    return 'fallback-'+h;
  }
}

function mostrarRegistro(ev){
  if(ev) ev.preventDefault();
  document.getElementById('mj-login-form').hidden = true;
  document.getElementById('mj-registro-form').hidden = false;
  document.getElementById('mj-auth-title').textContent = 'Crear mi cuenta';
  document.getElementById('mj-auth-sub').textContent = 'Regístrate una sola vez para poder marcar tu ingreso y tu salida.';
}
function mostrarLogin(ev){
  if(ev) ev.preventDefault();
  document.getElementById('mj-registro-form').hidden = true;
  document.getElementById('mj-login-form').hidden = false;
  document.getElementById('mj-auth-title').textContent = 'Iniciar sesión';
  document.getElementById('mj-auth-sub').textContent = 'Ingresa tu cédula y tu contraseña para ver tus eventos.';
}

async function iniciarSesion(){
  const cedula = document.getElementById('mj-login-cedula').value.trim();
  const pass = document.getElementById('mj-login-pass').value;
  if(!cedula || !pass){ toast('Ingresa tu cédula y tu contraseña.'); return; }

  if(sb){
    const email = cedula + '@' + CONFIG.EMAIL_DOMAIN;
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if(error){ toast('Cédula o contraseña incorrecta.'); return; }
    document.getElementById('mj-login-pass').value = '';
    await cargarTodoSupabase();
    renderMiJornada();
  }else{
    const emp = state.empleados.find(e=>e.id===cedula);
    if(!emp){ toast('No encontramos esa cédula. ¿Ya te registraste?'); return; }
    if(!emp.passHash){ toast('Esa cuenta aún no tiene contraseña creada — usa "Regístrate" para crearla.'); return; }
    const hash = await sha256Hex(pass);
    if(hash !== emp.passHash){ toast('Contraseña incorrecta.'); return; }
    state.miId = emp.id;
    safeSetLocal('arto_mi_id', emp.id);
    document.getElementById('mj-login-pass').value = '';
    renderMiJornada();
  }
}

async function registrarme(){
  const nombre = document.getElementById('mj-reg-nombre').value.trim();
  const cedula = document.getElementById('mj-reg-cedula').value.trim();
  const telefono = document.getElementById('mj-reg-telefono').value.trim();
  const pass = document.getElementById('mj-reg-pass').value;
  const pass2 = document.getElementById('mj-reg-pass2').value;
  if(!nombre || !cedula){ toast('Escribe tu nombre y tu cédula.'); return; }
  if(pass.length<4){ toast('La contraseña debe tener al menos 4 caracteres.'); return; }
  if(pass!==pass2){ toast('Las contraseñas no coinciden.'); return; }

  if(sb){
    const existente = state.empleados.find(e=>e.id===cedula);
    if(existente && existente.tieneCuenta){ toast('Esa cédula ya tiene una cuenta creada — inicia sesión.'); mostrarLogin(); return; }

    const email = cedula + '@' + CONFIG.EMAIL_DOMAIN;
    const { data, error } = await sb.auth.signUp({ email, password: pass, options:{ data:{ cedula, nombre } } });
    if(error){ toast('❌ No se pudo crear la cuenta: '+error.message); return; }

    if(existente){
      const patch = { tieneCuenta:true };
      if(telefono) patch.telefono = telefono;
      if(nombre) patch.nombre = nombre;
      await sb.from('empleados').update(toEmpleadoRow(patch)).eq('id', cedula);
    }else{
      await sb.from('empleados').insert(toEmpleadoRow({
        id: cedula, nombre, telefono, correo:'', cuentaPago:'Nequi', numeroCuenta:'', eps:'', talla:'M',
        encargado:false, docs:{cedula:false,contrato:false,eps:false}, tieneCuenta:true,
      }));
    }
    document.getElementById('mj-reg-pass').value = '';
    document.getElementById('mj-reg-pass2').value = '';

    if(!data.session){
      toast('Cuenta creada. Si tu proyecto pide confirmar el correo, pídele al administrador que desactive "Confirm email" en Supabase — mientras tanto, intenta iniciar sesión.');
      await refetchEmpleados();
      mostrarLogin();
      return;
    }
    await cargarTodoSupabase();
    toast('Cuenta creada. ¡Bienvenido/a, '+nombre+'!');
    renderMiJornada();
  }else{
    const existente = state.empleados.find(e=>e.id===cedula);
    if(existente && existente.passHash){ toast('Esa cédula ya tiene una cuenta creada — inicia sesión.'); mostrarLogin(); return; }

    const passHash = await sha256Hex(pass);
    if(existente){
      const patch = { passHash, tieneCuenta:true };
      if(telefono) patch.telefono = telefono;
      if(nombre) patch.nombre = nombre;
      await Data.updateEmpleado(cedula, patch);
    }else{
      await Data.addEmpleado({
        id: cedula, nombre, telefono, correo:'', cuentaPago:'Nequi', numeroCuenta:'', eps:'', talla:'M',
        encargado:false, docs:{cedula:false,contrato:false,eps:false}, passHash, tieneCuenta:true,
      });
    }
    state.miId = cedula;
    safeSetLocal('arto_mi_id', cedula);
    document.getElementById('mj-reg-pass').value = '';
    document.getElementById('mj-reg-pass2').value = '';
    toast('Cuenta creada. ¡Bienvenido/a, '+nombre+'!');
    renderMiJornada();
  }
}

async function cambiarUsuario(){
  if(sb){ await sb.auth.signOut(); }
  else{ safeRemoveLocal('arto_mi_id'); }
  state.miId = null;
  mostrarLogin();
  const c = document.getElementById('mj-login-cedula'); if(c) c.value = '';
  const p = document.getElementById('mj-login-pass'); if(p) p.value = '';
  renderMiJornada();
}
