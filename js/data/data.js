/* ============================================================
   Capa de datos (Supabase o local)
   ============================================================ */

/* ---------------- data layer (Supabase o local) ---------------- */
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
      }).eq('id','general');
      if(error){ toast('❌ '+error.message); throw error; }
      state.config = obj;
    }else{
      state.config = obj;
    }
  },
};
