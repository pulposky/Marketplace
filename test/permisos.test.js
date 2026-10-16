// =============================================
// PRUEBAS DEL CATÁLOGO DE PERMISOS (utils/permisos.js)
// =============================================
// Verifica las claves válidas, qué roles se pueden
// gestionar y los permisos por defecto de cada rol.
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const {
    ROL_SUPERADMIN,
    ROLES_GESTIONABLES,
    PERMISOS,
    CLAVES_PERMISO,
    PERMISOS_POR_DEFECTO,
    esClaveValida,
    esRolGestionable,
    permisosPorDefectoDe
} = require('../utils/permisos');

test('CLAVES_PERMISO: coincide con el catálogo de PERMISOS', () => {
    assert.deepStrictEqual(CLAVES_PERMISO, PERMISOS.map((p) => p.clave));
    assert.ok(CLAVES_PERMISO.includes('productos'));
    assert.ok(CLAVES_PERMISO.includes('clientes'));
    assert.ok(CLAVES_PERMISO.includes('analitica'));
    assert.ok(CLAVES_PERMISO.includes('categorias'));
    assert.ok(!CLAVES_PERMISO.includes('configuracion'));
    assert.ok(!CLAVES_PERMISO.includes('contenido'));
    assert.ok(!CLAVES_PERMISO.includes('banners'));
    assert.ok(CLAVES_PERMISO.includes('respaldo'));
    assert.ok(CLAVES_PERMISO.includes('usuarios'));
    assert.ok(CLAVES_PERMISO.includes('auditoria'));
});

test('esClaveValida: acepta solo permisos del catálogo', () => {
    assert.strictEqual(esClaveValida('productos'), true);
    assert.strictEqual(esClaveValida('clientes'), true);
    assert.strictEqual(esClaveValida('noExiste'), false);
    assert.strictEqual(esClaveValida(''), false);
    assert.strictEqual(esClaveValida(null), false);
});

test('ROLES_GESTIONABLES: incluye a todos menos al Administrador', () => {
    assert.deepStrictEqual(ROLES_GESTIONABLES, ['supervisor', 'promotor', 'tecnico']);
    assert.ok(!ROLES_GESTIONABLES.includes(ROL_SUPERADMIN));
});

test('esRolGestionable: reconoce variantes de escritura', () => {
    assert.strictEqual(esRolGestionable('Técnico'), true);
    assert.strictEqual(esRolGestionable('SUPERVISOR'), true);
    assert.strictEqual(esRolGestionable('admin'), false);
    assert.strictEqual(esRolGestionable('cliente'), false);
});

test('permisosPorDefectoDe: el Administrador siempre tiene todo', () => {
    const permisos = permisosPorDefectoDe('Administrador');
    assert.strictEqual(permisos.length, CLAVES_PERMISO.length);
    CLAVES_PERMISO.forEach((clave) => assert.ok(permisos.includes(clave)));
});

test('permisosPorDefectoDe: reproduce el comportamiento actual de cada rol', () => {
    // Supervisor y Promotor traen el panel completo EXCEPTO los módulos
    // sensibles (usuarios, respaldo y auditoría), que el Administrador concede a mano.
    const panelCompleto = ['productos', 'ofertas', 'pedidos', 'carrusel', 'clientes', 'analitica', 'categorias'];
    assert.deepStrictEqual(permisosPorDefectoDe('supervisor').sort(), [...panelCompleto].sort());
    assert.deepStrictEqual(permisosPorDefectoDe('promotor').sort(), [...panelCompleto].sort());

    assert.ok(!permisosPorDefectoDe('supervisor').includes('usuarios'));
    assert.ok(!permisosPorDefectoDe('supervisor').includes('auditoria'));
    assert.ok(!permisosPorDefectoDe('supervisor').includes('respaldo'));

    const tecnico = permisosPorDefectoDe('Técnico');
    assert.ok(tecnico.includes('productos'));
    assert.ok(tecnico.includes('carrusel'));
    assert.ok(!tecnico.includes('clientes'));
    assert.ok(!tecnico.includes('analitica'));
    assert.ok(!tecnico.includes('usuarios'));
    assert.ok(!tecnico.includes('categorias'));
    assert.ok(!tecnico.includes('respaldo'));
});

test('permisosPorDefectoDe: devuelve una copia (no el objeto original)', () => {
    const permisos = permisosPorDefectoDe('tecnico');
    permisos.push('clientes');
    assert.ok(!PERMISOS_POR_DEFECTO.tecnico.includes('clientes'));
});
