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
    ROLES_ADMIN,
    ROLES_PANEL,
    esRolAdmin,
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

test('esRolAdmin: los cuatro roles con acceso total dan true', () => {
    for (const rol of ROLES_ADMIN) {
        assert.strictEqual(esRolAdmin(rol), true, `${rol} debe tener acceso admin`);
    }
    assert.strictEqual(esRolAdmin('Administrador'), true);
    assert.strictEqual(esRolAdmin('Técnico'), true);
    assert.strictEqual(esRolAdmin('aprendiz'), false);
    assert.strictEqual(esRolAdmin('cliente'), false);
    assert.strictEqual(esRolAdmin(''), false);
    assert.strictEqual(esRolAdmin(undefined), false);
});

test('esRolPanel: incluye a los roles admin y también al aprendiz', () => {
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

test('ROLES_ADMIN no incluye al aprendiz y ROLES_PANEL sí', () => {
    assert.ok(!ROLES_ADMIN.includes('aprendiz'));
    assert.ok(ROLES_PANEL.includes('aprendiz'));
    assert.deepStrictEqual(ROLES_ADMIN, ['admin', 'supervisor', 'promotor', 'tecnico']);
});
