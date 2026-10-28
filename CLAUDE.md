# ImpulsoPYME: guía para trabajar en el código

* Stack: Node 22, Express 5, PostgreSQL (`pg`), UI en JavaScript con módulos ES (sin framework), Tailwind 3 con tokens, Electron para escritorio.
* La interfaz sigue Atomic Design (`public/js/{atoms,molecules,organisms,templates,pages}`). No dupliques estilos: usa los tokens de `design/tokens.json` y vuelve a generar con `npm run build:css`.
* Ningún texto visible va en el código: agrégalo a `public/i18n/es.json` **y** `en.json`. `npm test` falla si falta alguna clave o un marcador.
* El servidor responde errores como `{error:{code, params}}`. El mensaje de tres partes (qué pasó / por qué / qué hacer) se escribe en `errors` de los diccionarios.
* Multi-negocio: toda consulta filtra por `business_id` (hay una prueba de aislamiento).
* Credenciales de Google solo en el servidor (`GOOGLE_CREDENTIALS_JSON`; en producción la app no permite subir llaves). Nunca las expongas al navegador.
* Datos en PostgreSQL con `server/db/connection.js`: `prepare(sql).get/all/run` es **asíncrono** (siempre `await`), usa marcadores `?` y los alias camelCase se conservan. Dentro de `db.transaction(async () => …)` las consultas comparten conexión. Pruebas: necesitan `TEST_DATABASE_URL` y usan un esquema temporal por archivo.
* La app de escritorio solo abre el servidor en línea (`electron/config.json`); la IA y los datos viven en el servidor. Ver `docs/despliegue.md`.
* Commits pequeños y en español, con prefijos `feat`, `fix`, `test`, `docs`, `build`, `ci`.
* Antes de subir: `npm test` y, si cambiaste la interfaz, `npm run smoke`.
