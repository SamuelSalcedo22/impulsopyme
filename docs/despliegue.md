# Despliegue: servidor en línea (Render + Neon + Vertex AI)

La app de escritorio es solo una ventana: todo vive en el servidor.

```
App instalada (.exe / .dmg) ──https──▶  Render (Node + Express)  ──▶  Neon (PostgreSQL)
                                              └──────────────────▶  Vertex AI (credenciales en variables de entorno)
```

Así los datos son los mismos en tu computador y en el del profesor, y la IA funciona sin configurar nada.

## 1. Base de datos en Neon (gratis, sin tarjeta)

1. Entra a <https://neon.tech> e inicia sesión con GitHub.
2. *Create project* → nombre `impulsopyme`, región **AWS US East (N. Virginia)**.
3. En el panel, botón **Connect**: copia la cadena `postgresql://…?sslmode=require` de la rama `main`. Esa es la base de **producción**.
4. Para desarrollo crea una segunda base gratis: *Branches → Create branch* con nombre `desarrollo` y copia su cadena. Así tu computador y el servidor usan el mismo motor (PostgreSQL) sin mezclar datos.

Las tablas se crean solas la primera vez que arranca el servidor.

## 2. Servidor en Render

1. Entra a <https://render.com> con GitHub → **New → Blueprint** → elige el repositorio `impulsopyme`. Render lee `render.yaml`.
2. Cuando pida las variables:
   * `DATABASE_URL`: la cadena de Neon de producción (rama `main`).
   * `GOOGLE_CREDENTIALS_JSON`: la llave de Vertex en **base64** (paso 3).
   * `DEMO_USERNAME` y `DEMO_PASSWORD`: la cuenta que usará el profesor (por ejemplo `profesor` y una clave tuya). Se crea sola con 4 meses de datos de ejemplo.
3. Espera a que termine el despliegue. La dirección queda como `https://impulsopyme-xxxx.onrender.com`. Pruébala en el navegador: debe abrir la pantalla de inicio de sesión, y `/api/health` debe responder `{"ok":true}`.

> El plan gratuito de Render duerme el servidor tras 15 minutos sin uso; la primera visita tarda hasta un minuto en despertar (la app instalable muestra una pantalla de «Conectando…»). Antes de que el profesor la abra, entra tú una vez, o crea un monitor gratuito en <https://uptimerobot.com> que consulte `/api/health` cada 5 minutos.

## 3. Credenciales de Vertex AI como variable de entorno

En PowerShell, convierte el JSON descargado a base64 y cópialo al portapapeles:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\ruta\a\tu-llave.json")) | Set-Clipboard
```

Pega ese texto en `GOOGLE_CREDENTIALS_JSON` en Render (*Environment*). Si cambias de proyecto de Google, agrega también `GOOGLE_CLOUD_PROJECT`. La cuenta de servicio necesita el rol **Usuario de Vertex AI** (en consola puede aparecer como «Usuario de Agent Platform») y la API habilitada.

En Ajustes → Inteligencia artificial la app muestra «lista» y ya no ofrece subir llaves: el servidor las administra.

## 4. Apuntar el instalador al servidor

Elige una de las dos:

* **Recomendada:** en GitHub, *Settings → Secrets and variables → Actions → Variables → New repository variable*: nombre `APP_URL`, valor la dirección de Render (sin barra final). Al subir la etiqueta, el instalador se construye con esa dirección.
* O edita el archivo local: `npm run set-app-url -- https://impulsopyme-xxxx.onrender.com`, haz commit y sube.

Luego:

```powershell
git push origin main
git tag v1.0.0
git push origin v1.0.0
```

Los instaladores aparecen en **Releases**. Probar sin instalar: `$env:IMPULSOPYME_URL="https://impulsopyme-xxxx.onrender.com"; npm run electron`.

## 5. Desarrollo en tu computador

1. `npm install`
2. Copia `.env.example` como `.env` y pega en `DATABASE_URL` la cadena de la rama `desarrollo` de Neon (o la de un Postgres local).
3. `npm start` → <http://127.0.0.1:3000>. Opcional: `npm run seed` crea el usuario `demo`.
4. `npm test` usa `TEST_DATABASE_URL` (o `DATABASE_URL`) y trabaja en esquemas temporales que se borran solos.

## Variables de entorno

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | En producción | Firma de sesiones (Render la genera) |
| `GOOGLE_CREDENTIALS_JSON` | Para la IA | Llave de la cuenta de servicio (JSON o base64) |
| `GOOGLE_CLOUD_LOCATION`, `VERTEX_MODEL` | No | Región (`us-central1`) y modelo (`gemini-2.5-flash`) |
| `DEMO_USERNAME`, `DEMO_PASSWORD` | No | Cuenta que se crea sola si no existe |
| `NODE_ENV=production` | En el servidor | Bloquea la subida de llaves desde la app y activa el proxy seguro |
