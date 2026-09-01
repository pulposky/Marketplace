// =============================================
// MIDDLEWARE: PROTECCIÓN CSRF
// =============================================
// Genera un token por sesión y lo expone en cada
// vista (res.locals.csrfToken) para que el frontend
// lo repita en toda petición que cambie estado
// (POST/PUT/PATCH/DELETE). El frontend lo envía en
// la cabecera "x-csrf-token" y acá se compara con
// el de la sesión. Si no coincide, se rechaza.
// =============================================

const crypto = require('crypto');

// Recupera (o crea) el token de la sesión
function obtenerToken(req) {
    if (!req.session.csrf) {
        req.session.csrf = crypto.randomBytes(24).toString('hex');
    }
    return req.session.csrf;
}

// Expone el token a todas las vistas (res.locals)
function iniciarCsrf(req, res, next) {
    res.locals.csrfToken = obtenerToken(req);
    next();
}

// Valida el token en las peticiones que cambian estado.
// Acepta el token por cabecera "x-csrf-token" o por el
// campo de formulario "_csrf".
function verificarCsrf(req, res, next) {
    const metodosSeguros = ['GET', 'HEAD', 'OPTIONS'];
    if (metodosSeguros.includes(req.method)) {
        return next();
    }

    const cabecera = req.headers['x-csrf-token'];
    const campo = req.body && req.body._csrf ? String(req.body._csrf) : '';
    const tokenRecibido = String(cabecera || campo || '');

    if (!tokenRecibido || tokenRecibido !== req.session.csrf) {
        return res.status(403).json({ error: 'Token de seguridad inválido o ausente.' });
    }

    next();
}

module.exports = { iniciarCsrf, verificarCsrf, obtenerToken };