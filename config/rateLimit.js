/* ============================================= */
/* RATELIMIT.JS - LÍMITES DE PETICIONES          */
/* ============================================= */
/* Definiciones reutilizables de                  */
/* express-rate-limit. La general se usa en toda  */
/* la app (app.js) y la de auth se aplica a       */
/* login/registro para frenar la fuerza bruta.    */
/* ============================================= */

const rateLimit = require('express-rate-limit');

// Opciones comunes: desactivo la validación estricta del header
// X-Forwarded-For para que no falle cuando el cliente lo envía pero
// no hay un proxy de confianza configurado (p. ej. en desarrollo).
const opciones = {
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
};

// Límite general: 300 peticiones por IP cada 15 min
const limiteGeneral = rateLimit({
    ...opciones,
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 300
});

// Límite estricto para login/registro: 10 intentos por IP cada 15 minutos.
// Devuelve el error con el mismo formato que espera el frontend
// ({ ok, tipo, mensaje }) para que el mensaje sí se muestre en pantalla.
const limiteAuth = rateLimit({
    ...opciones,
    windowMs: 15 * 60 * 1000,  // 15 minutos
    max: 10,                     // 10 intentos permitidos en esa ventana
    message: { ok: false, tipo: 'vacio', mensaje: 'Demasiados intentos, espera 15 minutos' }
});

// Límite para crear apartados: 20 por IP cada 10 minutos (evita
// que alguien bloquee todo el stock con reservas automáticas).
const limiteApartar = rateLimit({
    ...opciones,
    windowMs: 10 * 60 * 1000,
    max: 20,
    message: { error: 'Demasiados apartados seguidos, intenta en unos minutos.' }
});

module.exports = { limiteGeneral, limiteAuth, limiteApartar };
