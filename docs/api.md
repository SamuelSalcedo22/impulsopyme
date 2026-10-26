# API

Base: `/api`. Todas las rutas (salvo `/auth/*` y `/health`) exigen `Authorization: Bearer <token>`. Los errores tienen la forma `{ "error": { "code": "stock.insufficient", "params": { … } } }`.

| Método y ruta | Descripción |
| --- | --- |
| `POST /auth/register` · `POST /auth/login` · `GET/PATCH /auth/me` · `PATCH /auth/business` | Cuenta y negocio |
| `GET /auth/business-types` | Tipos de negocio disponibles |
| `GET/POST /products`, `GET/PUT/DELETE /products/:id`, `POST /products/:id/stock` | Productos y ajuste de existencias |
| `GET/POST/PUT/DELETE /categories` | Categorías |
| `GET/POST /suppliers`, `GET/PUT/DELETE /suppliers/:id` | Proveedores |
| `GET/POST /customers`, `GET/PUT/DELETE /customers/:id` | Clientes |
| `GET/POST /sales`, `GET/DELETE /sales/:id` | Ventas (POST descuenta stock; DELETE anula y devuelve) |
| `GET /dashboard?range=30` | KPIs, serie diaria, top productos, categorías |
| `GET /search?q=` | Búsqueda global |
| `GET /ai/insights?horizon=14` | Pronóstico, anomalías, alertas y pedidos sugeridos |
| `POST /ai/narrative` | Resumen en lenguaje natural con Vertex AI |
| `GET /ai/status` · `PUT/DELETE /ai/credentials` | Estado y llave de Google |
| `GET /reports/{sales,products,inventory}.csv` | Descargas |
