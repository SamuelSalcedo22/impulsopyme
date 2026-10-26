# Voz y tono

**Voz** (siempre igual): cercana, clara y práctica, como un buen asesor de barrio. Habla de tú, usa verbos simples y el vocabulario del negocio (venta, fiado, existencias, pedido), no el del sistema.

**Tono** (cambia con el momento):

| Momento | Tono | Ejemplo |
| --- | --- | --- |
| Saludo / panel | Cálido | «Buenas noches, Samuel» |
| Éxito | Breve y concreto, mismo verbo del botón | Botón «Cobrar» → «Venta registrada por $25.000» |
| Alerta | Directo y accionable | «Cerveza Águila lata se agota pronto … Haz el pedido hoy.» |
| Error | Calmado, sin culpar ni disculparse | «El usuario o la contraseña no coinciden. Revísalos e intenta de nuevo.» |
| Vacío | Invita a actuar | «Aún no hay clientes. Registra a quienes te compran seguido…» |

## Mensajes de error: tres partes

1. **Qué pasó**, en lenguaje del usuario.
2. **Por qué**, solo si ayuda a decidir qué hacer.
3. **Qué hacer ahora.**

Nunca se muestran códigos internos. El servidor devuelve solo un código (`stock.insufficient`) y los parámetros; el texto sale de `public/i18n/<idioma>.json → errors`. Una prueba automática verifica que cada código tenga sus partes en ambos idiomas.

## Reglas de contenido

* Sin *lorem ipsum*: todos los datos de ejemplo son del contexto colombiano (Tienda Don Jaime, papa pastusa, Cerveza Águila).
* Un botón dice lo que hace («Guardar», «Cobrar», «Anular venta»), nunca «Enviar» o «OK».
* Una acción mantiene su nombre en todo el flujo.
* Lenguaje del sistema vs. lenguaje del usuario: «existencias», no «stock_qty»; «fiado», no «crédito diferido».

## Internacionalización

* Ningún botón tiene ancho fijo al texto: crece y el texto se parte, no se recorta.
* Barras de navegación con etiquetas que se ajustan a varias líneas; la barra lateral colapsa a íconos con `title`.
* Fechas, números y moneda con `Intl` según el idioma (COP).
* Plurales con claves `_one` / `_other`; los marcadores `{nombre}` deben coincidir entre idiomas (verificado por prueba).
