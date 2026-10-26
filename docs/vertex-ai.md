# Conectar Vertex AI paso a paso

1. Entra a <https://console.cloud.google.com> y selecciona (o crea) un proyecto. Copia su **ID de proyecto**.
2. Menú ☰ → *APIs y servicios → Biblioteca* → busca **Vertex AI API** → *Habilitar*. Si pide activar la facturación, hazlo (hay crédito gratuito para cuentas nuevas).
3. Menú ☰ → *IAM y administración → Cuentas de servicio → Crear cuenta de servicio*. Nombre: `impulsopyme`.
4. En «Otorgar acceso», elige el rol **Usuario de Vertex AI** (`roles/aiplatform.user`) y finaliza.
5. Abre la cuenta creada → pestaña *Claves* → *Agregar clave → Crear clave nueva → JSON*. Se descarga un archivo.
6. En ImpulsoPYME: **Ajustes → Inteligencia artificial → Conectar** y selecciona el archivo. Verás proyecto, región y modelo.
7. Ve a **Análisis con IA → Asistente → Generar resumen**.

## Cómo se usa la IA

* El **pronóstico, las anomalías y las recomendaciones de inventario** se calculan en el servidor con estadística propia (no consumen cuota de Google).
* El **asistente** envía a Gemini únicamente cifras agregadas (pronóstico, alertas, productos por pedir) y recibe un resumen en lenguaje natural con acciones.
* El resultado se guarda por día e idioma; «Generar de nuevo» fuerza una consulta nueva.

## Variables útiles

| Variable | Uso |
| --- | --- |
| `GOOGLE_CLOUD_LOCATION` | Región (por defecto `us-central1`) |
| `VERTEX_MODEL` | Modelo (por defecto `gemini-2.5-flash`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta a la llave si no la subes desde Ajustes |
