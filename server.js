// =============================================
// SERVIDOR PRINCIPAL - MARKETPLACE SENA
// =============================================
// Este es el archivo que arranca todo el servidor.
// Acá cargo las variables de entorno, configuro
// Express con sus middlewares, las sesiones y
//最后 levanto el servidor en el puerto que diga el .env
// =============================================
console.clear();

const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');

// Cargo las variables del .env (DB_HOST, PORT, etc.)
dotenv.config();

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
app.use(session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // En local con http funciona bien, en producción con https hay que poner true
        maxAge: 1000 * 60 * 60 * 2 // La sesión dura 2 horas y después se vence
    }
}));

// Registro de visitas para las estadísticas
const contarVisita = require('./middleware/contadorVisitas');
app.use(contarVisita);

// Cargo todas las rutas del proyecto
const misRutas = require('./src/router');
app.use('/', misRutas);

const PORT = process.env.PORT || 3000;

// Arranco el servidor, si no hay puerto en .env uso el 3000
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});
