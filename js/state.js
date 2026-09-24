/* ============================================================
   Estado global de la aplicación
   ============================================================ */

const state = {
  empleados: [], tiposEvento: [], eventos: [], gastos: [], directorio: [],
  config: { valorHoraExtra: 8000, bonoEncargado: 15000, bonoFestivo: 20000 },
  activeTab: 'calendario',
  calYear: new Date().getFullYear(), calMonth: new Date().getMonth(),
  selectedEventId: null,
  filtroFecha: null,
  editando: {}, // eventoId -> bool (modo edición de datos generales)
  momentoDraft: {}, // key "eventoId|empleadoId" -> texto
  miId: safeGetLocal('arto_mi_id'),
};
