// =============================================
// PRUEBAS DE LA CONFIGURACIÓN DE LA TIENDA
// =============================================
// Verifica la validación de lo que llega del panel
// (services/tiendaService.validarConfiguracion) y la
// mezcla con los valores por defecto. No usa la BD.
// =============================================

const test = require('node:test');
const assert = require('node:assert');

// El servicio carga el modelo, que abre el pool: lo reemplazo por uno falso
const fake = { query: () => {}, promise: () => ({ query: async () => [[]], execute: async () => [[]] }) };
require.cache[require.resolve('../database/conexion')] = { id: 'x', loaded: true, exports: fake };
const { validarConfiguracion, normalizar, POR_DEFECTO } = require('../services/tiendaService');

test('acepta una configuración válida y normaliza la moneda', () => {
    const { datos, error } = validarConfiguracion({
        nombre: ' Tienda La Esquina ', color_primario: '#1f7a4d', moneda: 'cop',
        whatsapp: '+57 300 000 0000', instagram: 'https://instagram.com/demo', minutos_expiracion_apartado: '90'
    });
    assert.strictEqual(error, undefined);
    assert.deepStrictEqual(datos, {
        nombre: 'Tienda La Esquina', color_primario: '#1f7a4d', moneda: 'COP',
        whatsapp: '+57 300 000 0000', instagram: 'https://instagram.com/demo', minutos_expiracion_apartado: 90
    });
});

test('rechaza HTML, colores y URLs inválidas', () => {
    assert.ok(validarConfiguracion({ nombre: '<script>x</script>' }).error);
    assert.ok(validarConfiguracion({ nombre: '' }).error);
    assert.ok(validarConfiguracion({ color_primario: 'red' }).error);
    assert.ok(validarConfiguracion({ facebook: 'javascript:alert(1)' }).error);
    assert.ok(validarConfiguracion({ facebook: 'http://inseguro.com' }).error);
    assert.ok(validarConfiguracion({ correo: 'no-es-correo' }).error);
});

test('valida el rango de minutos de expiración', () => {
    assert.ok(validarConfiguracion({ minutos_expiracion_apartado: 2 }).error);
    assert.ok(validarConfiguracion({ minutos_expiracion_apartado: 'abc' }).error);
    assert.strictEqual(validarConfiguracion({ minutos_expiracion_apartado: 60 }).datos.minutos_expiracion_apartado, 60);
});

test('ignora campos que no son configurables (mass assignment)', () => {
    const { datos } = validarConfiguracion({ id: 5, logo_url: '/evil.svg', rol: 'admin', nombre: 'X' });
    assert.deepStrictEqual(datos, { nombre: 'X' });
});

test('normalizar rellena con los valores por defecto', () => {
    assert.deepStrictEqual(normalizar(null), { ...POR_DEFECTO });
    const r = normalizar({ nombre: 'Demo', minutos_expiracion_apartado: '30', logo_url: null });
    assert.strictEqual(r.nombre, 'Demo');
    assert.strictEqual(r.minutos_expiracion_apartado, 30);
    assert.strictEqual(r.moneda, 'COP');
});
