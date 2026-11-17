/* ============================================= */
/* SEED.JS - DATOS DE DEMOSTRACIÓN               */
/* ============================================= */
/* Llena una base de datos VACÍA o de DEMO con    */
/* una ferretería ficticia ("Herrajes Don Tomás"):*/
/* categorías, productos con imagen, usuarios,    */
/* clientes, apartados, notificaciones y visitas. */
/*                                                */
/* Uso:  npm run seed            (BD vacía)       */
/*       npm run seed -- --force (borra la demo)  */
/* Requiere el esquema: database/schema.sql       */
/* ============================================= */

require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dbConfig = require('../config/database');
const { normalizeText } = require('../utils/imagenes');

// Credenciales de la tienda demo: solo para demo/capturas. Nunca en producción.
const DEMO_ADMIN = { nombre: 'Administrador Demo', usuario: 'admin', password: 'DemoAdmin2026' };
const DEMO_EMPLEADO = { nombre: 'Laura Gómez', usuario: 'empleado', password: 'DemoEmpleado2026' };
const DEMO_CLIENTE = { nombre: 'Carlos Pérez', documento: '1000000001', password: 'DemoCliente2026' };

const MAX_CLIENTES_DEMO = 50;
const FORCE = process.argv.includes('--force');
const IMG_DESTINO = path.join(__dirname, '..', 'public', 'img', 'upload');

const TABLAS = ['apartados', 'notificaciones', 'notificaciones_cliente', 'producto_presentacion', 'producto',
    'categorias', 'clientes', 'usuarios', 'page_views', 'auditoria', 'sessions'];

// Ferretería de herrajes para muebles. Nombres y precios propios (aprox. COP);
// cada dueño cambia categorías y productos desde el panel.
const CATEGORIAS = ['Bisagras', 'Correderas', 'Manijas y botones', 'Cerraduras', 'Patas y rodachinas',
    'Cocina', 'Closet', 'Herramientas', 'Tornillería', 'Pegantes y cantos', 'Iluminación LED'];

// [nombre, unidad, precio, stock, categoría, descripción, extras]
const PRODUCTOS = [
    ['Bisagra cierre lento 110°', 'UND', 9500, 240, 'Bisagras', 'Bisagra de cazoleta de 35 mm con amortiguador: la puerta del mueble cierra suave y sin golpe.', { presentaciones: [['Unidad', 1], ['Par', 2], ['Caja x10', 10]] }],
    ['Bisagra de parche 180° negra', 'UND', 18000, 60, 'Bisagras', 'Se atornilla por encima, sin perforar cazoleta. Deja abrir la puerta por completo.', { descuento: 15 }],
    ['Dispositivo push blanco', 'UND', 3000, 150, 'Bisagras', 'Abre la puerta o el cajón con un toque, para muebles sin manija.'],
    ['Pivote para puerta 20 mm', 'UND', 5500, 80, 'Bisagras', 'Juego superior e inferior con buje metálico, para puertas pivotantes de mueble.'],
    ['Corredera telescópica 45 cm', 'UND', 24000, 90, 'Correderas', 'Precio por par. Extensión total con rodamiento de bolas, aguanta 35 kg.'],
    ['Corredera oculta cierre lento 50 cm', 'UND', 52000, 40, 'Correderas', 'Precio por par. Va debajo del cajón, no se ve y cierra con amortiguación.', { descuento: 10 }],
    ['Manija barra 160 mm negra mate', 'UND', 9000, 120, 'Manijas y botones', 'Manija en aluminio, distancia entre tornillos de 160 mm. Incluye tornillos.', { presentaciones: [['Unidad', 1], ['Caja x10', 10]] }],
    ['Manija dorada 128 mm', 'UND', 11000, 70, 'Manijas y botones', 'Acabado dorado brillante para cocinas y closets. Distancia entre tornillos de 128 mm.'],
    ['Botón redondo acabado madera 35 mm', 'UND', 4500, 100, 'Manijas y botones', 'Botón en zamak con acabado tipo madera, para cajones y puertas pequeñas.'],
    ['Cerradura para mueble 22 mm', 'UND', 12500, 50, 'Cerraduras', 'Cerradura de cilindro para cajones y puertas de escritorio. Trae dos llaves.'],
    ['Chapa de pomo para alcoba', 'UND', 48000, 25, 'Cerraduras', 'Pomo en acero satinado con seguro interno, para puertas de habitación.', { descuento: 20 }],
    ['Tope magnético para puerta', 'UND', 8500, 0, 'Cerraduras', 'Sostiene la puerta abierta y evita que golpee la pared.'], // agotado
    ['Pata metálica para mesa 72 cm', 'UND', 38000, 32, 'Patas y rodachinas', 'Pata cuadrada negra con nivelador, altura de comedor.', { presentaciones: [['Unidad', 1], ['Juego x4', 4]] }],
    ['Rodachina giratoria 2 pulgadas con freno', 'UND', 7500, 140, 'Patas y rodachinas', 'Rueda de goma que no raya el piso; gira 360° y tiene freno.', { presentaciones: [['Unidad', 1], ['Juego x4', 4]] }],
    ['Basurera extraíble 2 x 20 L', 'UND', 420000, 6, 'Cocina', 'Dos canecas de 20 litros en riel de cierre lento, para mueble bajo de 45 cm.'],
    ['Cubiertero gris 40 x 50 cm', 'UND', 46000, 18, 'Cocina', 'Organizador de cubiertos en PVC que se recorta a la medida del cajón.'],
    ['Esquinero giratorio para mueble bajo', 'UND', 690000, 3, 'Cocina', 'Aprovecha la esquina ciega de la cocina con bandejas que salen al abrir.'],
    ['Tubo ovalado para closet 1 m', 'UND', 14000, 60, 'Closet', 'Tubo cromado de 1 metro con sus dos soportes.'],
    ['Pantalonero extraíble 60 cm', 'UND', 185000, 8, 'Closet', 'Bandeja con riel de cierre lento para colgar hasta 10 pantalones.'],
    ['Zapatero extraíble 60 cm', 'UND', 160000, 5, 'Closet', 'Bandeja de dos niveles para el fondo del closet.', { inactivo: true }],
    ['Taladro percutor 650 W', 'UND', 245000, 10, 'Herramientas', 'Taladro con percutor para madera, metal y concreto. Mandril de 13 mm.', { descuento: 12 }],
    ['Juego de brocas para madera x7', 'UND', 32000, 25, 'Herramientas', 'Brocas de 3 a 10 mm con punta de centrado, en estuche.'],
    ['Tornillo para madera 8 x 1 pulgada', 'UND', 60, 5000, 'Tornillería', 'Tornillo autorroscante cabeza plana, para armar muebles en aglomerado y MDF.', { presentaciones: [['Caja x100', 100], ['Caja x500', 500]] }],
    ['Pegante para madera 1 kg', 'UND', 21000, 40, 'Pegantes y cantos', 'Pegante blanco de secado rápido para uniones de madera y MDF.'],
    ['Canto PVC blanco 19 mm', 'M', 900, 2000, 'Pegantes y cantos', 'Canto para tapar el borde de tableros de 15 y 18 mm. Se vende por metro.', { presentaciones: [['Metro', 1], ['Rollo 50 m', 50]] }],
    ['Tira LED cálida 5 m', 'UND', 39000, 30, 'Iluminación LED', 'Tira de luz cálida con adaptador, para debajo de gabinetes y repisas.', { descuento: 25 }],
];

// Ilustración sencilla por categoría; las fotos reales las sube cada tienda desde el panel.
const DIBUJOS = {
    'Bisagras': '<rect x="120" y="130" width="70" height="140" rx="8"/><rect x="210" y="130" width="70" height="140" rx="8"/><rect x="188" y="120" width="24" height="160" rx="10"/><circle cx="155" cy="170" r="10"/><circle cx="155" cy="230" r="10"/><circle cx="245" cy="170" r="10"/><circle cx="245" cy="230" r="10"/>',
    'Correderas': '<rect x="70" y="160" width="230" height="34" rx="6"/><rect x="100" y="206" width="230" height="34" rx="6"/><circle cx="120" cy="177" r="6"/><circle cx="310" cy="223" r="6"/>',
    'Manijas y botones': '<path d="M110 230 v-50 h180 v50"/><rect x="95" y="228" width="30" height="20" rx="4"/><rect x="275" y="228" width="30" height="20" rx="4"/>',
    'Cerraduras': '<path d="M150 190 v-40 a50 50 0 0 1 100 0 v40"/><rect x="125" y="190" width="150" height="120" rx="14"/><circle cx="200" cy="240" r="14"/><path d="M200 254 v26"/>',
    'Patas y rodachinas': '<path d="M150 110 h100 M200 110 v60 M160 170 h80"/><circle cx="200" cy="240" r="55"/><circle cx="200" cy="240" r="16"/>',
    'Cocina': '<rect x="120" y="140" width="160" height="170" rx="12"/><path d="M105 140 h190 M170 118 h60 M165 180 v100 M200 180 v100 M235 180 v100"/>',
    'Closet': '<path d="M180 120 a20 20 0 1 1 20 20 v25 L95 250 h210 L200 165"/>',
    'Herramientas': '<rect x="100" y="150" width="150" height="70" rx="16"/><path d="M250 175 h70 M320 185 h-70"/><path d="M150 220 l-20 90 h60 l15 -90"/>',
    'Tornillería': '<path d="M150 110 h100 l-20 30 h-60 z"/><path d="M185 140 v150 l15 30 l15 -30 v-150"/><path d="M185 175 l30 -10 M185 205 l30 -10 M185 235 l30 -10 M185 265 l30 -10"/>',
    'Pegantes y cantos': '<path d="M178 100 h44 v50 h-44 z"/><path d="M150 150 h100 l15 30 v130 h-130 v-130 z"/><path d="M170 225 h60"/>',
    'Iluminación LED': '<path d="M165 235 a60 60 0 1 1 70 0 v30 h-70 z"/><path d="M170 290 h60 M180 310 h40 M200 175 v45"/>',
};
const TONOS = ['#E8EEF4', '#F4ECE4', '#E6F0EA', '#F2E8EE', '#EEF0E2', '#E9E6F3'];
const svgProducto = (categoria, i) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${TONOS[i % TONOS.length]}"/>`
    + `<g fill="none" stroke="#2B3532" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${DIBUJOS[categoria]}</g></svg>`;

const CLIENTES = [
    [DEMO_CLIENTE.nombre, DEMO_CLIENTE.documento, 'Carrera 7 # 12-34', '+57 300 000 0001'],
    ['María Rodríguez', '1000000002', 'Calle 15 # 3-21', '+57 300 000 0002'],
    ['Andrés Torres', '1000000003', 'Transversal 4 # 8-10', '+57 300 000 0003'],
    ['Sofía Martínez', '1000000004', 'Diagonal 20 # 9-45', '+57 300 000 0004'],
];

const TIENDA = {
    nombre: 'Herrajes Don Tomás',
    eslogan: 'Herrajes y accesorios para muebles, cocinas y closets',
    descripcion: 'Ferretería ficticia para demostración: bisagras, correderas, manijas, herrajes de cocina y herramientas.',
    logo_url: null,
    color_primario: '#1F4E79',
    color_secundario: '#E08A1E',
    telefono: '+57 300 000 0000',
    whatsapp: '+57 300 000 0000',
    correo: 'ventas@herrajesdontomas.example',
    direccion: 'Carrera 30 # 15-42, Centro',
    horario: 'Lun a Vie 8:00 a.m. – 6:00 p.m. · Sáb 8:00 a.m. – 1:00 p.m.',
    moneda: 'COP',
    minutos_expiracion_apartado: 0, // tienda web: los apartados no vencen
    facebook: 'https://example.com/herrajesdontomas',
    instagram: 'https://example.com/herrajesdontomas',
    tiktok: '',
    productos_ocultos: 'COMODIN',
    tipo_negocio: 'ferreteria',
    bloques_inicio: null, // inicio por defecto: bloques guardados podían apuntar a categorías de la demo anterior
};

const diasAtras = (dias, hora = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(hora, (dias * 7) % 60, 0, 0);
    return d;
};

async function main() {
    for (const [nombre, , , , categoria] of PRODUCTOS) {
        if (!CATEGORIAS.includes(categoria) || !DIBUJOS[categoria]) throw new Error(`Categoría demo inválida para "${nombre}": ${categoria}`);
    }
    const nombreBD = dbConfig.database;
    if (!nombreBD) throw new Error('Falta DB_DATABASE (revisa .env).');
    console.log(`Seed de demo sobre la base "${nombreBD}" en ${dbConfig.host}:${dbConfig.port}`);

    const db = await mysql.createConnection({ ...dbConfig });
    try {
        const [[{ hayProducto }]] = await db.query(
            "SELECT COUNT(*) AS hayProducto FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'producto'");
        if (!hayProducto) {
            console.error('No existe la tabla "producto". Carga primero el esquema:\n  mysql -u <usuario> -p < database/schema.sql\n(crea la base tienda_db; si usas otro nombre, ajusta DB_DATABASE).');
            process.exitCode = 1;
            return;
        }
        const [[{ clientes }]] = await db.query('SELECT COUNT(*) AS clientes FROM clientes');
        if (clientes > MAX_CLIENTES_DEMO) {
            throw new Error(`La tabla clientes tiene ${clientes} filas (> ${MAX_CLIENTES_DEMO}): parece una base real. No se toca.`);
        }
        const [[{ productos }]] = await db.query('SELECT COUNT(*) AS productos FROM producto');
        if ((clientes > 0 || productos > 0) && !FORCE) {
            console.error('La base ya tiene datos. Para borrarlos y cargar la demo usa: npm run seed -- --force');
            process.exitCode = 1;
            return;
        }

        const [existentes] = await db.query(
            'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()');
        const hay = new Set(existentes.map((r) => r.t || r.TABLE_NAME));

        // El vaciado va fuera de la transacción: ALTER TABLE hace commit implícito.
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const tabla of TABLAS.filter((t) => hay.has(t))) {
            await db.query(`DELETE FROM \`${tabla}\``);
            if (tabla !== 'sessions') await db.query(`ALTER TABLE \`${tabla}\` AUTO_INCREMENT = 1`);
        }
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('- Tablas de demo vaciadas');
        await db.beginTransaction();

        // Tienda
        const cols = Object.keys(TIENDA);
        await db.query(
            `INSERT INTO configuracion_tienda (id, ${cols.join(', ')}) VALUES (1, ${cols.map(() => '?').join(', ')})
             ON DUPLICATE KEY UPDATE ${cols.map((c) => `${c} = VALUES(${c})`).join(', ')}`,
            cols.map((c) => TIENDA[c]));
        console.log(`- Tienda: ${TIENDA.nombre}`);

        await db.query('INSERT INTO categorias (nombre) VALUES ?', [CATEGORIAS.map((c) => [c])]);

        // Productos (+ comodín interno del POS, oculto por productos_ocultos)
        const inicioOferta = diasAtras(2, 0);
        const finOferta = diasAtras(-7, 23);
        const filas = PRODUCTOS.map(([nombre, unidad, precio, stock, categoria, descripcion, x = {}], i) => [
            `DEMO-${String(i + 1).padStart(3, '0')}`, nombre, unidad, 'Bodega principal', precio, stock, descripcion, categoria,
            x.inactivo ? 'inactivo' : 'activo', stock,
            x.descuento || 0, x.descuento ? inicioOferta : null, x.descuento ? finOferta : null,
        ]);
        filas.push(['DEMO-000', 'COMODIN', 'UND', 'Bodega principal', 1, 0, 'Producto interno del POS (oculto en la web).', CATEGORIAS[0], 'activo', 0, 0, null, null]);
        await db.query(`INSERT INTO producto (codigo, nombre, unidad, lugar, precio, stock, descripcion, categoria, estado,
            limite_venta, descuento, fecha_inicio_oferta, fecha_fin_oferta) VALUES ?`, [filas]);
        const [prods] = await db.query('SELECT id_producto, nombre, precio FROM producto');
        const id = Object.fromEntries(prods.map((p) => [p.nombre, p]));

        const presentaciones = [];
        PRODUCTOS.forEach(([nombre, , , , , , x = {}]) =>
            (x.presentaciones || []).forEach(([pres, factor], orden) => presentaciones.push([id[nombre].id_producto, pres, factor, 1, orden])));
        await db.query('INSERT INTO producto_presentacion (id_producto, nombre, factor, activo, orden) VALUES ?', [presentaciones]);
        console.log(`- ${filas.length} productos (incluye COMODIN oculto), ${presentaciones.length} presentaciones`);

        // Usuarios del panel y clientes
        const hash = (p) => bcrypt.hash(p, 10);
        await db.query('INSERT INTO usuarios (nombre, usuario, password, rol, activo) VALUES ?', [[
            [DEMO_ADMIN.nombre, DEMO_ADMIN.usuario, await hash(DEMO_ADMIN.password), 'Administrador', 1],
            [DEMO_EMPLEADO.nombre, DEMO_EMPLEADO.usuario, await hash(DEMO_EMPLEADO.password), 'Supervisor', 1],
        ]]);
        const claveCliente = await hash(DEMO_CLIENTE.password);
        await db.query('INSERT INTO clientes (nombre, documento, direccion, telefono, rol, password) VALUES ?',
            [CLIENTES.map((c) => [...c, 'cliente', claveCliente])]);
        const [cli] = await db.query('SELECT id_cliente, nombre FROM clientes ORDER BY id_cliente');
        console.log(`- 2 usuarios del panel, ${cli.length} clientes (credenciales demo al inicio de scripts/seed.js)`);

        // Apartados de los últimos 14 días: [cliente, producto, cantidad, estado, días atrás]
        const APARTADOS = [
            [0, 'Bisagra cierre lento 110°', 10, 'pendiente', 0], [1, 'Manija barra 160 mm negra mate', 8, 'pendiente', 0],
            [2, 'Corredera telescópica 45 cm', 4, 'confirmado', 1], [3, 'Canto PVC blanco 19 mm', 50, 'confirmado', 2],
            [0, 'Tornillo para madera 8 x 1 pulgada', 500, 'entregado', 3], [1, 'Taladro percutor 650 W', 1, 'entregado', 4],
            [2, 'Rodachina giratoria 2 pulgadas con freno', 4, 'entregado', 6], [3, 'Pegante para madera 1 kg', 2, 'entregado', 8],
            [0, 'Pata metálica para mesa 72 cm', 4, 'entregado', 10], [1, 'Cubiertero gris 40 x 50 cm', 1, 'entregado', 12],
            [2, 'Botón redondo acabado madera 35 mm', 6, 'cancelado', 5], [3, 'Chapa de pomo para alcoba', 1, 'cancelado', 9],
            [0, 'Tira LED cálida 5 m', 2, 'entregado', 13], [1, 'Dispositivo push blanco', 6, 'confirmado', 1],
        ];
        await db.query(`INSERT INTO apartados (nombre_cliente, id_cliente, producto, cantidad, precio_aplicado, estado,
            cancelado_por, confirmado_por, fecha) VALUES ?`, [APARTADOS.map(([c, p, cant, estado, dias], i) => [
            cli[c].nombre, cli[c].id_cliente, id[p].id_producto, String(cant), id[p].precio, estado,
            estado === 'cancelado' ? (i % 2 ? 'admin' : 'cliente') : null,
            ['confirmado', 'entregado'].includes(estado) ? DEMO_EMPLEADO.usuario : null,
            diasAtras(dias, 8 + (i % 10)),
        ])]);

        await db.query('INSERT INTO notificaciones (titulo, mensaje, leido, fecha) VALUES ?', [[
            ['Nuevo apartado', `${cli[0].nombre} apartó 1 Caja x10 de Bisagra cierre lento 110°.`, 0, diasAtras(0, 9)],
            ['Nuevo apartado', `${cli[1].nombre} apartó 8 x Manija barra 160 mm negra mate.`, 0, diasAtras(0, 11)],
            ['Apartado cancelado', `${cli[2].nombre} canceló su apartado de Botón redondo acabado madera 35 mm.`, 1, diasAtras(5, 15)],
        ]]);
        await db.query('INSERT INTO notificaciones_cliente (id_cliente, titulo, mensaje, leido, fecha) VALUES ?', [[
            [cli[2].id_cliente, 'Apartado confirmado', 'Tu apartado de Corredera telescópica 45 cm está listo para recoger.', 0, diasAtras(1, 12)],
            [cli[3].id_cliente, 'Apartado confirmado', 'Tu apartado de Canto PVC blanco 19 mm está listo para recoger.', 1, diasAtras(2, 10)],
            [cli[0].id_cliente, 'Apartado entregado', 'Gracias por tu compra de Tornillo para madera 8 x 1 pulgada.', 1, diasAtras(3, 18)],
        ]]);

        // Visitas (~60) para el panel de analítica. IPs de loopback distintas para que cuenten como visitantes.
        const RUTAS = ['/', '/', '/', '/catalogo', '/catalogo', `/producto/${id['Bisagra cierre lento 110°'].id_producto}`, '/verApartados', '/perfil'];
        const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
        const visitas = Array.from({ length: 60 }, (_, i) => [
            RUTAS[i % RUTAS.length], i % 4 === 0 ? cli[i % cli.length].nombre : null, `127.0.0.${(i % 9) + 1}`, UA, diasAtras(i % 14, 7 + (i % 13)),
        ]);
        await db.query('INSERT INTO page_views (ruta, usuario, ip, user_agent, fecha) VALUES ?', [visitas]);

        await db.query('INSERT INTO auditoria (usuario, rol, accion, detalle, fecha) VALUES ?', [[
            [DEMO_ADMIN.usuario, 'Administrador', 'seed', 'Datos de demostración cargados', new Date()],
        ]]);

        await db.commit();
        console.log(`- ${APARTADOS.length} apartados, 3 + 3 notificaciones, ${visitas.length} visitas`);
    } catch (err) {
        await db.rollback().catch(() => {});
        throw err;
    } finally {
        await db.end();
    }

    // Imágenes: el sitio las asocia por nombre normalizado (utils/imagenes.js)
    fs.mkdirSync(IMG_DESTINO, { recursive: true });
    PRODUCTOS.forEach(([nombre, , , , categoria], i) => fs.writeFileSync(
        path.join(IMG_DESTINO, `${normalizeText(nombre).replace(/ /g, '-')}.svg`), svgProducto(categoria, i)));
    console.log(`- ${PRODUCTOS.length} ilustraciones escritas en public/img/upload`);
    console.log('Listo.');
}

main().catch((err) => {
    console.error('Seed cancelado:', err.message);
    process.exitCode = 1;
});
