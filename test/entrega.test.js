const test = require('node:test');
const assert = require('node:assert');
const { resolverEntrega } = require('../utils/entrega');

test('resolverEntrega: la tienda con una sola forma la impone', () => {
    assert.deepStrictEqual(resolverEntrega('recoger', 'domicilio'), { entrega: 'recoger' });
    assert.deepStrictEqual(resolverEntrega('domicilio', undefined), { entrega: 'domicilio' });
    assert.deepStrictEqual(resolverEntrega('raro', 'domicilio'), { entrega: 'recoger' });
});

test('resolverEntrega: con ambas, el cliente elige y no vale otra cosa', () => {
    assert.deepStrictEqual(resolverEntrega('ambos', 'domicilio'), { entrega: 'domicilio' });
    assert.deepStrictEqual(resolverEntrega('ambos', 'recoger'), { entrega: 'recoger' });
    assert.ok(resolverEntrega('ambos', '').error);
    assert.ok(resolverEntrega('ambos', 'drone').error);
});

test('validarDomicilio: exige dirección y teléfono, limpia y rechaza HTML', () => {
    const { validarDomicilio } = require('../utils/entrega');
    const ok = validarDomicilio({ direccion: ' Calle 10 # 5-20, Centro ', telefono: '+57 300 000 0001', indicaciones: 'Casa azul' });
    assert.deepStrictEqual(ok.datos, { direccion: 'Calle 10 # 5-20, Centro', telefono: '+57 300 000 0001', indicaciones: 'Casa azul' });
    assert.ok(validarDomicilio({ direccion: '', telefono: '3000000000' }).error);
    assert.ok(validarDomicilio({ direccion: 'Calle 10 # 5-20', telefono: 'abc' }).error);
    assert.ok(validarDomicilio({ direccion: '<b>x</b> calle', telefono: '3000000000' }).error);
    assert.ok(validarDomicilio(undefined).error);
});
