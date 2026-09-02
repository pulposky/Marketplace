// =============================================
// APLICACIÓN EXPRESS
// =============================================
// Acá se construye la app: motor de vistas,
// middlewares, sesión y rutas. No arranca el
// servidor; eso lo hace server.js.
// =============================================

const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const { limiteGeneral, limiteAuth } = require('./config/rateLimit');
const { iniciarCsrf, verificarCsrf } = require('./middleware/csrf');

const app = express();

// Confío en proxies (necesario para rate-limit correcto detrás de proxy inverso)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Headers de seguridad (CSP, X-Frame-Options, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: ["'self'"]
        }
    }
}));

// Comprime las respuestas (gzip) para cargar más rápido
app.use(compression());

// Los archivos estáticos (CSS, JS, imágenes) van directos desde /public
app.use(express.static('public'));

// Configuro EJS como motor de plantillas, las vistas están en public/views
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');

// Esto me permite leer formularios HTML y también JSON que mande el frontend con fetch
// (el límite grande es para subir imágenes de producto en base64)
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
app.use(express.json({ limit: '4mb' }));

// Límite de peticiones genérico por IP (previene abuso / fuerza bruta)
app.use(limiteGeneral);

// La sesión va ANTES de las rutas, sino no funciona
app.use(session(require('./config/session')));

// Token CSRF: se genera y expone en cada vista
app.use(iniciarCsrf);

// Registro de visitas para las estadísticas
app.use(require('./middleware/contadorVisitas'));

// Protección CSRF: valida el token en toda petición que cambie estado
app.use(verificarCsrf);

// Cargo todas las rutas del proyecto
app.use('/', require('./routes'));

// Middleware para rutas no encontradas (404 en API, sino EJS)
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    res.status(404).render('error', { codigo: 404, mensaje: 'La página que buscas no existe o fue movida.' });
});

// Middleware de manejo de errores (evita que se caiga el servidor)
app.use((err, req, res, next) => {
    // El límite de peticiones de rate-limit tiene su propio estado
    if (err && (err.statusCode === 429 || err.status === 429)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes, intenta más tarde' });
    }
    console.error('Error:', err);
    if (res.headersSent) {
        return next(err);
    }
    if (req.path.startsWith('/api/')) {
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.status(500).render('error', { codigo: 500, mensaje: 'Algo salió mal. Por favor, intenta de nuevo más tarde.' });
});

module.exports = app;