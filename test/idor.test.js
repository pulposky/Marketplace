// =============================================
// PRUEBAS DE PROPIEDAD DE APARTADOS (utils/apartados.js)
// =============================================
// El dueño de un apartado se identifica por id_cliente,
// nunca por el nombre (antes era un IDOR). Cubre
// idClienteDeSesion y esDuenoApartado.
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const { idClienteDeSesion, esDuenoApartado } = require('../utils/apartados');

const cliente = (id, nombre = 'Ana') => ({ id, role: 'cliente', nombre });

test('esDuenoApartado: el cliente dueño (mismo id_cliente) es dueño', () => {
    assert.strictEqual(esDuenoApartado({ id_cliente: 5, nombre_cliente: 'Ana' }, cliente(5)), true);
});

test('esDuenoApartado: otro cliente no es dueño', () => {
    assert.strictEqual(esDuenoApartado({ id_cliente: 5 }, cliente(6)), false);
});

test('esDuenoApartado: mismo nombre pero distinto id_cliente no es dueño (IDOR anterior)', () => {
    const apartado = { id_cliente: 5, nombre_cliente: 'Ana', cliente: 'Ana' };
    assert.strictEqual(esDuenoApartado(apartado, cliente(6, 'Ana')), false);
});

test('esDuenoApartado: fila antigua con id_cliente null no tiene dueño', () => {
    assert.strictEqual(esDuenoApartado({ id_cliente: null, nombre_cliente: 'Ana' }, cliente(5)), false);
    assert.strictEqual(esDuenoApartado({ nombre_cliente: 'Ana' }, cliente(5)), false);
});

test('esDuenoApartado: una sesión del staff (admin id 1) no es dueña del apartado del cliente 1', () => {
    assert.strictEqual(esDuenoApartado({ id_cliente: 1 }, { id: 1, role: 'admin' }), false);
    assert.strictEqual(idClienteDeSesion({ id: 1, role: 'admin' }), null);
});

test('esDuenoApartado: compara ids string y número ("5" vs 5)', () => {
    assert.strictEqual(esDuenoApartado({ id_cliente: 5 }, cliente('5')), true);
    assert.strictEqual(esDuenoApartado({ id_cliente: '5' }, cliente(5)), true);
});

test('esDuenoApartado: sin sesión o sin apartado devuelve false', () => {
    assert.strictEqual(esDuenoApartado({ id_cliente: 5 }, undefined), false);
    assert.strictEqual(esDuenoApartado({ id_cliente: 5 }, null), false);
    assert.strictEqual(esDuenoApartado(null, cliente(5)), false);
});

test('idClienteDeSesion: rechaza ids no válidos', () => {
    assert.strictEqual(idClienteDeSesion(cliente(0)), null);
    assert.strictEqual(idClienteDeSesion(cliente(-3)), null);
    assert.strictEqual(idClienteDeSesion(cliente('abc')), null);
    assert.strictEqual(idClienteDeSesion(cliente(2.5)), null);
    assert.strictEqual(idClienteDeSesion(cliente(7)), 7);
});
