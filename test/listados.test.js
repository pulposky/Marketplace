const test = require('node:test');
const assert = require('node:assert');
const { paginar, leerFiltrosAdmin, filtrarProductosAdmin, categoriasDe } = require('../utils/listados');

const lista = Array.from({ length: 50 }, (_, i) => i + 1);

test('paginar: corta la página y ajusta páginas fuera de rango', () => {
    assert.deepStrictEqual(paginar(lista, 2, 24).items, lista.slice(24, 48));
    assert.deepStrictEqual(paginar(lista, 2, 24).totalPaginas, 3);
    assert.strictEqual(paginar(lista, 99, 24).pagina, 3);
    assert.strictEqual(paginar(lista, 'x', 24).pagina, 1);
    assert.deepStrictEqual(paginar([], 1, 24), { items: [], pagina: 1, totalPaginas: 1, total: 0 });
});

test('leerFiltrosAdmin: ignora valores que no existen', () => {
    assert.deepStrictEqual(leerFiltrosAdmin({ estado: 'borrado', stock: '<script>', oferta: 'si', q: '  bisagra ' }),
        { q: 'bisagra', categoria: '', estado: '', stock: '', oferta: false });
});

test('filtrarProductosAdmin: combina búsqueda, categoría, estado, existencias y oferta', () => {
    const ps = [
        { nombre: 'Bisagra negra', categoria: 'Bisagras', estado: 'activo', limite_venta: 0, descuento: 10 },
        { nombre: 'Bisagra dorada', categoria: 'Bisagras', estado: 'inactivo', limite_venta: 5, descuento: 0 },
        { nombre: 'Manija barra', categoria: 'Manijas', estado: 'activo', limite_venta: 40, descuento: 0 },
    ];
    const f = (x) => filtrarProductosAdmin(ps, { ...leerFiltrosAdmin({}), ...x }).map((p) => p.nombre);
    assert.deepStrictEqual(f({ q: 'bisagra' }), ['Bisagra negra', 'Bisagra dorada']);
    assert.deepStrictEqual(f({ stock: 'agotado' }), ['Bisagra negra']);
    assert.deepStrictEqual(f({ stock: 'bajo' }), ['Bisagra dorada']);
    assert.deepStrictEqual(f({ stock: 'con', estado: 'activo' }), ['Manija barra']);
    assert.deepStrictEqual(f({ oferta: true }), ['Bisagra negra']);
    assert.deepStrictEqual(f({ categoria: 'Manijas' }), ['Manija barra']);
    assert.deepStrictEqual(categoriasDe(ps), ['Bisagras', 'Manijas']);
});
