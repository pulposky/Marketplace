const test = require('node:test');
const assert = require('node:assert');
const { generarCatalogo } = require('../scripts/catalogoDemo');

test('generarCatalogo: 1974 productos únicos que caben en la tabla producto', () => {
    const filas = generarCatalogo(1974, ['Bisagra cierre lento 110°']);
    assert.strictEqual(filas.length, 1974);
    const nombres = filas.map((f) => f[0].toLowerCase());
    assert.strictEqual(new Set(nombres).size, filas.length, 'nombres repetidos');
    for (const [nombre, unidad, precio, stock, categoria, descripcion] of filas) {
        assert.ok(nombre.length <= 100, `nombre largo: ${nombre}`); // varchar(100)
        assert.ok(descripcion.length <= 250, `descripción larga: ${nombre}`); // varchar(250)
        assert.ok(precio >= 100 && Number.isInteger(precio), `precio raro: ${nombre}`);
        assert.ok(Number.isInteger(stock) && stock >= 0);
        assert.ok(categoria && unidad);
    }
    assert.ok(filas.some((f) => f[3] === 0), 'debe haber agotados');
});

test('generarCatalogo: siempre sale igual y no repite nombres excluidos', () => {
    assert.deepStrictEqual(generarCatalogo(50), generarCatalogo(50));
    const primero = generarCatalogo(1)[0][0];
    assert.notStrictEqual(generarCatalogo(1, [primero])[0][0], primero);
});

test('generarCatalogo: avisa si no alcanzan las combinaciones', () => {
    assert.throws(() => generarCatalogo(100000), /solo alcanza/);
});
