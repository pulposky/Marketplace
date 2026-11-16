const test = require('node:test');
const assert = require('node:assert');
const { validarBloques, normalizarBloques, bloquesPorDefecto, TIPOS_BLOQUE } = require('../utils/bloques');
const { POR_DEFECTO: AP } = require('../utils/apariencia');

test('validarBloques acepta una lista válida y completa campos por defecto', () => {
    const { datos, error } = validarBloques([{ tipo: 'ofertas' }]);
    assert.strictEqual(error, undefined);
    assert.strictEqual(datos[0].cantidad, 6);
    assert.strictEqual(datos[0].con_reloj, true);
    assert.strictEqual(datos[0].titulo, 'Ofertas de la semana');
});

test('validarBloques rechaza tipo desconocido, HTML, más de 20 y no-arreglo', () => {
    assert.ok(validarBloques([{ tipo: 'video' }]).error);
    assert.ok(validarBloques([{ tipo: '__proto__' }]).error);
    assert.ok(validarBloques([{ tipo: 'texto', texto: '<b>hola</b>' }]).error);
    assert.ok(validarBloques(Array.from({ length: 21 }, () => ({ tipo: 'texto' }))).error);
    assert.ok(validarBloques(null).error);
    assert.ok(validarBloques({ tipo: 'texto' }).error);
});

test('validarBloques valida enlaces e imágenes', () => {
    assert.ok(validarBloques([{ tipo: 'banner', imagen: '/img/upload/tienda/a.png', enlace: 'javascript:alert(1)' }]).error);
    assert.ok(validarBloques([{ tipo: 'banner', imagen: '/img/upload/tienda/a.png', enlace: '//otro.com' }]).error);
    assert.ok(validarBloques([{ tipo: 'banner', imagen: 'https://x.com/a.png' }]).error);
    assert.ok(validarBloques([{ tipo: 'banner', imagen: '/img/upload/tienda/../x.png' }]).error);
    assert.ok(validarBloques([{ tipo: 'banner' }]).error, 'el banner necesita imagen');
    const ok = validarBloques([{ tipo: 'banner', imagen: '/img/upload/tienda/bloque-1.webp', enlace: '/catalogo?soloOferta=1' }]);
    assert.strictEqual(ok.error, undefined);
    assert.strictEqual(validarBloques([{ tipo: 'portada', enlace_boton: 'https://wa.me/57300' }]).error, undefined);
});

test('validarBloques valida rangos y la categoría', () => {
    assert.ok(validarBloques([{ tipo: 'categoria', categoria: 'Aseo', cantidad: 20 }]).error);
    assert.ok(validarBloques([{ tipo: 'categoria' }]).error);
    assert.ok(validarBloques([{ tipo: 'categorias_auto', cantidad_categorias: 9 }]).error);
    assert.ok(validarBloques([{ tipo: 'ofertas', con_reloj: 'si' }]).error);
    assert.strictEqual(validarBloques([{ tipo: 'categoria', categoria: 'Aseo', cantidad: 16 }]).datos[0].cantidad, 16);
});

test('validarBloques valida los cuatro pasos', () => {
    const { datos } = validarBloques([{ tipo: 'pasos' }]);
    assert.strictEqual(datos[0].pasos.length, 4);
    assert.strictEqual(datos[0].pasos[0].titulo, 'Elige');
    assert.ok(validarBloques([{ tipo: 'pasos', pasos: [{ titulo: '<x>', texto: '' }] }]).error);
    const otro = validarBloques([{ tipo: 'pasos', pasos: [{ titulo: 'Pide', texto: 'Por WhatsApp' }] }]).datos[0];
    assert.strictEqual(otro.pasos[0].titulo, 'Pide');
    assert.strictEqual(otro.pasos[1].titulo, 'Aparta');
});

test('bloquesPorDefecto respeta la apariencia vieja', () => {
    const lista = bloquesPorDefecto({ ...AP, mostrar_pasos: false, secciones_inicio: 2, texto_boton_portada: 'Ir' });
    assert.deepStrictEqual(lista.map((b) => b.tipo), ['portada', 'beneficios', 'carrusel', 'ofertas', 'destacados', 'categorias_auto']);
    assert.strictEqual(lista.find((b) => b.tipo === 'categorias_auto').cantidad_categorias, 2);
    assert.strictEqual(lista[0].texto_boton, 'Ir');
    assert.deepStrictEqual(bloquesPorDefecto(AP).map((b) => b.tipo).slice(-1), ['pasos']);
});

test('normalizarBloques usa los por defecto si no hay nada o el JSON está roto', () => {
    assert.deepStrictEqual(normalizarBloques(null, AP), bloquesPorDefecto(AP));
    assert.deepStrictEqual(normalizarBloques('{roto', AP), bloquesPorDefecto(AP));
    assert.deepStrictEqual(normalizarBloques('[]', AP), []);
    const lista = normalizarBloques(JSON.stringify([{ tipo: 'video' }, { tipo: 'texto', titulo: 'Hola' }]), AP);
    assert.deepStrictEqual(lista.map((b) => b.tipo), ['texto']);
    assert.strictEqual(lista[0].titulo, 'Hola');
});

test('TIPOS_BLOQUE trae nombre para el panel', () => {
    assert.strictEqual(Object.keys(TIPOS_BLOQUE).length, 10);
    assert.ok(Object.values(TIPOS_BLOQUE).every((t) => t.nombre));
});
