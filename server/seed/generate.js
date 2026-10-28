'use strict';
const { BUSINESS_TYPES, PROFILES } = require('./templates');
const { createRng } = require('./prng');
const { localDate, addDays, weekday, dateRange } = require('../utils/dates');
const config = require('../config');

const SERVICE_UNITS = new Set(['copia', 'hoja']);
const PAYMENT_WEIGHTS = [['cash', 0.6], ['transfer', 0.25], ['card', 0.09], ['credit', 0.06]];

function pickPayment(rng) {
  let r = rng.next();
  for (const [method, w] of PAYMENT_WEIGHTS) {
    if (r < w) return method;
    r -= w;
  }
  return 'cash';
}

/** Inserta muchas filas con pocas consultas (hasta 1000 filas por consulta). */
async function bulkInsert(db, table, columns, rows) {
  for (let i = 0; i < rows.length; i += 1000) {
    const chunk = rows.slice(i, i + 1000);
    const marks = `(${columns.map(() => '?').join(', ')})`;
    await db.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES ${chunk.map(() => marks).join(', ')}`, chunk.flat());
  }
}

function currentHour() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: config.TIMEZONE, hour: '2-digit', hour12: false }).formatToParts(new Date());
  return Number(parts.find((x) => x.type === 'hour').value) % 24;
}

/**
 * Carga catálogo, clientes y un historial de ventas realista (por defecto 120 días)
 * con patrones semanales, una tendencia suave, un pico y una caída para que la IA tenga qué detectar.
 */
async function seedBusiness(db, businessId, typeKey, { days = 120, seed = 20261111 } = {}) {
  const template = BUSINESS_TYPES[typeKey];
  if (!template) throw new Error(`Tipo de negocio desconocido: ${typeKey}`);
  const rng = createRng(seed);

  const tx = db.transaction(async () => {
    const insertCategory = db.prepare('INSERT INTO categories (business_id, name) VALUES (?, ?)');
    const categoryIds = {};
    for (const name of template.categories) categoryIds[name] = (await insertCategory.run(businessId, name)).lastInsertRowid;

    const insertSupplier = db.prepare('INSERT INTO suppliers (business_id, name, contact, phone, lead_time_days) VALUES (?, ?, ?, ?, ?)');
    const supplierIds = [];
    for (const s of template.suppliers) supplierIds.push((await insertSupplier.run(businessId, s.name, s.contact, s.phone, s.lead)).lastInsertRowid);

    const insertCustomer = db.prepare('INSERT INTO customers (business_id, name, phone) VALUES (?, ?, ?)');
    const customerIds = [];
    for (const [i, name] of template.customers.entries()) customerIds.push((await insertCustomer.run(businessId, name, `31${String(20000000 + i * 733911).slice(0, 8)}`)).lastInsertRowid);

    const insertProduct = db.prepare(
      `INSERT INTO products (business_id, sku, name, category_id, supplier_id, unit, price, cost, stock, min_stock, track_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const products = [];
    for (const [i, t] of template.products.entries()) {
      const tracked = !SERVICE_UNITS.has(t.unit);
      const minStock = tracked ? Math.max(2, Math.round(t.perDay * 2)) : 0;
      let stock = tracked ? Math.round(t.perDay * t.stockDays) : 0;
      if (t.special === 'low') stock = Math.max(1, Math.round(minStock * 0.55));
      if (t.special === 'risk') stock = Math.max(1, Math.round(t.perDay * 1.4));
      const sku = `${typeKey.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
      const id = (await insertProduct.run(businessId, sku, t.name, categoryIds[t.category], supplierIds[t.supplier], t.unit, t.price, t.cost, stock, minStock, tracked ? 1 : 0)).lastInsertRowid;
      products.push({ ...t, id, tracked });
    }

    const today = localDate();
    const first = addDays(today, -(days - 1));
    const spikeDate = addDays(today, -9);
    const dipDate = addDays(today, -21);
    const spikeCategory = template.categories.includes('Bebidas') ? 'Bebidas' : template.categories[0];
    const hourNow = currentHour();

    const pending = [];

    for (const date of dateRange(first, today)) {
      const dow = weekday(date);
      const t = dateRange(first, date).length;
      const growth = 1 + 0.0009 * t;
      const dayOfMonth = Number(date.slice(8, 10));
      const monthStart = typeKey === 'papeleria' && dayOfMonth <= 7 ? 1.45 : 1;
      const isToday = date === today;
      const elapsed = isToday ? Math.min(1, Math.max(0.08, (hourNow - 7) / 13)) : 1;

      const lines = [];
      for (const prod of products) {
        let lambda = prod.perDay * PROFILES[prod.profile][dow] * growth * monthStart * elapsed * rng.between(0.9, 1.1);
        if (date === spikeDate && prod.category === spikeCategory) lambda *= 2.6;
        if (date === dipDate) lambda *= 0.4;
        let qty = rng.poisson(lambda);
        const chunkMax = SERVICE_UNITS.has(prod.unit) ? 25 : 3;
        while (qty > 0) {
          const c = Math.min(qty, rng.int(1, chunkMax));
          lines.push({ prod, qty: c });
          qty -= c;
        }
      }
      if (!lines.length) continue;

      const basketCount = Math.max(1, Math.min(90, Math.round(lines.length / 2.4)));
      const baskets = Array.from({ length: basketCount }, () => new Map());
      for (const line of lines) {
        const basket = baskets[rng.int(0, basketCount - 1)];
        basket.set(line.prod.id, (basket.get(line.prod.id) || { prod: line.prod, qty: 0 }));
        basket.get(line.prod.id).qty += line.qty;
      }

      for (const basket of baskets) {
        if (!basket.size) continue;
        const items = [...basket.values()];
        let total = 0;
        for (const it of items) total += it.qty * it.prod.price;
        const maxHour = isToday ? Math.max(7, hourNow) : 20;
        const hh = String(rng.int(7, maxHour)).padStart(2, '0');
        const mm = String(rng.int(0, 59)).padStart(2, '0');
        const customerId = rng.next() < 0.3 ? rng.pick(customerIds) : null;
        pending.push({ customerId, total, method: pickPayment(rng), soldAt: `${date}T${hh}:${mm}:00-05:00`, date, items });
      }
    }

    // Las ventas se guardan por lotes: una consulta por cientos de filas en vez de una por fila (importa con una base remota).
    const ids = await db.prepare('SELECT nextval(pg_get_serial_sequence(\'sales\', \'id\')) AS id FROM generate_series(1, ?)').all(Math.max(1, pending.length));
    const saleRows = []; const itemRows = [];
    pending.forEach((sale, i) => {
      const saleId = ids[i].id;
      saleRows.push([saleId, businessId, sale.customerId, null, sale.total, sale.method, sale.soldAt, sale.date]);
      for (const it of sale.items) itemRows.push([saleId, it.prod.id, it.qty, it.prod.price, it.prod.cost]);
    });
    await bulkInsert(db, 'sales', ['id', 'business_id', 'customer_id', 'user_id', 'total', 'payment_method', 'sold_at', 'sold_date'], saleRows);
    await bulkInsert(db, 'sale_items', ['sale_id', 'product_id', 'quantity', 'unit_price', 'unit_cost'], itemRows);

    const movements = products.filter((x) => x.tracked).slice(0, 12)
      .map((prod) => [businessId, prod.id, Math.round(prod.perDay * 10), 'restock', `${addDays(today, -rng.int(3, 14))} 08:30:00`]);
    await bulkInsert(db, 'stock_movements', ['business_id', 'product_id', 'delta', 'reason', 'created_at'], movements);
  });

  await tx();
}

module.exports = { seedBusiness };
