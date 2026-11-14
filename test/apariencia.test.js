const test = require('node:test');
const assert = require('node:assert');
const { validarApariencia, normalizarApariencia, aplicarApariencia, plural, POR_DEFECTO } = require('../utils/apariencia');

test('validarApariencia acepta valores válidos y completa con los por defecto', () => {
    const { datos } = validarApariencia({ anuncio_activo: true, anuncio: ' Domicilios gratis ', secciones_inicio: 2, tipografia: 'clasica' });
    assert.strictEqual(datos.anuncio, 'Domicilios gratis');
    assert.strictEqual(datos.secciones_inicio, 2);
    assert.strictEqual(datos.tipografia, 'clasica');
    assert.strictEqual(datos.esquinas, POR_DEFECTO.esquinas);
});

test('validarApariencia rechaza HTML, opciones inexistentes y rangos', () => {
    assert.ok(validarApariencia({ anuncio: '<script>' }).error);
    assert.ok(validarApariencia({ tipografia: 'comic' }).error);
    assert.ok(validarApariencia({ tipografia: '__proto__' }).error);
    assert.ok(validarApariencia({ secciones_inicio: 9 }).error);
    assert.ok(validarApariencia({ mostrar_ofertas: 'si' }).error);
    assert.ok(validarApariencia(null).error);
});

test('normalizarApariencia tolera JSON roto y descarta lo inválido', () => {
    assert.deepStrictEqual(normalizarApariencia('{roto'), { ...POR_DEFECTO });
    assert.strictEqual(normalizarApariencia('{"tipografia":"comic","esquinas":"rectas"}').tipografia, 'moderna');
    assert.strictEqual(normalizarApariencia('{"esquinas":"rectas"}').esquinas, 'rectas');
});

test('aplicarApariencia cambia el nombre de las categorías y el stock', () => {
    const vocab = { seccion: 'Pasillo', secciones: 'Pasillos', mostrarStock: true };
    const v = aplicarApariencia(vocab, { ...POR_DEFECTO, nombre_seccion: 'Góndola', mostrar_stock: 'no' });
    assert.strictEqual(v.seccion, 'Góndola');
    assert.strictEqual(v.secciones, 'Góndolas');
    assert.strictEqual(v.mostrarStock, false);
    assert.strictEqual(plural('Sección'), 'Secciones');
    assert.strictEqual(plural('Estante'), 'Estantes');
});
