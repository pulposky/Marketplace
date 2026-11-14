// =============================================
// PRUEBAS DE UTILIDADES CSV (utils/csv.js)
// =============================================
// Cubre escaparCeldaCSV (comillas e inyección de fórmulas).
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const { escaparCeldaCSV } = require('../utils/csv');

test('escaparCeldaCSV: neutraliza fórmulas con comilla simple', () => {
    assert.strictEqual(escaparCeldaCSV('=1+1'), '"\'=1+1"');
    assert.strictEqual(escaparCeldaCSV('+57300'), '"\'+57300"');
    assert.strictEqual(escaparCeldaCSV('-2+3'), '"\'-2+3"');
    assert.strictEqual(escaparCeldaCSV('@SUM(A1)'), '"\'@SUM(A1)"');
    assert.strictEqual(escaparCeldaCSV('\tx'), '"\'\tx"');
});

test('escaparCeldaCSV: duplica comillas internas y maneja vacíos', () => {
    assert.strictEqual(escaparCeldaCSV('dijo "hola"'), '"dijo ""hola"""');
    assert.strictEqual(escaparCeldaCSV(null), '""');
    assert.strictEqual(escaparCeldaCSV(undefined), '""');
});

test('escaparCeldaCSV: los números no se tocan', () => {
    assert.strictEqual(escaparCeldaCSV(-5), '"-5"');
    assert.strictEqual(escaparCeldaCSV(12.5), '"12.5"');
});
