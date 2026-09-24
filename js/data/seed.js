/* ============================================================
   Datos de ejemplo (arranque y modo local)
   ============================================================ */

/* ---------------- seed data (used to bootstrap db, and as local fallback) ---------------- */
const SEED = {
  tiposEvento: [
    {id:'taller-basico', nombre:'Taller Básico', tarifaBase:60000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0},
    {id:'taller-especializado', nombre:'Taller Especializado', tarifaBase:90000, refrigerio1:10000, refrigerio2:8000, subsidioTransporte:8000},
    {id:'curso-especializado', nombre:'Curso Especializado', tarifaBase:70000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0},
    {id:'fotocabina-wally', nombre:'Fotocabina Wally', tarifaBase:50000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:8000},
    {id:'fotocabina-eva', nombre:'Fotocabina Eva', tarifaBase:55000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:8000},
    {id:'fotografia-video', nombre:'Fotografía y/o Video', tarifaBase:135000, refrigerio1:10000, refrigerio2:8000, subsidioTransporte:0},
    {id:'espejo-magico', nombre:'Espejo Mágico', tarifaBase:70000, refrigerio1:0, refrigerio2:0, subsidioTransporte:0},
    {id:'apoyo-logistico', nombre:'Apoyo Logístico', tarifaBase:50000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0},
  ],
  empleados: [
    {id:'1019011109', nombre:'Alejandra Ramirez Mesa', telefono:'3001112201', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112201', eps:'Famisanar', talla:'M', encargado:false, docs:{cedula:true,contrato:true,eps:false}},
    {id:'1031540028', nombre:'Ana Saray Forero Buitrago', telefono:'3001112203', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112203', eps:'Salud Total', talla:'S', encargado:false, docs:{cedula:true,contrato:false,eps:false}},
    {id:'1023870841', nombre:'Andrea Viviana Vargas Orduz', telefono:'3001112204', correo:'', cuentaPago:'Cuenta bancaria', numeroCuenta:'24073118020', eps:'Compensar', talla:'M', encargado:true, docs:{cedula:true,contrato:true,eps:true}},
    {id:'1032456789', nombre:'Zully Melissa Bonilla Fonseca', telefono:'3001112205', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112205', eps:'Sura', talla:'S', encargado:true, docs:{cedula:true,contrato:true,eps:true}},
    {id:'1019876543', nombre:'Óscar Daniel Canelo González', telefono:'3001112206', correo:'', cuentaPago:'Daviplata', numeroCuenta:'3001112206', eps:'Nueva EPS', talla:'L', encargado:false, docs:{cedula:true,contrato:false,eps:false}},
    {id:'1030112233', nombre:'Julian David Barreto Medina', telefono:'3001112207', correo:'', cuentaPago:'Nequi', numeroCuenta:'@barreto2408', eps:'Sanitas', talla:'M', encargado:false, docs:{cedula:true,contrato:true,eps:false}},
    {id:'1022998877', nombre:'Nicolás Ruíz', telefono:'3001112208', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112208', eps:'Compensar', talla:'M', encargado:true, docs:{cedula:true,contrato:true,eps:false}},
    {id:'1019334455', nombre:'Valeria Neira Silva', telefono:'3001112209', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112209', eps:'Famisanar', talla:'S', encargado:false, docs:{cedula:false,contrato:false,eps:false}},
    {id:'1020112244', nombre:'Leiser Duban Barahona Lara', telefono:'3001112210', correo:'', cuentaPago:'Cuenta bancaria', numeroCuenta:'44556677', eps:'Salud Total', talla:'L', encargado:true, docs:{cedula:true,contrato:true,eps:true}},
    {id:'1018556677', nombre:'Carlos Mario Hernández Pinilla', telefono:'3001112211', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112211', eps:'Sura', talla:'L', encargado:false, docs:{cedula:true,contrato:false,eps:false}},
    {id:'1024667788', nombre:'Daniela Ortiz Rangel', telefono:'3001112212', correo:'', cuentaPago:'Nequi', numeroCuenta:'3001112212', eps:'Compensar', talla:'S', encargado:false, docs:{cedula:true,contrato:true,eps:false}},
    {id:'1021778899', nombre:'Tatiana Paola Bernal Páez', telefono:'3001112213', correo:'', cuentaPago:'Daviplata', numeroCuenta:'3001112213', eps:'Nueva EPS', talla:'M', encargado:true, docs:{cedula:true,contrato:true,eps:true}},
    {id:'1017889900', nombre:'Yeny Paola Sotaquira Acosta', telefono:'', correo:'', cuentaPago:'Nequi', numeroCuenta:'', eps:'Famisanar', talla:'M', encargado:false, docs:{cedula:false,contrato:false,eps:false}},
  ],
  eventos: [
    {id:'ev1', fecha:'2026-09-01', horaAlistamiento:'08:00', horaInicio:'10:00', horaFin:'17:00', empresa:'Colsubsidio - Bloc 20 de Julio', lugar:'Bloc 20 de Julio', modalidad:'Presencial', tipoEventoId:'taller-basico', tipoEventoNombre:'Taller Básico', tarifaBase:60000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0, esFestivo:false, estado:'Realizado', observaciones:'', cambios:[],
      colaboradores:[{empleadoId:'1032456789', nombre:'Zully Melissa Bonilla Fonseca', esEncargado:true, horaLlegadaReal:'07:55', horaFinReal:'17:10', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'Recibo taxi $9.000', momentosDestacados:[{nota:'Buena participación del público, se agotó material de muestras.', fecha:'2026-09-01'}], estadoPago:'Pagado'}]},
    {id:'ev2', fecha:'2026-09-02', horaAlistamiento:'09:30', horaInicio:'11:00', horaFin:'18:00', empresa:'T.EN COLOMBIA', lugar:'Cl. 38 #8-62', modalidad:'Presencial', tipoEventoId:'taller-basico', tipoEventoNombre:'Taller Básico', tarifaBase:60000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0, esFestivo:false, estado:'Realizado', observaciones:'', cambios:[],
      colaboradores:[{empleadoId:'1030112233', nombre:'Julian David Barreto Medina', esEncargado:false, horaLlegadaReal:'09:25', horaFinReal:'18:05', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'}]},
    {id:'ev3', fecha:'2026-09-03', horaAlistamiento:'08:00', horaInicio:'08:00', horaFin:'11:59', empresa:'Colsubsidio - Hocol', lugar:'Ofc. Minuto de Dios', modalidad:'Virtual', tipoEventoId:'taller-basico', tipoEventoNombre:'Taller Básico', tarifaBase:60000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0, esFestivo:false, estado:'Realizado', observaciones:'', cambios:[],
      colaboradores:[{empleadoId:'1017889900', nombre:'Yeny Paola Sotaquira Acosta', esEncargado:false, horaLlegadaReal:'08:00', horaFinReal:'12:00', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'}]},
    {id:'ev4', fecha:'2026-09-04', horaAlistamiento:'06:00', horaInicio:'08:00', horaFin:'11:59', empresa:'Banco de la República', lugar:'Sede principal', modalidad:'Presencial', tipoEventoId:'taller-especializado', tipoEventoNombre:'Taller Especializado', tarifaBase:90000, refrigerio1:10000, refrigerio2:8000, subsidioTransporte:8000, esFestivo:false, estado:'Cancelado', observaciones:'Cliente canceló por lluvia.', cambios:[{fecha:'2026-09-03T18:00:00.000Z', resumen:'Evento cancelado por el cliente.'}],
      colaboradores:[{empleadoId:'1024667788', nombre:'Daniela Ortiz Rangel', esEncargado:false, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'}]},
    {id:'ev5', fecha:'2026-09-08', horaAlistamiento:'13:00', horaInicio:'15:00', horaFin:'23:59', empresa:'EYC Proveedores SAS - Bavaria', lugar:'Planta Bavaria', modalidad:'Presencial', tipoEventoId:'fotocabina-eva', tipoEventoNombre:'Fotocabina Eva', tarifaBase:55000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:8000, esFestivo:false, estado:'Realizado', observaciones:'', cambios:[],
      colaboradores:[
        {empleadoId:'1032456789', nombre:'Zully Melissa Bonilla Fonseca', esEncargado:true, horaLlegadaReal:'12:50', horaFinReal:'23:50', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[{nota:'Cliente pidió extender 1 hora, se coordinó con logística.', fecha:'2026-09-08'}], estadoPago:'Pendiente'},
        {empleadoId:'1019876543', nombre:'Óscar Daniel Canelo González', esEncargado:false, horaLlegadaReal:'12:55', horaFinReal:'23:55', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
      ]},
    {id:'ev6', fecha:'2026-09-11', horaAlistamiento:'06:00', horaInicio:'09:00', horaFin:'16:00', empresa:'Colsubsidio - Club Colina', lugar:'Club Colina', modalidad:'Presencial', tipoEventoId:'fotocabina-wally', tipoEventoNombre:'Fotocabina Wally', tarifaBase:50000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:8000, esFestivo:false, estado:'Programado', observaciones:'', cambios:[],
      colaboradores:[
        {empleadoId:'1022998877', nombre:'Nicolás Ruíz', esEncargado:true, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
        {empleadoId:'1019334455', nombre:'Valeria Neira Silva', esEncargado:false, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
      ]},
    {id:'ev7', fecha:'2026-09-14', horaAlistamiento:'08:30', horaInicio:'11:59', horaFin:'14:00', empresa:'MSolutions Media - Politécnico Gran Colombiano', lugar:'Campus Principal del Poli', modalidad:'Presencial', tipoEventoId:'espejo-magico', tipoEventoNombre:'Espejo Mágico', tarifaBase:70000, refrigerio1:0, refrigerio2:0, subsidioTransporte:0, esFestivo:false, estado:'Programado', observaciones:'', cambios:[],
      colaboradores:[{empleadoId:'1031540028', nombre:'Ana Saray Forero Buitrago', esEncargado:false, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'}]},
    {id:'ev8', fecha:'2026-09-16', horaAlistamiento:'05:00', horaInicio:'08:00', horaFin:'15:00', empresa:'Colsubsidio - Dirección Seccional', lugar:'Dirección Seccional', modalidad:'Presencial', tipoEventoId:'apoyo-logistico', tipoEventoNombre:'Apoyo Logístico', tarifaBase:50000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0, esFestivo:false, estado:'Programado', observaciones:'', cambios:[],
      colaboradores:[
        {empleadoId:'1020112244', nombre:'Leiser Duban Barahona Lara', esEncargado:true, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
        {empleadoId:'1018556677', nombre:'Carlos Mario Hernández Pinilla', esEncargado:false, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
      ]},
    {id:'ev9', fecha:'2026-09-21', horaAlistamiento:'08:00', horaInicio:'10:00', horaFin:'17:00', empresa:'Colsubsidio - Bloc 20 de Julio', lugar:'Bloc 20 de Julio', modalidad:'Presencial', tipoEventoId:'curso-especializado', tipoEventoNombre:'Curso Especializado', tarifaBase:70000, refrigerio1:10000, refrigerio2:0, subsidioTransporte:0, esFestivo:true, estado:'Programado', observaciones:'Festivo — confirmar con el cliente.', cambios:[],
      colaboradores:[{empleadoId:'1021778899', nombre:'Tatiana Paola Bernal Páez', esEncargado:true, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'}]},
    {id:'ev10', fecha:'2026-09-25', horaAlistamiento:'09:00', horaInicio:'09:00', horaFin:'16:00', empresa:'ARTO SAS', lugar:'Oficina Arto', modalidad:'Presencial', tipoEventoId:'curso-especializado', tipoEventoNombre:'Curso Especializado (capacitación interna)', tarifaBase:60000, refrigerio1:0, refrigerio2:0, subsidioTransporte:0, esFestivo:false, estado:'Programado', observaciones:'', cambios:[],
      colaboradores:[
        {empleadoId:'1023870841', nombre:'Andrea Viviana Vargas Orduz', esEncargado:true, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
        {empleadoId:'1030112233', nombre:'Julian David Barreto Medina', esEncargado:false, horaLlegadaReal:'', horaFinReal:'', cumpleHorario:true, cumpleUniforme:true, horasExtra:0, bonoLibre:0, comprobanteTransporte:'', momentosDestacados:[], estadoPago:'Pendiente'},
      ]},
  ],
  gastos: [
    {id:'ga1', fecha:'2026-09-01', empleadoId:'1032456789', empleadoNombre:'Zully Melissa Bonilla Fonseca', concepto:'Cinta y marcadores para taller Colsubsidio', valor:25000, comprobante:'Foto factura Papelería Central', estadoReembolso:'Pendiente'},
    {id:'ga2', fecha:'2026-09-02', empleadoId:'1030112233', empleadoNombre:'Julian David Barreto Medina', concepto:'Material impreso taller T.EN Colombia', valor:18000, comprobante:'Factura Punto Digital', estadoReembolso:'Reembolsado'},
    {id:'ga3', fecha:'2026-09-08', empleadoId:'1019876543', empleadoNombre:'Óscar Daniel Canelo González', concepto:'Baterías para fotocabina', valor:32000, comprobante:'Recibo Éxito', estadoReembolso:'Pendiente'},
    {id:'ga4', fecha:'2026-09-11', empleadoId:'1022998877', empleadoNombre:'Nicolás Ruíz', concepto:'Transporte de equipos a Club Colina', valor:15000, comprobante:'Recibo taxi', estadoReembolso:'Pendiente'},
  ],
  directorio: [
    {id:'di1', canal:'Coordinación general', responsable:'Sergio Arturo Espinoza', tipo:'WhatsApp', contacto:'+57 300 000 0000'},
    {id:'di2', canal:'Programación de eventos', responsable:'Zully Bonilla (líder de campo)', tipo:'WhatsApp', contacto:'Grupo "Arto Eventos"'},
    {id:'di3', canal:'Nómina y pagos', responsable:'Contabilidad Arto', tipo:'Correo', contacto:'pagos@arto.com.co'},
    {id:'di4', canal:'Soporte del aplicativo', responsable:'Arturo (consultor)', tipo:'Correo', contacto:'arturo.espi112@gmail.com'},
    {id:'di5', canal:'Emergencias en evento', responsable:'Línea de guardia', tipo:'Llamada', contacto:'300 000 0001'},
  ],
  config: {valorHoraExtra:8000, bonoEncargado:15000, bonoFestivo:20000},
};
