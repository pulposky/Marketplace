// =============================================
// PRUEBAS DE VALIDACIÓN DE IMÁGENES (utils/imagenValida.js)
// =============================================
// Cubre tipoRealImagen (detección por bytes mágicos).
// Se corren con: npm test (node:test, sin dependencias)
// =============================================

const test = require('node:test');
const assert = require('node:assert');
const { tipoRealImagen } = require('../utils/imagenValida');

test('tipoRealImagen: detecta JPG, PNG y WebP', () => {
    assert.strictEqual(tipoRealImagen(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00])), 'jpg');
    assert.strictEqual(tipoRealImagen(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00])), 'png');
    assert.strictEqual(tipoRealImagen(Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBPVP8 ')])), 'webp');
});

test('tipoRealImagen: rechaza HTML, SVG y entradas vacías', () => {
    assert.strictEqual(tipoRealImagen(Buffer.from('<html><script>alert(1)</script></html>')), null);
    assert.strictEqual(tipoRealImagen(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
    assert.strictEqual(tipoRealImagen(Buffer.alloc(0)), null);
    assert.strictEqual(tipoRealImagen(null), null);
});
