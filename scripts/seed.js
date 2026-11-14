/* ============================================= */
/* SEED.JS - DATOS DE DEMOSTRACIÓN               */
/* ============================================= */
/* Llena una base de datos VACÍA o de DEMO con    */
/* una tienda ficticia ("Tienda La Esquina"):     */
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

const BD_PROTEGIDAS = ['sena_pdv'];
const MAX_CLIENTES_DEMO = 50;
const FORCE = process.argv.includes('--force');
const IMG_ORIGEN = path.join(__dirname, '..', 'database', 'seed', 'img');
const IMG_DESTINO = path.join(__dirname, '..', 'public', 'img', 'upload');

const TABLAS = ['apartados', 'notificaciones', 'notificaciones_cliente', 'producto_presentacion', 'producto',
    'categorias', 'clientes', 'usuarios', 'page_views', 'auditoria', 'sessions'];

const CATEGORIAS = ['Abarrotes', 'Lácteos y huevos', 'Bebidas', 'Frutas y verduras', 'Panadería',
    'Aseo del hogar', 'Snacks y dulces', 'Cuidado personal'];

// [nombre, unidad, precio, stock, categoría, descripción, imagen, extras]
const PRODUCTOS = [
    ['Arroz blanco 1 kg', 'KG', 4200, 120, 'Abarrotes', 'Arroz blanco de grano largo, ideal para el diario.', 'arroz-blanco-1-kg', { presentaciones: [['Kilo', 1], ['Bulto 25 kg', 25]] }],
    ['Aceite vegetal 1 L', 'UND', 9800, 40, 'Abarrotes', 'Aceite vegetal para freír y cocinar.', 'aceite-vegetal-1-l'],
    ['Azúcar refinada 1 kg', 'KG', 4500, 80, 'Abarrotes', 'Azúcar blanca refinada.', 'azucar-refinada-1-kg'],
    ['Pasta spaghetti 500 g', 'UND', 3200, 60, 'Abarrotes', 'Pasta larga de trigo.', 'pasta-spaghetti-500-g'],
    ['Café molido 250 g', 'UND', 8900, 30, 'Abarrotes', 'Café tostado y molido, tueste medio.', 'cafe-molido-250-g', { descuento: 15 }],
    ['Huevos AA', 'UND', 650, 300, 'Lácteos y huevos', 'Huevo rojo AA, por cubeta o media cubeta.', 'huevos-aa', { presentaciones: [['Cubeta', 30], ['Media cubeta', 15]] }],
    ['Leche entera 1 L', 'UND', 4300, 48, 'Lácteos y huevos', 'Leche entera pasteurizada.', 'leche-entera-1-l', { presentaciones: [['Unidad', 1], ['Paca x6', 6]] }],
    ['Queso campesino 500 g', 'UND', 11500, 15, 'Lácteos y huevos', 'Queso fresco campesino.', 'queso-campesino-500-g'],
    ['Yogur de fresa 1 L', 'UND', 7900, 20, 'Lácteos y huevos', 'Yogur bebible sabor a fresa.', 'yogur-de-fresa-1-l', { descuento: 10 }],
    ['Gaseosa cola 400 ml', 'UND', 2500, 96, 'Bebidas', 'Bebida gaseosa sabor cola, botella personal.', 'gaseosa-cola-400-ml', { presentaciones: [['Unidad', 1], ['Paca', 12]] }],
    ['Agua sin gas 600 ml', 'UND', 1800, 72, 'Bebidas', 'Agua potable sin gas.', 'agua-sin-gas-600-ml', { presentaciones: [['Unidad', 1], ['Paca', 24]] }],
    ['Jugo de naranja 1 L', 'UND', 6500, 0, 'Bebidas', 'Jugo de naranja listo para tomar.', 'jugo-de-naranja-1-l'], // agotado
    ['Banano', 'KG', 3000, 40, 'Frutas y verduras', 'Banano maduro, precio por kilo.', 'banano', { descuento: 20 }],
    ['Tomate chonto', 'KG', 4800, 35, 'Frutas y verduras', 'Tomate chonto fresco, precio por kilo.', 'tomate-chonto'],
    ['Papa pastusa', 'KG', 2600, 90, 'Frutas y verduras', 'Papa pastusa lavada, precio por kilo.', 'papa-pastusa'],
    ['Pan tajado', 'UND', 5900, 25, 'Panadería', 'Pan tajado blanco, bolsa de 500 g.', 'pan-tajado'],
    ['Arepas de maíz x5', 'UND', 3500, 30, 'Panadería', 'Paquete de 5 arepas de maíz blanco.', 'arepas-de-maiz-x5'],
    ['Detergente en polvo 1 kg', 'UND', 10900, 25, 'Aseo del hogar', 'Detergente en polvo para ropa blanca y de color.', 'detergente-en-polvo-1-kg', { descuento: 25 }],
    ['Lavaloza en crema 500 g', 'UND', 5200, 30, 'Aseo del hogar', 'Lavaloza en crema con aroma a limón.', 'lavaloza-en-crema-500-g'],
    ['Papel higiénico x4', 'UND', 7400, 40, 'Aseo del hogar', 'Paquete de 4 rollos doble hoja.', 'papel-higienico-x4'],
    ['Papas fritas 110 g', 'UND', 4900, 50, 'Snacks y dulces', 'Papas fritas clásicas con sal.', 'papas-fritas-110-g'],
    ['Chocolatina 30 g', 'UND', 1500, 100, 'Snacks y dulces', 'Chocolatina de leche.', 'chocolatina-30-g', { presentaciones: [['Unidad', 1], ['Caja', 24]] }],
    ['Crema dental 100 ml', 'UND', 6200, 35, 'Cuidado personal', 'Crema dental con flúor.', 'crema-dental-100-ml'],
    ['Champú 400 ml', 'UND', 14900, 12, 'Cuidado personal', 'Champú para todo tipo de cabello.', 'champu-400-ml', { inactivo: true }],
];

const CLIENTES = [
    [DEMO_CLIENTE.nombre, DEMO_CLIENTE.documento, 'Carrera 7 # 12-34', '+57 300 000 0001'],
    ['María Rodríguez', '1000000002', 'Calle 15 # 3-21', '+57 300 000 0002'],
    ['Andrés Torres', '1000000003', 'Transversal 4 # 8-10', '+57 300 000 0003'],
    ['Sofía Martínez', '1000000004', 'Diagonal 20 # 9-45', '+57 300 000 0004'],
];

const TIENDA = {
    nombre: 'Tienda La Esquina',
    eslogan: 'Lo de todos los días, cerca de tu casa',
    descripcion: 'Tienda de barrio ficticia para demostración: abarrotes, lácteos, frutas, aseo y más. Aparta en línea y recoge en tienda.',
    logo_url: null,
    color_primario: '#1F7A4D',
    color_secundario: '#F2A33A',
    telefono: '+57 300 000 0000',
    whatsapp: '+57 300 000 0000',
    correo: 'hola@tiendalaesquina.example',
    direccion: 'Calle 10 # 5-20, Barrio Centro',
    horario: 'Lun a Sáb 7:00 a.m. – 8:00 p.m.',
    moneda: 'COP',
    minutos_expiracion_apartado: 60,
    facebook: 'https://example.com/tiendalaesquina',
    instagram: 'https://example.com/tiendalaesquina',
    tiktok: '',
    productos_ocultos: 'COMODIN',
};

const diasAtras = (dias, hora = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    d.setHours(hora, (dias * 7) % 60, 0, 0);
    return d;
};

async function main() {
    // Cada imagen debe llamarse como su producto (normalizado) para que el sitio la encuentre.
    for (const [nombre, , , , , , img] of PRODUCTOS) {
        if (normalizeText(img) !== normalizeText(nombre) || !fs.existsSync(path.join(IMG_ORIGEN, `${img}.webp`))) {
            throw new Error(`Imagen demo inválida para "${nombre}": ${img}.webp`);
        }
    }
    const nombreBD = dbConfig.database;
    if (!nombreBD) throw new Error('Falta DB_DATABASE (revisa .env).');
    if (BD_PROTEGIDAS.includes(nombreBD.toLowerCase())) {
        throw new Error(`La base "${nombreBD}" está protegida: el seed solo se usa en bases de demo (p. ej. tienda_db).`);
    }
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
        const filas = PRODUCTOS.map(([nombre, unidad, precio, stock, categoria, descripcion, , x = {}], i) => [
            `DEMO-${String(i + 1).padStart(3, '0')}`, nombre, unidad, 'Bodega principal', precio, stock, descripcion, categoria,
            x.inactivo ? 'inactivo' : 'activo', stock,
            x.descuento || 0, x.descuento ? inicioOferta : null, x.descuento ? finOferta : null,
        ]);
        filas.push(['DEMO-000', 'COMODIN', 'UND', 'Bodega principal', 1, 0, 'Producto interno del POS (oculto en la web).', 'Abarrotes', 'activo', 0, 0, null, null]);
        await db.query(`INSERT INTO producto (codigo, nombre, unidad, lugar, precio, stock, descripcion, categoria, estado,
            limite_venta, descuento, fecha_inicio_oferta, fecha_fin_oferta) VALUES ?`, [filas]);
        const [prods] = await db.query('SELECT id_producto, nombre, precio FROM producto');
        const id = Object.fromEntries(prods.map((p) => [p.nombre, p]));

        const presentaciones = [];
        PRODUCTOS.forEach(([nombre, , , , , , , x = {}]) =>
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
            [0, 'Huevos AA', 30, 'pendiente', 0], [1, 'Gaseosa cola 400 ml', 12, 'pendiente', 0],
            [2, 'Arroz blanco 1 kg', 5, 'confirmado', 1], [3, 'Leche entera 1 L', 6, 'confirmado', 2],
            [0, 'Pan tajado', 2, 'entregado', 3], [1, 'Café molido 250 g', 1, 'entregado', 4],
            [2, 'Banano', 3, 'entregado', 6], [3, 'Detergente en polvo 1 kg', 1, 'entregado', 8],
            [0, 'Queso campesino 500 g', 1, 'entregado', 10], [1, 'Papa pastusa', 4, 'entregado', 12],
            [2, 'Chocolatina 30 g', 6, 'cancelado', 5], [3, 'Aceite vegetal 1 L', 2, 'cancelado', 9],
            [0, 'Tomate chonto', 2, 'entregado', 13], [1, 'Papel higiénico x4', 1, 'confirmado', 1],
        ];
        await db.query(`INSERT INTO apartados (nombre_cliente, id_cliente, producto, cantidad, precio_aplicado, estado,
            cancelado_por, confirmado_por, fecha) VALUES ?`, [APARTADOS.map(([c, p, cant, estado, dias], i) => [
            cli[c].nombre, cli[c].id_cliente, id[p].id_producto, String(cant), id[p].precio, estado,
            estado === 'cancelado' ? (i % 2 ? 'admin' : 'cliente') : null,
            ['confirmado', 'entregado'].includes(estado) ? DEMO_EMPLEADO.usuario : null,
            diasAtras(dias, 8 + (i % 10)),
        ])]);

        await db.query('INSERT INTO notificaciones (titulo, mensaje, leido, fecha) VALUES ?', [[
            ['Nuevo apartado', `${cli[0].nombre} apartó 1 Cubeta de Huevos AA.`, 0, diasAtras(0, 9)],
            ['Nuevo apartado', `${cli[1].nombre} apartó 12 x Gaseosa cola 400 ml.`, 0, diasAtras(0, 11)],
            ['Apartado cancelado', `${cli[2].nombre} canceló su apartado de Chocolatina 30 g.`, 1, diasAtras(5, 15)],
        ]]);
        await db.query('INSERT INTO notificaciones_cliente (id_cliente, titulo, mensaje, leido, fecha) VALUES ?', [[
            [cli[2].id_cliente, 'Apartado confirmado', 'Tu apartado de Arroz blanco 1 kg está listo para recoger.', 0, diasAtras(1, 12)],
            [cli[3].id_cliente, 'Apartado confirmado', 'Tu apartado de Leche entera 1 L está listo para recoger.', 1, diasAtras(2, 10)],
            [cli[0].id_cliente, 'Apartado entregado', 'Gracias por tu compra de Pan tajado.', 1, diasAtras(3, 18)],
        ]]);

        // Visitas (~60) para el panel de analítica. IPs de loopback distintas para que cuenten como visitantes.
        const RUTAS = ['/', '/', '/', '/catalogo', '/catalogo', `/producto/${id['Huevos AA'].id_producto}`, '/verApartados', '/perfil'];
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
    const imgs = fs.readdirSync(IMG_ORIGEN).filter((f) => f.endsWith('.webp'));
    imgs.forEach((f) => fs.copyFileSync(path.join(IMG_ORIGEN, f), path.join(IMG_DESTINO, f)));
    console.log(`- ${imgs.length} imágenes copiadas a public/img/upload`);
    console.log('Listo.');
}

main().catch((err) => {
    console.error('Seed cancelado:', err.message);
    process.exitCode = 1;
});
