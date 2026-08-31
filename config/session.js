// =============================================
// CONFIGURACIÓN DE LA SESIÓN
// =============================================
// Opciones de express-session: la clave secreta
// y la cookie de sesión. Se importa en app.js.
// =============================================

const esProduccion = process.env.NODE_ENV === 'production';

module.exports = {
    secret: process.env.SESSION_SECRET || 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: esProduccion, // true en producción (https), false en local (http)
        httpOnly: true,       // evita que JS del navegador lea la cookie
        sameSite: 'lax',      // mitiga CSRF
        maxAge: 1000 * 60 * 60 // 1 hora
    }
};
