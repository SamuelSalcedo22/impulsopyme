'use strict';
/**
 * Entorno de pruebas: PostgreSQL con un esquema propio por archivo (se borra al terminar),
 * así las pruebas corren en paralelo y nunca tocan los datos reales.
 * Usa TEST_DATABASE_URL (o DATABASE_URL); si no hay ninguna, el Postgres local por defecto.
 */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/impulsopyme_test';
process.env.DB_SCHEMA = `t_${process.pid}_${Math.random().toString(36).slice(2, 7)}`;
process.env.DB_SCHEMA_DROP = '1';
process.env.JWT_SECRET = 'prueba';
process.env.NODE_ENV = 'test';
process.env.DEMO_USERNAME = '';
