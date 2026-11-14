const test = require('node:test');
const assert = require('node:assert');
const { armarPasillos, buscarPasillo, COLORES } = require('../utils/pasillos');

test('armarPasillos numera por orden alfabético, cuenta y omite inactivos', () => {
    const pasillos = armarPasillos([
        { categoria: 'Bebidas', estado: 'activo' },
        { categoria: 'Abarrotes', estado: 'activo' },
        { categoria: 'Bebidas', estado: 'activo' },
        { categoria: 'Aseo', estado: 'inactivo' },
        { categoria: '', estado: 'activo' },
    ]);
    assert.deepStrictEqual(pasillos.map((p) => [p.numero, p.nombre, p.total]), [[1, 'Abarrotes', 1], [2, 'Bebidas', 2]]);
    assert.strictEqual(pasillos[0].color, COLORES[0]);
});

test('buscarPasillo encuentra por nombre y devuelve null si no existe', () => {
    const pasillos = armarPasillos([{ categoria: 'Panadería' }]);
    assert.strictEqual(buscarPasillo(pasillos, ' Panadería ').numero, 1);
    assert.strictEqual(buscarPasillo(pasillos, 'Otra'), null);
});
