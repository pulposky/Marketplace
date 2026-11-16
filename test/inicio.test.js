const test = require('node:test');
const assert = require('node:assert');
const { armarInicio } = require('../utils/inicio');

const pasillos = [
    { numero: 1, nombre: 'Aseo', total: 2, color: '#111111' },
    { numero: 2, nombre: 'Despensa', total: 5, color: '#222222' },
    { numero: 3, nombre: 'Lácteos', total: 3, color: '#333333' },
];
const prod = (id, categoria, extra = {}) => ({ id_producto: id, categoria, estado: 'activo', ...extra });
const productos = [prod(1, 'Aseo'), prod(2, 'Aseo'), prod(3, 'Despensa'), prod(4, 'Despensa'), prod(5, 'Despensa'), prod(6, 'Despensa'), prod(7, 'Despensa'), prod(8, 'Lácteos'), prod(9, 'Lácteos'), prod(10, 'Lácteos')];
const ahora = new Date('2026-11-16T12:00:00Z');
const ctx = (extra = {}) => ({ pasillos, productos, destacados: productos.slice(0, 4), ofertas: [], ahora, ...extra });

test('expande categorias_auto en las N categorías más grandes', () => {
    const vista = armarInicio([{ tipo: 'categorias_auto', cantidad_categorias: 2 }], ctx());
    assert.deepStrictEqual(vista.map((b) => [b.tipo, b.pasillo.nombre]), [['categoria', 'Despensa'], ['categoria', 'Lácteos']]);
    assert.strictEqual(vista[0].productos.length, 5);
});

test('un bloque categoria limita la cantidad y usa el color de la categoría', () => {
    const [b] = armarInicio([{ tipo: 'categoria', categoria: 'Despensa', cantidad: 4, titulo: '' }], ctx());
    assert.strictEqual(b.productos.length, 4);
    assert.strictEqual(b.pasillo.color, '#222222');
});

test('omite una categoría inexistente', () => {
    assert.deepStrictEqual(armarInicio([{ tipo: 'categoria', categoria: 'Ferretería', cantidad: 8 }], ctx()), []);
});

test('omite ofertas, destacados y categorías sin productos', () => {
    const vista = armarInicio([
        { tipo: 'ofertas', cantidad: 6, con_reloj: true },
        { tipo: 'destacados', cantidad: 6 },
        { tipo: 'categoria', categoria: 'Aseo', cantidad: 8 },
    ], ctx({ destacados: [], productos: [], ofertas: [] }));
    assert.deepStrictEqual(vista, []);
});

test('deja pasar los bloques sin datos de productos', () => {
    const vista = armarInicio([{ tipo: 'texto', titulo: 'Hola', texto: '' }, { tipo: 'carrusel' }], ctx());
    assert.deepStrictEqual(vista.map((b) => b.tipo), ['texto', 'carrusel']);
});

test('finOferta es la fecha futura más próxima', () => {
    const ofertas = [
        prod(1, 'Aseo', { fecha_fin_oferta: '2026-11-20T00:00:00Z' }),
        prod(2, 'Aseo', { fecha_fin_oferta: '2026-11-18T00:00:00Z' }),
        prod(3, 'Aseo', { fecha_fin_oferta: '2026-11-10T00:00:00Z' }),
    ];
    const [b] = armarInicio([{ tipo: 'ofertas', cantidad: 6, con_reloj: true }], ctx({ ofertas }));
    assert.strictEqual(b.productos.length, 3);
    assert.strictEqual(b.finOferta, new Date('2026-11-18T00:00:00Z').toISOString());
});

test('finOferta es null sin fechas o con con_reloj false', () => {
    const conFecha = [prod(1, 'Aseo', { fecha_fin_oferta: '2026-11-20T00:00:00Z' })];
    assert.strictEqual(armarInicio([{ tipo: 'ofertas', cantidad: 6, con_reloj: true }], ctx({ ofertas: [prod(1, 'Aseo')] }))[0].finOferta, null);
    assert.strictEqual(armarInicio([{ tipo: 'ofertas', cantidad: 6, con_reloj: false }], ctx({ ofertas: conFecha }))[0].finOferta, null);
});

test('solo pinta un carrusel aunque haya dos bloques', () => {
    const vista = armarInicio([{ tipo: 'carrusel' }, { tipo: 'texto', titulo: 'x', texto: '' }, { tipo: 'carrusel' }], ctx());
    assert.deepStrictEqual(vista.map((b) => b.tipo), ['carrusel', 'texto']);
});
