// =============================================
// CONFIGURACIÓN DE LA SESIÓN
// =============================================
// Opciones de express-session: la clave secreta
// y la cookie de sesión. Se importa en app.js.
// =============================================

module.exports = {
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // En local con http funciona bien, en producción con https hay que poner true
        maxAge: 1000 * 60 * 60 // 1 hora
    }
};



