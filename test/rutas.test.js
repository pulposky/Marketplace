// =============================================
// PRUEBAS DE PROTECCIÓN DE RUTAS (routes/admin.js, routes/cliente.js)
// =============================================
// Recorre router.stack y comprueba que toda ruta del
// panel (/admin, /api/admin) y toda API del cliente
// (/api/) corta una petición sin sesión ANTES de llegar
// al controlador. Se simula la cadena de handlers de la
// ruta sin ejecutar nunca el último (el controlador).
// database/conexion se reemplaza por un falso para no
// abrir el pool de MySQL.
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');

// Conexión falsa: toda consulta falla, sin abrir sockets.
const errorBD = () => new Error('BD no disponible en pruebas');
const fakeConexion = {
    query: (...args) => { const cb = args[args.length - 1]; if (typeof cb === 'function') cb(errorBD()); },
    execute: (...args) => { const cb = args[args.length - 1]; if (typeof cb === 'function') cb(errorBD()); },
    getConnection: (cb) => cb && cb(errorBD()),
    promise: () => ({
        query: () => Promise.reject(errorBD()),
        execute: () => Promise.reject(errorBD()),
        getConnection: () => Promise.reject(errorBD())
    })
};
const rutaConexion = require.resolve('../database/conexion');
require.cache[rutaConexion] = { id: rutaConexion, filename: rutaConexion, loaded: true, exports: fakeConexion };

const routerAdmin = require('../routes/admin');
const routerCliente = require('../routes/cliente');
const verificarAdmin = require('../middleware/verificarAdmin');

// Rutas (con método) del router cuyo path cumple el filtro
const rutasDe = (router, filtro) => router.stack
    .filter((layer) => layer.route && filtro(String(layer.route.path)))
    .map((layer) => ({
        path: String(layer.route.path),
        metodos: Object.keys(layer.route.methods).join(','),
        handlers: layer.route.stack.map((l) => l.handle)
    }));

// Simula una petición sin sesión recorriendo los handlers de la ruta.
// Devuelve cómo terminó: 'rechazada', 'controlador' o 'colgada'.
const simularSinSesion = (ruta, headers = {}) => {
    const req = { path: ruta.path, originalUrl: ruta.path, url: ruta.path, headers, xhr: false, params: {}, query: {}, body: {} };
    const res = { codigo: null, redirigidoA: null };
    res.status = (c) => { res.codigo = c; return res; };
    res.json = () => res;
    res.redirect = (url) => { res.redirigidoA = url; return res; };

    for (let i = 0; i < ruta.handlers.length; i++) {
        if (i === ruta.handlers.length - 1) return { fin: 'controlador', res };
        let siguio = false;
        ruta.handlers[i](req, res, () => { siguio = true; });
        if (res.codigo === 401 || res.redirigidoA) return { fin: 'rechazada', res, guardia: ruta.handlers[i] };
        if (!siguio) return { fin: 'colgada', res };
    }
    return { fin: 'controlador', res };
};

// ---------- routes/admin.js ----------
const rutasAdmin = rutasDe(routerAdmin, (p) => p.startsWith('/admin') || p.startsWith('/api/admin'));

test('routes/admin.js: hay rutas del panel registradas', () => {
    assert.ok(rutasAdmin.length > 30, `solo ${rutasAdmin.length} rutas`);
});

test('routes/admin.js: toda ruta /admin y /api/admin rechaza sin sesión antes del controlador', () => {
    const fallas = [];
    for (const ruta of rutasAdmin) {
        const { fin, res } = simularSinSesion(ruta);
        const esperado = ruta.path.startsWith('/api/') ? res.codigo === 401 : res.redirigidoA === '/';
        if (fin !== 'rechazada' || !esperado) {
            fallas.push(`${ruta.metodos.toUpperCase()} ${ruta.path} -> ${fin} (status ${res.codigo}, redirect ${res.redirigidoA})`);
        }
    }
    assert.deepStrictEqual(fallas, []);
});

test('routes/admin.js: el guardia de cada ruta también niega a un cliente logueado', () => {
    // Un guardia que solo exige sesión (verificarUsuario) dejaría pasar a un cliente.
    const fallas = [];
    for (const ruta of rutasAdmin) {
        const { guardia } = simularSinSesion(ruta);
        if (!guardia) continue;
        const res = { codigo: null, redirigidoA: null };
        res.status = (c) => { res.codigo = c; return res; };
        res.json = () => res;
        res.redirect = (url) => { res.redirigidoA = url; return res; };
        let siguio = false;
        guardia({ path: ruta.path, headers: {}, xhr: false, session: { usuario: { id: 5, role: 'cliente' } } }, res, () => { siguio = true; });
        if (siguio) fallas.push(`${ruta.metodos.toUpperCase()} ${ruta.path}`);
    }
    assert.deepStrictEqual(fallas, []);
});

// /api/admin/dashboard filtra cada bloque por permisos dentro del controlador
test('routes/admin.js: las rutas de verificarAdmin son las esperadas (solo /admin, notificaciones y dashboard)', () => {
    const conAdmin = rutasAdmin.filter((r) => r.handlers.includes(verificarAdmin)).map((r) => r.path);
    for (const p of conAdmin) {
        assert.ok(p === '/admin' || p === '/api/admin/dashboard' || p.startsWith('/api/admin/notificaciones'), `verificarAdmin en ${p}`);
    }
});

// ---------- routes/cliente.js ----------
const rutasApiCliente = rutasDe(routerCliente, (p) => p.startsWith('/api/'));

test('routes/cliente.js: hay APIs del cliente registradas', () => {
    assert.ok(rutasApiCliente.length > 0);
});

test('routes/cliente.js: toda API /api/ responde 401 sin sesión (petición fetch) antes del controlador', () => {
    const fallas = [];
    for (const ruta of rutasApiCliente) {
        const { fin, res } = simularSinSesion(ruta, { accept: 'application/json' });
        if (fin !== 'rechazada' || res.codigo !== 401) {
            fallas.push(`${ruta.metodos.toUpperCase()} ${ruta.path} -> ${fin} (status ${res.codigo})`);
        }
    }
    assert.deepStrictEqual(fallas, []);
});

test('routes/cliente.js: toda API /api/ sin cabeceras tampoco llega al controlador', () => {
    const fallas = rutasApiCliente
        .filter((ruta) => simularSinSesion(ruta).fin !== 'rechazada')
        .map((ruta) => `${ruta.metodos.toUpperCase()} ${ruta.path}`);
    assert.deepStrictEqual(fallas, []);
});
