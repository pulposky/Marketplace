/* ============================================= */
/* APP.JS - APLICACIÓN EXPRESS                   */
/* ============================================= */
/* Acá se construye la app: motor de vistas,     */
/* middlewares, sesión y rutas. No arranca el    */
/* servidor; eso lo hace server.js.              */
/* ============================================= */

const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const conexion = require('./database/conexion');
const helmet = require('helmet');
const compression = require('compression');
const crypto = require('crypto');
const { limiteGeneral, limiteAuth } = require('./config/rateLimit');
const { iniciarCsrf, verificarCsrf } = require('./middleware/csrf');
const { esRolAdmin, esRolPanel, esRolMantenimiento, puedeGestionarCarrusel, esSuperAdmin } = require('./utils/roles');
const permisosService = require('./services/permisosService');
const tiendaService = require('./services/tiendaService');
const { vocabulario } = require('./utils/tipoNegocio');
const { aplicarApariencia, estiloApariencia } = require('./utils/apariencia');

const app = express();

// Confío en proxies (necesario para rate-limit correcto detrás de proxy inverso)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Nonce por petición: solo los <script> inline con este nonce se ejecutan
// (las vistas lo ponen con nonce="<%= cspNonce %>"). Reemplaza 'unsafe-inline'.
app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
});

// Headers de seguridad (CSP, X-Frame-Options, etc.)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`, 'https://cdn.jsdelivr.net'],
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

// Expongo los helpers de roles a todas las vistas EJS
// (p. ej. esRolAdmin(usuario.role) para mostrar secciones)
app.use((req, res, next) => {
    // Configuración del negocio (nombre, logo, colores, contacto...) para todas las vistas
    res.locals.tienda = tiendaService.obtener();
    // Palabras según el tipo de negocio (Pasillo, Sección, Menú...)
    res.locals.vocab = aplicarApariencia(vocabulario(res.locals.tienda.tipo_negocio), res.locals.tienda.apariencia);
    res.locals.estilo = estiloApariencia(res.locals.tienda.apariencia);
    // Ruta actual, para marcar el módulo activo en el menú del panel
    res.locals.rutaActual = req.path;
    res.locals.esRolAdmin = esRolAdmin;
    res.locals.esRolPanel = esRolPanel;
    res.locals.esRolMantenimiento = esRolMantenimiento;
    res.locals.puedeGestionarCarrusel = puedeGestionarCarrusel;
    res.locals.esSuperAdmin = esSuperAdmin;
    next();
});

// Esto me permite leer formularios HTML y también JSON que mande el frontend con fetch
// Límite grande SOLO en las rutas que suben imágenes en base64;
// el resto acepta 100 kb (si el primer parser ya leyó el body, el segundo lo salta).
app.use(['/api/admin/productos', '/api/admin/carrusel', '/api/admin/tienda'], express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));

// Límite de peticiones genérico por IP (previene abuso / fuerza bruta)
app.use(limiteGeneral);

// La sesión va ANTES de las rutas, sino no funciona
// Sesiones guardadas en la BD (tabla 'sessions', la crea el store):
// no se pierden al reiniciar y no llenan la memoria del proceso.
app.use(session({
    ...require('./config/session'),
    store: new MySQLStore({ clearExpired: true, checkExpirationInterval: 15 * 60 * 1000 }, conexion)
}));

// Permisos por rol: expongo a las vistas si el usuario puede hacer algo.
// Va DESPUÉS de la sesión porque necesita el rol guardado en ella.
app.use((req, res, next) => {
    const rol = req.session?.usuario?.role;
    res.locals.tienePermiso = (clave) => permisosService.tienePermiso(rol, clave);
    res.locals.permisosUsuario = rol ? permisosService.listaPermisosDe(rol) : [];
    next();
});

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
    // Errores del cliente (body muy grande, JSON mal formado): su código 4xx, mensaje genérico
    const estado = Number(err && (err.status || err.statusCode));
    if (estado >= 400 && estado < 500) {
        return res.status(estado).json({ error: 'Solicitud inválida' });
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
