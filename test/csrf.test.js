// =============================================
// PRUEBAS DEL MIDDLEWARE CSRF (middleware/csrf.js)
// =============================================
// Cubre las tres piezas: obtenerToken, iniciarCsrf y
// verificarCsrf. Se corren con: npm test (node:test).
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const { iniciarCsrf, verificarCsrf, obtenerToken } = require('../middleware/csrf');

// ---------- obtenerToken ----------
test('obtenerToken crea un token si la sesión no lo tiene', () => {
    const req = { session: {} };
    const token = obtenerToken(req);
    assert.ok(token, 'debe devolver un token');
    assert.strictEqual(req.session.csrf, token, 'debe guardarse en la sesión');
    assert.ok(/^[0-9a-f]{48}$/.test(token), 'debe ser 48 caracteres hex (24 bytes)');
});

test('obtenerToken no regenera el token si ya existe', () => {
    const req = { session: { csrf: 'token-existente' } };
    assert.strictEqual(obtenerToken(req), 'token-existente');
});

// ---------- iniciarCsrf ----------
test('iniciarCsrf expone el token en res.locals y en la sesión', () => {
    const req = { session: {} };
    const res = { locals: {} };
    let llamaronNext = false;
    iniciarCsrf(req, res, () => { llamaronNext = true; });

    assert.strictEqual(res.locals.csrfToken, req.session.csrf);
    assert.ok(res.locals.csrfToken);
    assert.strictEqual(llamaronNext, true);
});

// ---------- verificarCsrf ----------
const resJson = { json: (dato) => ({ dato }), status: () => resJson };

test('verificarCsrf deja pasar GET, HEAD y OPTIONS', () => {
    for (const metodo of ['GET', 'HEAD', 'OPTIONS']) {
        const req = { method: metodo, headers: {}, session: { csrf: 'tok' } };
        let paso = false;
        verificarCsrf(req, {}, () => { paso = true; });
        assert.strictEqual(paso, true, `${metodo} debe pasar`);
    }
});

test('verificarCsrf acepta el token correcto por cabecera x-csrf-token', () => {
    const req = { method: 'POST', headers: { 'x-csrf-token': 'secreto' }, session: { csrf: 'secreto' }, body: {} };
    let paso = false;
    verificarCsrf(req, resJson, () => { paso = true; });
    assert.strictEqual(paso, true);
});

test('verificarCsrf acepta el token correcto por el campo _csrf', () => {
    const req = { method: 'POST', headers: {}, body: { _csrf: 'secreto' }, session: { csrf: 'secreto' } };
    let paso = false;
    verificarCsrf(req, resJson, () => { paso = true; });
    assert.strictEqual(paso, true);
});

test('verificarCsrf rechaza con 403 si falta el token', () => {
    const req = { method: 'POST', headers: {}, body: {}, session: { csrf: 'secreto' } };
    let status = null;
    const res = { json: () => ({}), status: (s) => { status = s; return res; } };
    verificarCsrf(req, res, () => {});
    assert.strictEqual(status, 403);
});

test('verificarCsrf rechaza con 403 si el token es vacío', () => {
    const req = { method: 'POST', headers: { 'x-csrf-token': '' }, body: {}, session: { csrf: 'secreto' } };
    let status = null;
    const res = { json: () => ({}), status: (s) => { status = s; return res; } };
    verificarCsrf(req, res, () => {});
    assert.strictEqual(status, 403);
});

test('verificarCsrf rechaza con 403 si el token es incorrecto', () => {
    const req = { method: 'POST', headers: { 'x-csrf-token': 'malo' }, body: {}, session: { csrf: 'secreto' } };
    let status = null;
    const res = { json: () => ({}), status: (s) => { status = s; return res; } };
    verificarCsrf(req, res, () => {});
    assert.strictEqual(status, 403);
});
