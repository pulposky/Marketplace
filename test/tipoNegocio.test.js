const test = require('node:test');
const assert = require('node:assert');
const { vocabulario, etiquetaSeccion, esTipoValido } = require('../utils/tipoNegocio');

test('vocabulario devuelve el del tipo pedido o el por defecto si no es válido', () => {
    assert.strictEqual(vocabulario('ferreteria').seccion, 'Sección');
    assert.strictEqual(vocabulario('comida_rapida').mostrarStock, false);
    assert.strictEqual(vocabulario('inventado').tipo, 'supermercado');
    assert.strictEqual(vocabulario(undefined).seccion, 'Pasillo');
    assert.strictEqual(esTipoValido('__proto__'), false);
});

test('etiquetaSeccion numera solo si el tipo lo pide', () => {
    assert.strictEqual(etiquetaSeccion(vocabulario('supermercado'), 3), 'Pasillo 3');
    assert.strictEqual(etiquetaSeccion(vocabulario('general'), 3), null);
});
