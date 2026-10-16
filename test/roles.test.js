// =============================================
// PRUEBAS DE ROLES DEL PANEL (utils/roles.js)
// =============================================
// Verifica la normalización de roles y qué roles
// pueden entrar al panel (esRolPanel) y cuáles
// tienen acceso total (esRolAdmin).
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const {
    normalizarRol,
    rolCanonico,
    EQUIVALENCIAS_ROL,
    ROL_SUPERADMIN,
    ROLES_ADMIN,
    ROLES_MANTENIMIENTO,
    ROLES_CARRUSEL,
    ROLES_PANEL,
    esSuperAdmin,
    esRolAdmin,
    esRolMantenimiento,
    puedeGestionarCarrusel,
    esRolPanel
} = require('../utils/roles');

test('normalizarRol: quita espacios, mayúsculas y tildes', () => {
    assert.strictEqual(normalizarRol('  Administrador '), 'administrador');
    assert.strictEqual(normalizarRol('Técnico'), 'tecnico');
    assert.strictEqual(normalizarRol('TÉCNICO'), 'tecnico');
    assert.strictEqual(normalizarRol(null), '');
    assert.strictEqual(normalizarRol(undefined), '');
});

test('EQUIVALENCIAS_ROL: mapea los roles de la BD a los roles de sesión', () => {
    assert.strictEqual(EQUIVALENCIAS_ROL.administrador, 'admin');
    assert.strictEqual(EQUIVALENCIAS_ROL.admin, 'admin');
    assert.strictEqual(EQUIVALENCIAS_ROL.aprendiz, 'aprendiz');
    assert.strictEqual(EQUIVALENCIAS_ROL.supervisor, 'supervisor');
    assert.strictEqual(EQUIVALENCIAS_ROL.promotor, 'promotor');
    assert.strictEqual(EQUIVALENCIAS_ROL.tecnico, 'tecnico');
});

test('rolCanonico: convierte los valores crudos de la BD al rol de sesión', () => {
    assert.strictEqual(rolCanonico('Administrador'), 'admin');
    assert.strictEqual(rolCanonico('Técnico'), 'tecnico');
    assert.strictEqual(rolCanonico('SUPERVISOR'), 'supervisor');
    assert.strictEqual(rolCanonico('Promotor'), 'promotor');
    assert.strictEqual(rolCanonico('Cajero'), 'cajero');
    assert.strictEqual(rolCanonico(''), '');
});

test('esRolAdmin: los roles con acceso total dan true', () => {
    for (const rol of ROLES_ADMIN) {
        assert.strictEqual(esRolAdmin(rol), true, `${rol} debe tener acceso admin`);
    }
    assert.strictEqual(esRolAdmin('Administrador'), true);
    // El técnico ya NO tiene acceso total (es mantenimiento del sitio).
    assert.strictEqual(esRolAdmin('Técnico'), false);
    assert.strictEqual(esRolAdmin('aprendiz'), false);
    assert.strictEqual(esRolAdmin('cliente'), false);
    assert.strictEqual(esRolAdmin(''), false);
    assert.strictEqual(esRolAdmin(undefined), false);
});

test('esSuperAdmin: solo el Administrador es superadmin', () => {
    assert.strictEqual(ROL_SUPERADMIN, 'admin');
    assert.strictEqual(esSuperAdmin('admin'), true);
    assert.strictEqual(esSuperAdmin('Administrador'), true);
    assert.strictEqual(esSuperAdmin('supervisor'), false);
    assert.strictEqual(esSuperAdmin('Técnico'), false);
    assert.strictEqual(esSuperAdmin(''), false);
});

test('esRolMantenimiento: solo el técnico es mantenimiento del sitio', () => {
    assert.strictEqual(esRolMantenimiento('Técnico'), true);
    assert.strictEqual(esRolMantenimiento('tecnico'), true);
    assert.strictEqual(esRolMantenimiento('admin'), false);
    assert.strictEqual(esRolMantenimiento('aprendiz'), false);
    assert.strictEqual(esRolMantenimiento(''), false);
});

test('puedeGestionarCarrusel: acceso total + técnico; el cliente no', () => {
    assert.strictEqual(puedeGestionarCarrusel('admin'), true);
    assert.strictEqual(puedeGestionarCarrusel('supervisor'), true);
    assert.strictEqual(puedeGestionarCarrusel('promotor'), true);
    assert.strictEqual(puedeGestionarCarrusel('Técnico'), true);
    assert.strictEqual(puedeGestionarCarrusel('cliente'), false);
});

test('esRolPanel: incluye a los roles de admin y al técnico', () => {
    for (const rol of ROLES_PANEL) {
        assert.strictEqual(esRolPanel(rol), true, `${rol} debe poder entrar al panel`);
    }
    assert.strictEqual(esRolPanel('Supervisor'), true);
    assert.strictEqual(esRolPanel('Promotor'), true);
    assert.strictEqual(esRolPanel('Técnico'), true);
    assert.strictEqual(esRolPanel('cliente'), false);
    assert.strictEqual(esRolPanel('usuario'), false);
    assert.strictEqual(esRolPanel(null), false);
});

test('ROLES_ADMIN no incluye al técnico; ROLES_PANEL sí', () => {
    assert.ok(!ROLES_ADMIN.includes('tecnico'));
    assert.ok(ROLES_PANEL.includes('tecnico'));
    assert.deepStrictEqual(ROLES_ADMIN, ['admin', 'supervisor', 'promotor']);
    assert.deepStrictEqual(ROLES_MANTENIMIENTO, ['tecnico']);
    assert.deepStrictEqual(ROLES_CARRUSEL, ['admin', 'supervisor', 'promotor', 'tecnico']);
});
