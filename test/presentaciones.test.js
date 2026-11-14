// =============================================
// PRUEBAS DE PRESENTACIONES (utils/presentaciones.js)
// =============================================
// Validación de la lista del admin, conversión a
// unidades mínimas y textos de cantidades.
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const { validarPresentaciones, calcularUnidades, describir } = require('../utils/presentaciones');

test('validarPresentaciones: limpia nombres, convierte factor y asigna orden', () => {
    const r = validarPresentaciones([{ nombre: '  Caja ', factor: '12' }, { nombre: 'Bulto', factor: 50 }]);
    assert.deepStrictEqual(r, { datos: [
        { nombre: 'Caja', factor: 12, orden: 0 },
        { nombre: 'Bulto', factor: 50, orden: 1 }
    ] });
});

test('validarPresentaciones: lista vacía es válida (quita todas)', () => {
    assert.deepStrictEqual(validarPresentaciones([]), { datos: [] });
});

test('validarPresentaciones: rechaza entradas inválidas', () => {
    assert.ok(validarPresentaciones(null).error);
    assert.ok(validarPresentaciones('Caja').error);
    assert.ok(validarPresentaciones(Array.from({ length: 11 }, (_, i) => ({ nombre: `P${i}`, factor: 2 }))).error);
    assert.ok(validarPresentaciones([{ nombre: '', factor: 2 }]).error);
    assert.ok(validarPresentaciones([{ nombre: '   ', factor: 2 }]).error);
    assert.ok(validarPresentaciones([{ nombre: 'x'.repeat(51), factor: 2 }]).error);
    assert.ok(validarPresentaciones([{ nombre: '<b>Caja', factor: 2 }]).error);
    assert.ok(validarPresentaciones([{ nombre: 'Caja', factor: 2 }, { nombre: 'CAJA', factor: 3 }]).error);
    for (const factor of [0, -1, 1.5, '2a', null, 100001, NaN]) {
        assert.ok(validarPresentaciones([{ nombre: 'Caja', factor }]).error, `factor ${factor}`);
    }
});

test('validarPresentaciones: acepta los límites (10 ítems, nombre de 50, factor 1 y 100000)', () => {
    const diez = Array.from({ length: 10 }, (_, i) => ({ nombre: `P${i}`, factor: i + 1 }));
    assert.strictEqual(validarPresentaciones(diez).datos.length, 10);
    assert.ok(validarPresentaciones([{ nombre: 'x'.repeat(50), factor: 1 }, { nombre: 'y', factor: 100000 }]).datos);
});

test('calcularUnidades: multiplica enteros positivos', () => {
    assert.strictEqual(calcularUnidades(2, 12), 24);
    assert.strictEqual(calcularUnidades(3), 3);
    assert.strictEqual(calcularUnidades('4', '5'), 20);
});

test('calcularUnidades: rechaza no enteros, ceros, negativos y desbordes', () => {
    for (const [c, f] of [[0, 12], [-1, 12], [1.5, 12], [2, 0], [2, 1.5], ['a', 1], [2, -3], [Number.MAX_SAFE_INTEGER, 2]]) {
        assert.strictEqual(calcularUnidades(c, f), null, `${c} x ${f}`);
    }
});

test('describir: con y sin presentación', () => {
    assert.strictEqual(describir(24, 'unidades', { nombre: 'Caja', factor: 12 }), '2 Caja(s) (24 unidades)');
    assert.strictEqual(describir(3, 'kg'), '3 kg');
    assert.strictEqual(describir(5, ''), '5 unidad(es)');
});
