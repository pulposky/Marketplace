const test = require('node:test');
const assert = require('node:assert');
const { vocabulario, TIPOS, esTipoValido } = require('../utils/tipoNegocio');

test('vocabulario devuelve el del tipo pedido o el por defecto si no es válido', () => {
    assert.strictEqual(vocabulario('comida_rapida').seccion, 'Sección');
    assert.strictEqual(vocabulario('comida_rapida').mostrarStock, false);
    assert.strictEqual(vocabulario('inventado').tipo, 'supermercado');
    assert.strictEqual(vocabulario(undefined).seccion, 'Categoría');
    assert.strictEqual(esTipoValido('__proto__'), false);
});

test('ningún tipo habla de pasillos ni numera categorías', () => {
    for (const v of Object.values(TIPOS)) {
        assert.ok(!/pasillo/i.test(v.seccion + v.secciones));
        assert.strictEqual(v.numerar, undefined);
    }
});
