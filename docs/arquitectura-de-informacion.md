# Arquitectura de información

## Organización
Las secciones se agrupan por tarea del dueño del negocio, no por tablas de la base de datos:

| Grupo | Secciones | Pregunta que responde |
| --- | --- | --- |
| Inicio | Panel | ¿Cómo voy hoy? |
| Operación | Ventas · Inventario | ¿Qué vendo y qué tengo? |
| Relaciones | Clientes · Proveedores | ¿Con quién trabajo? |
| Inteligencia | Análisis con IA · Reportes | ¿Qué va a pasar y qué hago? |
| Cuenta | Ajustes | ¿Cómo lo configuro? |

La definición vive en un solo archivo: `public/js/organisms/nav.js`.

## Rotulado
Etiquetas de una o dos palabras, en el idioma del usuario, iguales en la barra lateral, las migas de pan, el título de la página y la búsqueda.

## Navegación
* **Global:** barra lateral colapsable (escritorio) y barra inferior con «Más» (móvil). Siempre visible.
* **Contextual:** migas de pan y pestañas por sección (`Ventas → Nueva venta | Historial`, `IA → Pronóstico | Alertas | Asistente`, `Ajustes → Mi cuenta | Mi negocio | IA`). El estado de la pestaña vive en la URL (`?tab=`), así se puede recargar o compartir.
* **Local:** filtros dentro de cada lista.

## Búsqueda
Paleta global **Ctrl/⌘ + K**: encuentra productos, clientes, proveedores, ventas por número y salta a cualquier sección.

## Atomic Design

| Nivel | Carpeta | Ejemplos |
| --- | --- | --- |
| Átomos | `js/atoms` | botón, campo, chip, ícono, logo, avatar |
| Moléculas | `js/molecules` | campo con etiqueta y error, pestañas, migas, tarjeta de alerta, stat |
| Organismos | `js/organisms` | barra lateral, barra superior, gráficos, modal, búsqueda |
| Plantillas | `js/templates` | `appShell`, `authLayout`, `pageHeader` |
| Páginas | `js/pages` | panel, ventas, inventario… |

## Tokens de diseño
`design/tokens.json` define tres niveles: **global** (valores crudos), **semántico** (propósito: `text.primary`, `action.primary`) y **componente** (`button.primary.bg.hover`). El script `scripts/build-tokens.js` los convierte en variables CSS y Tailwind lee solo los semánticos.
