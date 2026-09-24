/* ============================================================
   Configuración: constantes, Supabase, cliente
   ============================================================ */

/* ============================================================
   ARTO OPERACIONES — prototipo funcional
   Datos: capability "db" cuando está disponible; si no, modo
   local en memoria con la misma información de ejemplo.
   ============================================================ */

const DIAS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

/* ============================================================
   CONFIGURACIÓN DE SUPABASE — edita estas 2 líneas después de
   crear tu proyecto gratuito en https://supabase.com
   (ver GUIA_DESPLIEGUE.md paso a paso). Sin esto, la app funciona
   en modo de demostración local (cada navegador ve solo sus
   propios datos de ejemplo, no se comparte nada).
   ============================================================ */
const CONFIG = {
  SUPABASE_URL: 'https://vmaxcjhtplpmoenjmtgt.supabase.co',       // Ej: https://xxxxxxxxxxxx.supabase.co
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtYXhjamh0cGxwbW9lbmptdGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NjA1MjAsImV4cCI6MjEwNTMzNjUyMH0.CI7Y5uH9vt-Fx8syf1zHUUlmu9EaE2qytL4FQmJMVRU', // la llave pública "anon" del proyecto
  EMAIL_DOMAIN: 'colaboradores.arto-app.co',         // dominio interno (no real) para convertir la cédula en usuario de acceso
};

let sb = null;
let usandoLocal = false;
