'use strict';
/**
 * Plantillas por tipo de negocio. Contienen categorías, proveedores, clientes y productos
 * con precios realistas en COP, para que el panel nunca muestre datos vacíos ni "lorem ipsum".
 *
 * Cada producto: [nombre, categoría, unidad, costo, precio, ventasPorDía, perfilSemanal, proveedor, díasDeStock, especial]
 *  - perfilSemanal: clave de PROFILES (domingo ... sábado)
 *  - especial: 'dead' (baja rotación), 'low' (stock bajo), 'risk' (se agotará pronto)
 */
const PROFILES = {
  flat: [1, 1, 1, 1, 1, 1, 1],
  weekend: [1.25, 0.75, 0.75, 0.8, 0.95, 1.55, 1.7],
  friday: [0.9, 0.8, 0.85, 0.9, 1.0, 1.75, 1.2],
  weekday: [0.35, 1.2, 1.25, 1.25, 1.2, 1.1, 0.65],
  morning: [0.7, 1.15, 1.1, 1.1, 1.1, 1.05, 0.9],
  startOfWeek: [0.5, 1.6, 1.3, 1.1, 1.0, 0.9, 0.6]
};

const p = (name, category, unit, cost, price, perDay, profile, supplier, stockDays, special = null) =>
  ({ name, category, unit, cost, price, perDay, profile, supplier, stockDays, special });

const BUSINESS_TYPES = {
  tienda_barrio: {
    icon: 'store',
    defaultName: 'Tienda Don Jaime',
    categories: ['Granos y abarrotes', 'Lácteos y huevos', 'Bebidas', 'Snacks y panadería', 'Aseo del hogar', 'Frutas y verduras'],
    suppliers: [
      { name: 'Distribuidora La Esperanza', contact: 'Luz Marina Cabrera', phone: '3162458801', lead: 2 },
      { name: 'Lácteos del Sur (ruta Pasto)', contact: 'Hernán Ortiz', phone: '3187702215', lead: 1 },
      { name: 'Postobón Distribuciones', contact: 'Andrés Bolaños', phone: '3205519043', lead: 3 },
      { name: 'Bavaria - Distribuidor zona sur', contact: 'Paola Erazo', phone: '3145670092', lead: 4 },
      { name: 'Plaza de mercado El Potrerillo', contact: 'Doña Marleny Guerrero', phone: '3128834410', lead: 1 },
      { name: 'Aseo Express Nariño', contact: 'Camilo Rosero', phone: '3173345560', lead: 3 }
    ],
    customers: ['Doña Marleny Guerrero', 'Don Hernán Ortiz', 'Luz Dary Meneses', 'Restaurante Sabor Pastuso', 'Panadería La Espiga', 'Familia Burbano', 'Johana Chamorro', 'Don Segundo Villota', 'Colegio San Felipe (cafetería)', 'Yesenia Paz', 'Carlos Bravo', 'Rosalba Ibarra'],
    products: [
      p('Arroz Diana 500 g', 'Granos y abarrotes', 'und', 2100, 2700, 9, 'flat', 0, 14),
      p('Aceite de girasol 1 L', 'Granos y abarrotes', 'und', 9800, 12500, 3, 'flat', 0, 12),
      p('Lentejas 500 g', 'Granos y abarrotes', 'und', 2900, 3800, 2.2, 'flat', 0, 16),
      p('Azúcar Incauca 1 kg', 'Granos y abarrotes', 'und', 3900, 4900, 5, 'flat', 0, 12),
      p('Sal Refisal 500 g', 'Granos y abarrotes', 'und', 1100, 1600, 3, 'flat', 0, 20),
      p('Café Sello Rojo 250 g', 'Granos y abarrotes', 'und', 6900, 8800, 4, 'morning', 0, 11),
      p('Pasta Doria 250 g', 'Granos y abarrotes', 'und', 2400, 3200, 4, 'flat', 0, 14),
      p('Atún Van Camp lata', 'Granos y abarrotes', 'und', 5200, 6800, 3, 'flat', 0, 15),
      p('Salsa de tomate Fruco 400 g', 'Granos y abarrotes', 'und', 3500, 4700, 2, 'weekend', 0, 18),
      p('Sal marina gourmet 250 g', 'Granos y abarrotes', 'und', 6800, 9800, 0.12, 'flat', 0, 400, 'dead'),
      p('Mermelada importada de higo', 'Granos y abarrotes', 'und', 9800, 14500, 0.1, 'flat', 0, 380, 'dead'),
      p('Leche Alquería 1 L', 'Lácteos y huevos', 'und', 3600, 4500, 14, 'morning', 1, 5, 'risk'),
      p('Huevos AA x30', 'Lácteos y huevos', 'und', 14500, 17500, 4, 'startOfWeek', 4, 6),
      p('Queso campesino 500 g', 'Lácteos y huevos', 'und', 8200, 10800, 2.5, 'weekend', 1, 5),
      p('Yogurt Alpina 1 L', 'Lácteos y huevos', 'und', 6400, 8300, 3, 'flat', 1, 6),
      p('Gaseosa Postobón 400 ml', 'Bebidas', 'und', 1700, 2500, 22, 'weekend', 2, 7),
      p('Agua Cristal 600 ml', 'Bebidas', 'und', 1000, 1800, 14, 'flat', 2, 9),
      p('Cerveza Águila lata', 'Bebidas', 'und', 2600, 3500, 26, 'friday', 3, 6, 'low'),
      p('Jugo Hit 1 L', 'Bebidas', 'und', 3400, 4600, 5, 'flat', 2, 8),
      p('Pan tajado Bimbo', 'Snacks y panadería', 'und', 4300, 5600, 8, 'morning', 0, 5),
      p('Papas Margarita 105 g', 'Snacks y panadería', 'und', 2300, 3200, 15, 'weekend', 0, 8),
      p('Arepas de maíz x5', 'Snacks y panadería', 'und', 2800, 3800, 6, 'weekday', 0, 5),
      p('Chocolatina Jet', 'Snacks y panadería', 'und', 900, 1500, 18, 'flat', 0, 14),
      p('Jabón Rey barra', 'Aseo del hogar', 'und', 1700, 2400, 5, 'flat', 5, 15),
      p('Papel higiénico x4', 'Aseo del hogar', 'und', 5200, 6900, 4, 'flat', 5, 14),
      p('Detergente Fab 500 g', 'Aseo del hogar', 'und', 3800, 5200, 4, 'flat', 5, 14),
      p('Crema dental Colgate', 'Aseo del hogar', 'und', 3500, 4900, 3, 'flat', 5, 18),
      p('Cloro 1 L', 'Aseo del hogar', 'und', 2100, 3000, 3, 'flat', 5, 16),
      p('Tomate chonto', 'Frutas y verduras', 'kg', 3200, 4500, 6, 'startOfWeek', 4, 3),
      p('Papa pastusa', 'Frutas y verduras', 'kg', 2200, 3200, 7, 'startOfWeek', 4, 4),
      p('Cebolla cabezona', 'Frutas y verduras', 'kg', 2600, 3700, 4, 'flat', 4, 4),
      p('Plátano maduro', 'Frutas y verduras', 'und', 900, 1500, 9, 'weekend', 4, 3)
    ]
  },

  restaurante: {
    icon: 'utensils',
    defaultName: 'Restaurante El Fogón Nariñense',
    categories: ['Almuerzos', 'Platos fuertes', 'Entradas y picadas', 'Bebidas', 'Postres'],
    suppliers: [
      { name: 'Frigorífico Los Andes', contact: 'Mauricio Narváez', phone: '3109001122', lead: 2 },
      { name: 'Plaza de mercado El Potrerillo', contact: 'Doña Marleny Guerrero', phone: '3128834410', lead: 1 },
      { name: 'Postobón Distribuciones', contact: 'Andrés Bolaños', phone: '3205519043', lead: 3 },
      { name: 'Lácteos del Sur (ruta Pasto)', contact: 'Hernán Ortiz', phone: '3187702215', lead: 1 }
    ],
    customers: ['Empresa Coopsur (almuerzos)', 'Notaría Segunda', 'Familia Ortega', 'Consultorios Médicos Centro', 'Johana Chamorro', 'Don Luis Eraso', 'Colegio Champagnat', 'Gloria Cuaspud'],
    products: [
      p('Almuerzo ejecutivo del día', 'Almuerzos', 'porción', 6800, 14000, 38, 'weekday', 0, 1.5),
      p('Almuerzo corriente', 'Almuerzos', 'porción', 5200, 11000, 26, 'weekday', 0, 1.5),
      p('Bandeja paisa', 'Platos fuertes', 'porción', 11500, 26000, 9, 'weekend', 0, 2),
      p('Cuy asado (porción)', 'Platos fuertes', 'porción', 17500, 38000, 4, 'weekend', 1, 3, 'risk'),
      p('Trucha frita', 'Platos fuertes', 'porción', 10800, 24000, 6, 'friday', 0, 2),
      p('Churrasco con papas', 'Platos fuertes', 'porción', 12400, 27000, 5, 'friday', 0, 2),
      p('Empanadas de pipián x3', 'Entradas y picadas', 'porción', 2600, 6000, 14, 'weekend', 1, 2),
      p('Picada para dos', 'Entradas y picadas', 'porción', 15200, 34000, 3, 'friday', 0, 2),
      p('Sopa de quinua', 'Entradas y picadas', 'porción', 3200, 8500, 6, 'weekday', 1, 2),
      p('Jugo natural en leche', 'Bebidas', 'vaso', 1500, 5500, 24, 'flat', 1, 2),
      p('Limonada de coco', 'Bebidas', 'vaso', 2100, 7000, 9, 'weekend', 1, 2),
      p('Gaseosa 400 ml', 'Bebidas', 'und', 1700, 3500, 20, 'flat', 2, 6),
      p('Cerveza Águila', 'Bebidas', 'und', 2600, 5500, 12, 'friday', 2, 6),
      p('Tinto', 'Bebidas', 'taza', 400, 2000, 22, 'morning', 1, 3),
      p('Postre de tres leches', 'Postres', 'porción', 2900, 7500, 7, 'weekend', 3, 2),
      p('Helado de paila', 'Postres', 'porción', 2200, 6000, 5, 'weekend', 3, 2),
      p('Flan de caramelo', 'Postres', 'porción', 1800, 5000, 0.2, 'flat', 3, 90, 'dead')
    ]
  },

  papeleria: {
    icon: 'pencil',
    defaultName: 'Papelería y Útiles El Estudiante',
    categories: ['Cuadernos y papel', 'Escritura', 'Arte y manualidades', 'Oficina', 'Servicios'],
    suppliers: [
      { name: 'Norma Distribuciones', contact: 'Patricia Rosero', phone: '3156677001', lead: 4 },
      { name: 'Faber-Castell Colombia (ruta sur)', contact: 'Julián Cabrera', phone: '3117788902', lead: 5 },
      { name: 'Papelera del Pacífico', contact: 'Sandra Muñoz', phone: '3204455603', lead: 3 }
    ],
    customers: ['Colegio San Felipe Neri', 'Universidad (fotocopias)', 'Jhoana Narváez', 'Oficina Contable Paz & Cía', 'Don Edgar Mora', 'Escuela Rural La Laguna', 'María Fernanda Insuasty', 'Notaría Primera'],
    products: [
      p('Cuaderno cuadriculado 100 hojas', 'Cuadernos y papel', 'und', 3300, 5500, 9, 'weekday', 0, 20),
      p('Cuaderno rayado 50 hojas', 'Cuadernos y papel', 'und', 1800, 3000, 8, 'weekday', 0, 20),
      p('Resma papel carta 500 hojas', 'Cuadernos y papel', 'und', 13800, 18500, 3, 'weekday', 2, 15),
      p('Cartulina plana pliego', 'Cuadernos y papel', 'und', 500, 1200, 14, 'startOfWeek', 2, 18),
      p('Lapicero Bic azul', 'Escritura', 'und', 700, 1500, 24, 'weekday', 1, 25),
      p('Lápiz Mirado No. 2', 'Escritura', 'und', 600, 1300, 17, 'weekday', 1, 25),
      p('Marcador permanente', 'Escritura', 'und', 1900, 3500, 5, 'weekday', 1, 20),
      p('Resaltador amarillo', 'Escritura', 'und', 1700, 3200, 4, 'weekday', 1, 20),
      p('Colores Faber-Castell x12', 'Arte y manualidades', 'und', 6900, 11500, 4, 'startOfWeek', 1, 18),
      p('Pegante en barra', 'Arte y manualidades', 'und', 1500, 2800, 7, 'startOfWeek', 1, 18),
      p('Tijeras escolares', 'Arte y manualidades', 'und', 2900, 5200, 2, 'startOfWeek', 2, 25),
      p('Témpera x6 colores', 'Arte y manualidades', 'und', 5100, 8900, 1.6, 'startOfWeek', 1, 20, 'risk'),
      p('Carpeta legajadora', 'Oficina', 'und', 1700, 3000, 4, 'weekday', 2, 22),
      p('Grapadora de escritorio', 'Oficina', 'und', 8200, 13500, 0.8, 'weekday', 2, 40),
      p('Cinta de enmascarar', 'Oficina', 'und', 1500, 2800, 3, 'weekday', 2, 22),
      p('Calculadora científica', 'Oficina', 'und', 38000, 56000, 0.12, 'flat', 2, 300, 'dead'),
      p('Fotocopia blanco y negro', 'Servicios', 'copia', 40, 150, 160, 'weekday', 2, 0.1),
      p('Impresión a color', 'Servicios', 'hoja', 250, 800, 22, 'weekday', 2, 0.1),
      p('Plastificado tamaño carta', 'Servicios', 'hoja', 450, 1500, 7, 'weekday', 2, 0.1)
    ]
  },

  ferreteria: {
    icon: 'wrench',
    defaultName: 'Ferretería El Constructor',
    categories: ['Construcción', 'Herramientas', 'Pinturas', 'Eléctricos', 'Plomería'],
    suppliers: [
      { name: 'Cementos Argos (ruta sur)', contact: 'Fabián Ortiz', phone: '3103322110', lead: 3 },
      { name: 'Corona Distribuciones', contact: 'Natalia Pantoja', phone: '3125544301', lead: 4 },
      { name: 'Pintuco Distribuidor Nariño', contact: 'Jorge Enríquez', phone: '3189900445', lead: 3 },
      { name: 'Eléctricos del Sur', contact: 'Wilmer Ruano', phone: '3146611203', lead: 2 }
    ],
    customers: ['Constructora Andina', 'Maestro Edison Guerrero', 'Don Tulio Benavides', 'Conjunto Villa del Sol', 'Maestro Fabio Zambrano', 'Taller Metalmecánico Pasto', 'Ana Lucía Rosero', 'Obras Civiles del Sur'],
    products: [
      p('Cemento gris 50 kg', 'Construcción', 'bulto', 27500, 33500, 12, 'startOfWeek', 0, 6),
      p('Varilla corrugada 3/8"', 'Construcción', 'und', 17800, 22500, 8, 'startOfWeek', 0, 8),
      p('Ladrillo tolete', 'Construcción', 'und', 1300, 1900, 120, 'startOfWeek', 0, 6),
      p('Arena de río (m³)', 'Construcción', 'm³', 62000, 85000, 1.4, 'startOfWeek', 0, 5, 'risk'),
      p('Martillo de uña', 'Herramientas', 'und', 17500, 27500, 0.8, 'flat', 1, 40),
      p('Destornillador de pala', 'Herramientas', 'und', 3900, 7200, 2, 'flat', 1, 30),
      p('Alicate universal', 'Herramientas', 'und', 11800, 19500, 0.9, 'flat', 1, 35),
      p('Cinta métrica 5 m', 'Herramientas', 'und', 5200, 9500, 1.6, 'flat', 1, 30),
      p('Pintura vinilo blanco galón', 'Pinturas', 'galón', 43500, 58000, 2.6, 'weekend', 2, 14),
      p('Rodillo y bandeja', 'Pinturas', 'und', 6900, 12500, 1.4, 'weekend', 2, 25),
      p('Brocha de 3"', 'Pinturas', 'und', 2900, 5600, 3, 'weekend', 2, 25),
      p('Cable THHN #12 (metro)', 'Eléctricos', 'm', 1700, 2600, 40, 'weekday', 3, 12),
      p('Toma doble', 'Eléctricos', 'und', 3800, 6500, 4, 'weekday', 3, 25),
      p('Bombillo LED 9 W', 'Eléctricos', 'und', 2900, 5200, 6, 'flat', 3, 20, 'low'),
      p('Tubo PVC presión 1/2"', 'Plomería', 'und', 8200, 12500, 4, 'weekday', 1, 18),
      p('Llave de paso 1/2"', 'Plomería', 'und', 6800, 11500, 1.5, 'weekday', 1, 30),
      p('Teflón (cinta)', 'Plomería', 'und', 600, 1500, 8, 'weekday', 1, 30),
      p('Cerradura de seguridad importada', 'Herramientas', 'und', 62000, 98000, 0.1, 'flat', 1, 320, 'dead')
    ]
  }
};

function listBusinessTypes() {
  return Object.entries(BUSINESS_TYPES).map(([key, t]) => ({ key, icon: t.icon, defaultName: t.defaultName }));
}

module.exports = { PROFILES, BUSINESS_TYPES, listBusinessTypes };
