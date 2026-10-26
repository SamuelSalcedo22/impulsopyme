# Seguridad

* Las contraseñas se guardan con **bcrypt**; las sesiones usan JWT firmado con un secreto que se genera en el equipo.
* El servidor escucha solo en `127.0.0.1`: no es accesible desde otras máquinas.
* Se aplican cabeceras de seguridad (CSP, `X-Content-Type-Options`, `frame-ancestors 'none'`) y límite de intentos de inicio de sesión.
* Todas las consultas SQL usan parámetros; toda salida HTML se escapa en la interfaz.
* La llave de Google Cloud se guarda en `credentials/` (permisos 600), está en `.gitignore` y nunca se envía al navegador.

Si encuentras una vulnerabilidad, abre un *issue* privado o escribe a samuel.salcedo@campusucc.edu.co.
