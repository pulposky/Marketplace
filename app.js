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

const app = express();

// Guardo la ruta raíz del proyecto por si la necesito en otro lado
global.__basedir = __dirname;

// Los archivos estáticos (CSS, JS, imágenes) van directos desde /public
app.use(express.static('public'));

// Configuro EJS como motor de plantillas, las vistas están en public/views
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');

// Esto me permite leer formularios HTML y también JSON que mande el frontend con fetch
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// La sesión va ANTES de las rutas, sino no funciona
app.use(session(require('./config/session')));

// Registro de visitas para las estadísticas
app.use(require('./middleware/contadorVisitas'));

// Cargo todas las rutas del proyecto
app.use('/', require('./routes'));

module.exports = app;