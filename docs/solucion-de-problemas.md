# Solución de problemas

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| `npm install` o `npm start` fallan con `node:sqlite` no encontrado | Node anterior a 22.13 | Instala **Node 22 LTS** o superior desde nodejs.org y repite |
| Puerto 3000 ocupado | Otro programa lo usa | `PORT=3100 npm start` (en PowerShell: `$env:PORT=3100; npm start`) |
| El asistente dice «Google no aceptó las credenciales» | Falta el rol o la llave venció | Revisa el rol *Usuario de Vertex AI* y sube una llave nueva |
| «El modelo de IA no está disponible» | API no habilitada o región sin ese modelo | Habilita Vertex AI API; prueba `GOOGLE_CLOUD_LOCATION=us-central1` |
| Windows muestra «Windows protegió su equipo» | El instalador no está firmado | *Más información → Ejecutar de todas formas* |
| Mac dice que no puede verificar al desarrollador | App sin firmar | Clic derecho sobre la app → *Abrir* |
| Quiero empezar de cero | — | Cierra la app y borra la carpeta `data/` (web) o la carpeta de datos de la app |
