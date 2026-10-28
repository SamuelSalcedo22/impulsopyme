# ImpulsoPYME

![Pruebas](https://github.com/SamuelSalcedo22/impulsopyme/actions/workflows/ci.yml/badge.svg)

Sistema de gestión y análisis para pequeños negocios colombianos: ventas, inventario, productos, clientes y proveedores, con un panel de control y **IA** que pronostica ventas, detecta anomalías y recomienda qué hacer. Apoya los **ODS 8** (trabajo decente y crecimiento económico) y **9** (industria, innovación e infraestructura).

> Proyecto de *Diseño de Interfaces de Software* · Universidad Cooperativa de Colombia, Pasto · Samuel Salcedo.

## Qué hace

| Sección | Para qué sirve |
| --- | --- |
| Panel | Ventas del periodo, utilidad, margen, productos estrella, categorías y alertas de hoy |
| Ventas | Punto de venta táctil, historial y anulación (devuelve el inventario) |
| Inventario | Productos, categorías, existencias mínimas y ajustes por entrada, merma o conteo |
| Clientes / Proveedores | Historial de compras, tiempos de entrega y productos surtidos |
| Análisis con IA | Pronóstico con rango probable, días anómalos con su causa, qué pedir y asistente con Vertex AI |
| Reportes | CSV de ventas, productos e inventario (abren en Excel) |
| Ajustes | Cuenta, negocio, idioma (ES/EN) y conexión con Google Cloud |

El tipo de negocio se elige al registrarse (tienda de barrio, restaurante, papelería o ferretería) y carga un catálogo de ejemplo de 4 meses de ventas.

## Cómo funciona

La app instalable (Windows y Mac) es una ventana al **servidor en línea**: el servidor guarda los datos en PostgreSQL y llama a Vertex AI con credenciales que solo existen allí. Quien instala la app no configura nada: abre, inicia sesión y usa.

Guía completa de despliegue (Neon + Render + Vertex AI): [`docs/despliegue.md`](docs/despliegue.md).

## Instalar la app (usuarios)

Descarga el instalador desde la página **Releases** del repositorio:

* **Windows:** `ImpulsoPYME-…-win-x64.exe` (si Windows avisa «protegió su equipo», pulsa *Más información → Ejecutar de todas formas*, porque la app no está firmada).
* **Mac:** `ImpulsoPYME-…-mac-arm64.dmg` (chips M1 o posteriores) o `…-mac-x64.dmg` (Intel). Arrastra la app a *Aplicaciones* y la primera vez ábrela con clic derecho → *Abrir*.

Necesita internet. La primera conexión del día puede tardar hasta un minuto mientras el servidor despierta.

## Ejecutar desde el código (desarrollo)

Necesitas **Node.js 22 LTS**, Git y una base PostgreSQL de desarrollo (una rama gratuita de Neon sirve).

```bash
git clone https://github.com/SamuelSalcedo22/impulsopyme.git
cd impulsopyme
npm install
cp .env.example .env   # en Windows: copy .env.example .env  y pega tu DATABASE_URL
npm start              # abre http://127.0.0.1:3000
```

Opcional: `npm run seed` crea el usuario demo (`demo` / `demo12345`). App de escritorio apuntando a otro servidor: `IMPULSOPYME_URL=http://127.0.0.1:3000 npm run electron`.

Pruebas: `npm test` (análisis, API, tokens de diseño y paridad ES/EN; requiere PostgreSQL, ver `.env.example`).

## Generar los instaladores

Lo hace GitHub Actions: define la variable `APP_URL` del repositorio con la dirección del servidor y sube una etiqueta.

```bash
git tag v1.0.0
git push origin v1.0.0
```

En la pestaña **Actions** verás el progreso; al terminar, los archivos aparecen en **Releases**. (Un `.dmg` solo puede construirse en macOS, por eso se usa GitHub Actions.)

## Vertex AI

En el servidor, las credenciales van en la variable de entorno `GOOGLE_CREDENTIALS_JSON` (ver [`docs/despliegue.md`](docs/despliegue.md)). Sin ellas la app funciona completa con el pronóstico y las alertas locales; con ellas se activa el **asistente** que redacta el resumen de la semana. La llave nunca llega al navegador y a Google solo viajan cifras agregadas (sin nombres de clientes).

## Arquitectura

```
public/             Interfaz (JavaScript sin framework, módulos ES)
  js/atoms          Botón, campo, chip, ícono, logo…
  js/molecules      Campo con etiqueta, pestañas, migas de pan, tarjeta de alerta…
  js/organisms      Barra lateral, barra superior, búsqueda Ctrl+K, gráficos SVG, modal
  js/templates      appShell, authLayout, pageHeader
  js/pages          Una por sección
  js/core           Router por hash, i18n, API, estado
  i18n/             es.json · en.json
design/tokens.json Tokens en 3 niveles (global → semántico → componente)
server/             Express + PostgreSQL (pg), análisis y Vertex AI
electron/           Ventana de escritorio que abre el servidor en línea
tests/              node --test
```

Decisiones de diseño y contenido en [`docs/`](docs): [voz y tono](docs/voz-y-tono.md) y [arquitectura de información](docs/arquitectura-de-informacion.md).

## Licencia

MIT

## Capturas

| Panel | Pronóstico |
| --- | --- |
| ![Panel](docs/capturas/panel.png) | ![Pronóstico](docs/capturas/pronostico.png) |

| Ventas | Inventario |
| --- | --- |
| ![Ventas](docs/capturas/ventas.png) | ![Inventario](docs/capturas/inventario.png) |

| Alertas | Proveedores | Móvil |
| --- | --- | --- |
| ![Alertas](docs/capturas/alertas.png) | ![Proveedores](docs/capturas/proveedores.png) | ![Móvil](docs/capturas/movil.png) |
