# Arto Operaciones — división del index.html (fase 1)

Mismo código que el `index.html` original, repartido en archivos. No se cambió lógica.
Se sigue usando `<script>` clásico (sin build, sin import/export), así que los
`onclick="..."` del HTML funcionan igual.

## Estructura
- `index.html` — solo la maqueta HTML + carga de CSS y scripts
- `css/styles.css` — todos los estilos
- `js/config.js` — CONFIG de Supabase (URL / anon key), DIAS, MESES
- `js/utils.js` — fmtCOP, fmtFecha, toast, uid, safeGetLocal…
- `js/state.js` — objeto `state`
- `js/data/seed.js` — datos de ejemplo / modo local
- `js/data/mappers.js` — camelCase <-> snake_case
- `js/data/api.js` — refetch* desde Supabase
- `js/data/data.js` — capa de datos `Data` (Supabase o local)
- `js/modules/*.js` — calendario, eventos, auth, mijornada, empleados, nomina, gastos, directorio
- `js/app.js` — init, pestañas, ajustes, selects; llama `init()` al final

## Orden de carga (importante)
config → utils → state → data/* → modules/* → app.js
`state.js` usa `safeGetLocal`, por eso `utils.js` va antes. `app.js` siempre de último.

## Pendiente
- El aviso "configura Supabase en index.html" ahora debería decir `js/config.js`.
- Probar en el hosting real con Supabase conectado (en la prueba se usó el modo local).
- Fase 2 (opcional): ES modules + addEventListener en lugar de onclick.
