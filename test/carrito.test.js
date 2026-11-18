const test = require('node:test');
const assert = require('node:assert');
const { leerLinea, aplicar, MAX_LINEAS } = require('../utils/carrito');

test('leerLinea: valida producto, presentación y cantidad', () => {
    assert.deepStrictEqual(leerLinea({ productoId: '3', cantidad: 2 }).linea, { idProducto: 3, idPresentacion: 0, cantidad: 2 });
    assert.deepStrictEqual(leerLinea({ productoId: 3, presentacionId: '7', cantidad: 0 }).linea, { idProducto: 3, idPresentacion: 7, cantidad: 0 });
    assert.ok(leerLinea({ productoId: 'x', cantidad: 1 }).error);
    assert.ok(leerLinea({ productoId: 3, cantidad: -1 }).error);
    assert.ok(leerLinea({ productoId: 3, cantidad: 1.5 }).error);
    assert.ok(leerLinea(undefined).error);
});

test('aplicar: suma, fija y quita sin tocar la lista original', () => {
    const base = [{ idProducto: 1, idPresentacion: 0, cantidad: 2 }];
    assert.strictEqual(aplicar(base, { idProducto: 1, idPresentacion: 0, cantidad: 3 }, 'sumar')[0].cantidad, 5);
    assert.strictEqual(aplicar(base, { idProducto: 1, idPresentacion: 0, cantidad: 3 }, 'fijar')[0].cantidad, 3);
    assert.strictEqual(aplicar(base, { idProducto: 1, idPresentacion: 0, cantidad: 0 }, 'fijar').length, 0);
    assert.strictEqual(aplicar(base, { idProducto: 1, idPresentacion: 4, cantidad: 1 }, 'sumar').length, 2);
    assert.strictEqual(base[0].cantidad, 2);
});

test('aplicar: no pasa del máximo de líneas', () => {
    let lista = [];
    for (let i = 1; i <= MAX_LINEAS + 5; i++) lista = aplicar(lista, { idProducto: i, idPresentacion: 0, cantidad: 1 }, 'sumar');
    assert.strictEqual(lista.length, MAX_LINEAS);
});
