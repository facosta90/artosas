/* ============================================================
   Capa de datos (Supabase o local)
   ============================================================ */

/* ---------------- data layer (Supabase o local) ---------------- */
let demoCodigo = null;   // solo modo demostración
function faltaSqlCorreo(error){ return /PGRST202|schema cache|Could not find the function/i.test((error.code||'')+' '+(error.message||'')); }

const Data = {
  async addEvento(obj){
    if(sb){
      const {error} = await sb.from('eventos').insert(toEventoRow(obj));
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchEventos();
      renderActiveTab();
    }else{
      state.eventos.push({id:uid(), ...obj}); state.eventos.sort((a,b)=>a.fecha.localeCompare(b.fecha)); renderActiveTab();
    }
  },
  async updateEvento(id, patch){
    if(sb){
      const {error} = await sb.from('eventos').update(toEventoRow(patch)).eq('id', id);
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchEventos();
      renderActiveTab();
    }else{
      const ev = state.eventos.find(e=>e.id===id); Object.assign(ev, patch); renderActiveTab();
    }
  },
  /* El empleado no edita el evento: solo su propia llegada, salida, comprobante y momentos. */
  async actualizarMiJornada(eventoId, patch){
    const {error} = await sb.rpc('actualizar_mi_jornada', { p_evento: String(eventoId), p_patch: patch });
    if(error){ toast('❌ '+error.message); throw error; }
    await refetchEventos();
    renderActiveTab();
  },
  async addEmpleado(obj){
    if(sb){
      const {error} = await sb.from('empleados').insert(toEmpleadoRow(obj));
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchEmpleados();
      renderActiveTab();
    }else{
      state.empleados.push({...obj}); poblarSelectsEmpleados(); renderActiveTab();
    }
  },
  async updateEmpleado(id, patch){
    if(sb){
      const {error} = await sb.from('empleados').update(toEmpleadoRow(patch)).eq('id', id);
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchEmpleados();
      renderActiveTab();
    }else{
      const e = state.empleados.find(x=>x.id===id); if(e) Object.assign(e, patch); poblarSelectsEmpleados(); renderActiveTab();
    }
  },
  /* El gerente pone una contraseña temporal a un colaborador que olvidó la suya. */
  async reiniciarClave(cedula, clave){
    if(sb){
      const {error} = await sb.rpc('reiniciar_clave', { p_cedula: String(cedula), p_clave: clave });
      if(error){
        const falta = /reiniciar_clave|schema cache|PGRST202/i.test((error.message||'')+(error.code||''));
        toast(falta ? '⚠ Falta ejecutar en Supabase el archivo 03_paquete1.sql.' : '❌ '+error.message);
        throw error;
      }
    }else{
      const e = state.empleados.find(x=>x.id===cedula);
      if(!e || !e.tieneCuenta){ toast('Esa cédula todavía no ha creado su cuenta.'); throw new Error('sin cuenta'); }
      e.passHash = await sha256Hex(clave);
    }
  },
  /* Cada persona cambia su propia contraseña. */
  async cambiarMiClave(clave){
    if(sb){
      const {error} = await sb.auth.updateUser({ password: clave });
      if(error){ toast('❌ '+error.message); throw error; }
    }else{
      const e = state.empleados.find(x=>x.id===state.miId);
      if(e) e.passHash = await sha256Hex(clave);
    }
  },
  /* --- recuperación por correo (sin sesión) --- */
  async solicitarCodigoClave(cedula){
    if(sb){
      const {error} = await sb.rpc('solicitar_codigo_clave', { p_cedula: String(cedula) });
      if(error){ toast(faltaSqlCorreo(error) ? '⚠ Falta ejecutar en Supabase el archivo 04_recuperar_por_correo.sql.' : '❌ '+error.message); throw error; }
    }else{
      // modo demostración: no hay correo, el código se muestra en pantalla
      const e = state.empleados.find(x=>x.id===cedula);
      if(e && e.tieneCuenta && e.correo){
        demoCodigo = { cedula, codigo: String(Math.floor(100000+Math.random()*900000)) };
        setTimeout(()=>toast('DEMO — en producción llega por correo. Código: '+demoCodigo.codigo), 300);
      }else{ demoCodigo = null; }
    }
  },
  async cambiarClaveConCodigo(cedula, codigo, clave){
    if(sb){
      const {data, error} = await sb.rpc('cambiar_clave_con_codigo', { p_cedula: String(cedula), p_codigo: codigo, p_clave: clave });
      if(error){ toast(faltaSqlCorreo(error) ? '⚠ Falta ejecutar en Supabase el archivo 04_recuperar_por_correo.sql.' : '❌ '+error.message); throw error; }
      return data === true;
    }
    if(!demoCodigo || demoCodigo.cedula!==cedula || demoCodigo.codigo!==codigo) return false;
    const e = state.empleados.find(x=>x.id===cedula);
    e.passHash = await sha256Hex(clave); demoCodigo = null;
    return true;
  },
  async guardarMiCorreo(correo){
    if(sb){
      const {error} = await sb.rpc('guardar_mi_correo', { p_correo: correo });
      if(error){ toast(faltaSqlCorreo(error) ? '⚠ Falta ejecutar en Supabase el archivo 04_recuperar_por_correo.sql.' : '❌ '+error.message); throw error; }
      await refetchEmpleados();
      renderActiveTab();
    }else{
      const e = state.empleados.find(x=>x.id===state.miId); if(e) e.correo = correo;
      renderActiveTab();
    }
  },
  /* Marca como pagadas varias jornadas de una vez. items = [{eventoId, empleadoId, patch}] */
  async marcarPagados(items){
    const porEvento = {};
    items.forEach(it=>{ (porEvento[it.eventoId] = porEvento[it.eventoId] || []).push(it); });
    if(sb) await refetchEventos();   // parte de los datos más recientes para no pisar cambios de otros
    for(const eventoId of Object.keys(porEvento)){
      const ev = state.eventos.find(e=>String(e.id)===String(eventoId));
      if(!ev) continue;
      const nuevos = ev.colaboradores.map(c=>{
        const it = porEvento[eventoId].find(x=>x.empleadoId===c.empleadoId);
        return it ? {...c, ...it.patch} : c;
      });
      if(sb){
        const {error} = await sb.from('eventos').update({colaboradores: nuevos}).eq('id', ev.id);
        if(error){ toast('❌ '+error.message); await refetchEventos(); renderActiveTab(); throw error; }
      }else{ ev.colaboradores = nuevos; }
    }
    if(sb) await refetchEventos();
    renderActiveTab();
  },
  async addGasto(obj){
    if(sb){
      const {error} = await sb.from('gastos').insert(toGastoRow(obj));
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchGastos();
      renderActiveTab(); renderMiniStats();
    }else{
      state.gastos.push({id:uid(), ...obj}); renderActiveTab(); renderMiniStats();
    }
  },
  async updateGasto(id, patch){
    if(sb){
      const {error} = await sb.from('gastos').update(toGastoRow(patch)).eq('id', id);
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchGastos();
      renderActiveTab(); renderMiniStats();
    }else{
      const g = state.gastos.find(x=>x.id===id); Object.assign(g, patch); renderActiveTab(); renderMiniStats();
    }
  },
  async addDirectorio(obj){
    if(sb){
      const {error} = await sb.from('directorio').insert(obj);
      if(error){ toast('❌ '+error.message); throw error; }
      await refetchDirectorio();
      renderActiveTab();
    }else{
      state.directorio.push({id:uid(), ...obj}); renderActiveTab();
    }
  },
  async setConfig(obj){
    if(sb){
      const {error} = await sb.from('config').update({
        valor_hora_extra: obj.valorHoraExtra, bono_encargado: obj.bonoEncargado, bono_festivo: obj.bonoFestivo,
        auto_horario: obj.autoHorario, tolerancia_min: obj.toleranciaMin, extra_bloque_min: obj.extraBloqueMin,
      }).eq('id','general');
      if(error){
        toast(/auto_horario|tolerancia_min|extra_bloque_min/.test(error.message||'') ? '⚠ Falta ejecutar en Supabase el archivo 06_horas_extra.sql.' : '❌ '+error.message);
        throw error;
      }
      state.config = obj;
    }else{
      state.config = obj;
    }
  },
};
