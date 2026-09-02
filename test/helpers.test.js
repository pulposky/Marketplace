// =============================================
// PRUEBAS DE UTILIDADES COMPARTIDAS (utils/helpers.js)
// =============================================
// Cubre normalizarCategorias y calcularPrecioOferta.
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const { normalizarCategorias, calcularPrecioOferta } = require('../utils/helpers');

test('normalizarCategorias: devuelve array vacío si no hay valor', () => {
    assert.deepStrictEqual(normalizarCategorias(undefined), []);
    assert.deepStrictEqual(normalizarCategorias(null), []);
    assert.deepStrictEqual(normalizarCategorias(''), []);
});

test('normalizarCategorias: convierte un string en un array de un elemento limpio', () => {
    assert.deepStrictEqual(normalizarCategorias('  Frutas '), ['Frutas']);
});

test('normalizarCategorias: convierte un array, recorta espacios y descarta vacíos', () => {
    assert.deepStrictEqual(
        normalizarCategorias([' Frutas ', '', '  ', 'Lácteos']),
        ['Frutas', 'Lácteos']
    );
});

test('calcularPrecioOferta: sin descuento no aplica oferta', () => {
    const resultado = calcularPrecioOferta({ precio: 100, descuento: 0 });
    assert.strictEqual(resultado.enOferta, false);
    assert.strictEqual(resultado.precioFinal, 100);
    assert.strictEqual(resultado.precioOriginal, 100);
});

test('calcularPrecioOferta: con descuento y sin fechas aplica oferta siempre', () => {
    const resultado = calcularPrecioOferta({ precio: 100, descuento: 20, fecha_inicio_oferta: null, fecha_fin_oferta: null });
    assert.strictEqual(resultado.enOferta, true);
    assert.strictEqual(resultado.precioFinal, 80);
    assert.strictEqual(resultado.descuento, 20);
});

test('calcularPrecioOferta: redondea el precio final a 2 decimales', () => {
    const resultado = calcularPrecioOferta({ precio: 99.99, descuento: 33, fecha_inicio_oferta: null, fecha_fin_oferta: null });
    assert.strictEqual(resultado.precioFinal, Math.round(99.99 * 0.67 * 100) / 100);
});

test('calcularPrecioOferta: no aplica oferta antes de la fecha de inicio', () => {
    const resultado = calcularPrecioOferta({
        precio: 100,
        descuento: 20,
        fecha_inicio_oferta: new Date(Date.now() + 86400000), // mañana
        fecha_fin_oferta: null
    });
    assert.strictEqual(resultado.enOferta, false);
    assert.strictEqual(resultado.precioFinal, 100);
});

test('calcularPrecioOferta: no aplica oferta después de la fecha de fin', () => {
    const resultado = calcularPrecioOferta({
        precio: 100,
        descuento: 20,
        fecha_inicio_oferta: null,
        fecha_fin_oferta: new Date(Date.now() - 86400000) // ayer
    });
    assert.strictEqual(resultado.enOferta, false);
    assert.strictEqual(resultado.precioFinal, 100);
});

test('calcularPrecioOferta: aplica oferta dentro del rango de fechas', () => {
    const resultado = calcularPrecioOferta({
        precio: 100,
        descuento: 20,
        fecha_inicio_oferta: new Date(Date.now() - 86400000), // ayer
        fecha_fin_oferta: new Date(Date.now() + 86400000)      // mañana
    });
    assert.strictEqual(resultado.enOferta, true);
    assert.strictEqual(resultado.precioFinal, 80);
});

test('calcularPrecioOferta: descuento mayor o igual a 100 no aplica oferta', () => {
    const resultado = calcularPrecioOferta({ precio: 100, descuento: 100 });
    assert.strictEqual(resultado.enOferta, false);
});
