// =============================================
// CONFIGURACIÓN DE LÍMITES DE PETICIONES
// =============================================
// Definiciones reutilizables de express-rate-limit.
// La general se usa en toda la app (app.js) y la
// de auth se aplica a login/registro para frenar
// la fuerza bruta.
// =============================================

const rateLimit = require('express-rate-limit');

// Límite general: 300 peticiones por IP cada 15 min
const limiteGeneral = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300,
    standardHeaders: true,
    legacyHeaders: false
});

// Límite estricto para login/registro: 5 intentos por IP cada 15 segundos.
// Devuelve el error con el mismo formato que espera el frontend
// ({ ok, tipo, mensaje }) para que el mensaje sí se muestre en pantalla.
const limiteAuth = rateLimit({
    windowMs: 15 * 1000,       // 15 segundos
    max: 5,                      // 5 intentos permitidos en esa ventana
    message: { ok: false, tipo: 'vacio', mensaje: 'Demasiados intentos, espera unos segundos' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { limiteGeneral, limiteAuth };
