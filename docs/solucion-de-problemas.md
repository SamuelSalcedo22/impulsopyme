# Solución de problemas

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| `npm start` dice «Falta DATABASE_URL» | No existe el archivo `.env` | Copia `.env.example` como `.env` y pega la cadena de Neon (rama `desarrollo`) |
| La app instalada se queda en «Conectando…» | El servidor gratuito estaba dormido | Espera hasta un minuto; si aparece el aviso de conexión, pulsa *Reintentar* |
| «El servidor aún no tiene credenciales de Vertex AI» | Falta `GOOGLE_CREDENTIALS_JSON` en Render | Agrégala en Render → Environment (ver `docs/despliegue.md`) y redespliega |
| `npm test` falla al conectar | No hay PostgreSQL de pruebas | Define `TEST_DATABASE_URL` en `.env` (una rama de Neon o un Postgres local) |
| Puerto 3000 ocupado | Otro programa lo usa | `PORT=3100 npm start` (en PowerShell: `$env:PORT=3100; npm start`) |
| El asistente dice «Google no aceptó las credenciales» | Falta el rol o la llave venció | Revisa el rol *Usuario de Vertex AI* y sube una llave nueva |
| «El modelo de IA no está disponible» | API no habilitada o región sin ese modelo | Habilita Vertex AI API; prueba `GOOGLE_CLOUD_LOCATION=us-central1` |
| Windows muestra «Windows protegió su equipo» | El instalador no está firmado | *Más información → Ejecutar de todas formas* |
| Mac dice que no puede verificar al desarrollador | App sin firmar | Clic derecho sobre la app → *Abrir* |
| Quiero empezar de cero | — | Cierra la app y borra la carpeta `data/` (web) o la carpeta de datos de la app |
