const test = require('node:test');
const assert = require('node:assert');
const { normalizarDias, serieDiaria, variacion, serieHoras } = require('../utils/dashboard');

test('normalizarDias acepta 7, 30 y 90; lo demás cae en 30', () => {
    assert.strictEqual(normalizarDias('7'), 7);
    assert.strictEqual(normalizarDias(90), 90);
    assert.strictEqual(normalizarDias('365'), 30);
    assert.strictEqual(normalizarDias(undefined), 30);
});

test('serieDiaria rellena los días sin datos y termina hoy', () => {
    const hoy = new Date(2026, 10, 14);
    const serie = serieDiaria([{ dia: '2026-11-13', ventas: '1500.50', apartados: 2 }], 3, ['ventas', 'apartados'], hoy);
    assert.deepStrictEqual(serie, [
        { dia: '2026-11-12', ventas: 0, apartados: 0 },
        { dia: '2026-11-13', ventas: 1500.5, apartados: 2 },
        { dia: '2026-11-14', ventas: 0, apartados: 0 },
    ]);
});

test('variacion calcula el cambio y devuelve null sin período anterior', () => {
    assert.strictEqual(variacion(150, 100), 50);
    assert.strictEqual(variacion(50, 100), -50);
    assert.strictEqual(variacion(10, 0), null);
});

test('serieHoras devuelve las 24 horas', () => {
    const horas = serieHoras([{ hora: 9, total: 4 }]);
    assert.strictEqual(horas.length, 24);
    assert.strictEqual(horas[9].total, 4);
    assert.strictEqual(horas[10].total, 0);
});
