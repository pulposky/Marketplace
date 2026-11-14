// =============================================
// PRUEBAS DE LOS MIDDLEWARES DE AUTORIZACIÓN
// =============================================
// Cubre verificarAdmin, verificarPermiso, verificarRol
// y verificarUsuario con req/res falsos.
// permisosService requiere models/permisosModel, que a
// su vez requiere database/conexion (pool MySQL): se
// reemplaza por un falso para no abrir conexiones.
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

const verificarAdmin = require('../middleware/verificarAdmin');
const verificarPermiso = require('../middleware/verificarPermiso');
const verificarRol = require('../middleware/verificarRol');
const verificarUsuario = require('../middleware/verificarUsuario');

// ---------- utilidades ----------
const crearReq = ({ usuario, path = '/admin/algo', headers = {}, xhr = false } = {}) => ({
    session: usuario ? { usuario } : {},
    path,
    headers,
    xhr
});

const crearRes = () => {
    const res = { codigo: null, cuerpo: null, redirigidoA: null };
    res.status = (c) => { res.codigo = c; return res; };
    res.json = (b) => { res.cuerpo = b; return res; };
    res.redirect = (url) => { res.redirigidoA = url; return res; };
    return res;
};

// Ejecuta el middleware y devuelve { res, paso } (paso = llamó a next)
const ejecutar = (mw, opciones) => {
    const req = crearReq(opciones);
    const res = crearRes();
    let paso = false;
    mw(req, res, () => { paso = true; });
    return { res, paso };
};

const MIDDLEWARES = {
    verificarAdmin,
    'verificarPermiso(productos)': verificarPermiso('productos'),
    'verificarRol([admin])': verificarRol(['admin'])
};

// ---------- sin sesión ----------
for (const [nombre, mw] of Object.entries(MIDDLEWARES)) {
    test(`${nombre}: sin sesión en /api/ responde 401 JSON`, () => {
        const { res, paso } = ejecutar(mw, { path: '/api/admin/x' });
        assert.strictEqual(paso, false);
        assert.strictEqual(res.codigo, 401);
        assert.strictEqual(res.cuerpo.login, false);
    });

    test(`${nombre}: sin sesión en una página redirige al inicio`, () => {
        const { res, paso } = ejecutar(mw, { path: '/admin/x' });
        assert.strictEqual(paso, false);
        assert.strictEqual(res.redirigidoA, '/');
        assert.strictEqual(res.codigo, null);
    });

    test(`${nombre}: sin sesión con XHR o Accept JSON responde 401`, () => {
        assert.strictEqual(ejecutar(mw, { xhr: true }).res.codigo, 401);
        assert.strictEqual(ejecutar(mw, { headers: { accept: 'application/json' } }).res.codigo, 401);
    });
}

test('verificarAdmin y verificarPermiso: req.session undefined no explota', () => {
    for (const mw of [verificarAdmin, verificarPermiso('productos'), verificarRol(['admin'])]) {
        const res = crearRes();
        let paso = false;
        mw({ path: '/api/x', headers: {} }, res, () => { paso = true; });
        assert.strictEqual(paso, false);
        assert.strictEqual(res.codigo, 401);
    }
});

// ---------- rol cliente ----------
test('verificarAdmin: un cliente recibe 403', () => {
    const { res, paso } = ejecutar(verificarAdmin, { usuario: { id: 5, role: 'cliente' }, path: '/api/admin/x' });
    assert.strictEqual(paso, false);
    assert.strictEqual(res.codigo, 403);
});

test('verificarPermiso(clientes): un cliente recibe 403 en API y redirección en página', () => {
    const mw = verificarPermiso('clientes');
    const api = ejecutar(mw, { usuario: { id: 5, role: 'cliente' }, path: '/api/admin/clientes' });
    assert.strictEqual(api.paso, false);
    assert.strictEqual(api.res.codigo, 403);
    const pagina = ejecutar(mw, { usuario: { id: 5, role: 'cliente' }, path: '/admin/clientes' });
    assert.strictEqual(pagina.paso, false);
    assert.strictEqual(pagina.res.redirigidoA, '/admin');
});

test('verificarAdmin: el staff del panel pasa', () => {
    for (const role of ['admin', 'supervisor', 'promotor', 'tecnico']) {
        assert.strictEqual(ejecutar(verificarAdmin, { usuario: { id: 1, role } }).paso, true, role);
    }
});

// ---------- técnico (permisos por defecto, sin BD) ----------
test('verificarPermiso: técnico sin clientes/analitica/usuarios', () => {
    for (const clave of ['clientes', 'analitica', 'usuarios']) {
        const { res, paso } = ejecutar(verificarPermiso(clave), { usuario: { id: 2, role: 'tecnico' }, path: '/api/admin/x' });
        assert.strictEqual(paso, false, clave);
        assert.strictEqual(res.codigo, 403, clave);
    }
});

test('verificarPermiso: técnico con productos pasa', () => {
    assert.strictEqual(ejecutar(verificarPermiso('productos'), { usuario: { id: 2, role: 'tecnico' } }).paso, true);
});

test('verificarPermiso: acepta la variante "Técnico" del rol', () => {
    assert.strictEqual(ejecutar(verificarPermiso('productos'), { usuario: { id: 2, role: 'Técnico' } }).paso, true);
    assert.strictEqual(ejecutar(verificarPermiso('clientes'), { usuario: { id: 2, role: 'Técnico' } }).paso, false);
});

test('verificarPermiso: una clave inexistente se niega aunque el rol exista', () => {
    assert.strictEqual(ejecutar(verificarPermiso('noExiste'), { usuario: { id: 3, role: 'supervisor' } }).paso, false);
});

// ---------- admin (superadmin) ----------
test('verificarPermiso: el admin (superadmin) pasa en todos los permisos', () => {
    const { CLAVES_PERMISO } = require('../utils/permisos');
    for (const clave of CLAVES_PERMISO) {
        assert.strictEqual(ejecutar(verificarPermiso(clave), { usuario: { id: 1, role: 'admin' } }).paso, true, clave);
    }
});

// ---------- verificarRol ----------
test('verificarRol([admin]): niega al supervisor (403 en API, redirección en página)', () => {
    const mw = verificarRol(['admin']);
    const api = ejecutar(mw, { usuario: { id: 3, role: 'supervisor' }, path: '/api/admin/permisos' });
    assert.strictEqual(api.paso, false);
    assert.strictEqual(api.res.codigo, 403);
    const pagina = ejecutar(mw, { usuario: { id: 3, role: 'supervisor' }, path: '/admin/permisos' });
    assert.strictEqual(pagina.paso, false);
    assert.strictEqual(pagina.res.redirigidoA, '/admin');
});

test('verificarRol([admin]): deja pasar al admin y acepta un rol suelto', () => {
    assert.strictEqual(ejecutar(verificarRol(['admin']), { usuario: { id: 1, role: 'admin' } }).paso, true);
    assert.strictEqual(ejecutar(verificarRol('admin'), { usuario: { id: 1, role: 'admin' } }).paso, true);
    assert.strictEqual(ejecutar(verificarRol('admin'), { usuario: { id: 5, role: 'cliente' } }).paso, false);
});

// ---------- verificarUsuario ----------
test('verificarUsuario: con sesión pasa', () => {
    assert.strictEqual(ejecutar(verificarUsuario, { usuario: { id: 5, role: 'cliente' } }).paso, true);
});

test('verificarUsuario: sin sesión con Accept JSON o XHR responde 401', () => {
    assert.strictEqual(ejecutar(verificarUsuario, { headers: { accept: 'application/json' } }).res.codigo, 401);
    assert.strictEqual(ejecutar(verificarUsuario, { xhr: true }).res.codigo, 401);
});

test('verificarUsuario: sin sesión en una página redirige al inicio', () => {
    const { res, paso } = ejecutar(verificarUsuario, { path: '/perfil' });
    assert.strictEqual(paso, false);
    assert.strictEqual(res.redirigidoA, '/');
});

test('verificarUsuario: sin sesión en /api/ nunca llega a next()', () => {
    // A diferencia de los otros middlewares no mira req.path: sin cabeceras
    // redirige en vez de responder 401, pero igual corta la petición.
    const { res, paso } = ejecutar(verificarUsuario, { path: '/api/perfil' });
    assert.strictEqual(paso, false);
    assert.ok(res.codigo === 401 || res.redirigidoA === '/');
});
