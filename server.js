// Archivo principal del servidor Express.
// Aquí se inicializa la app, se cargan los middlewares y se levanta el servicio.
console.clear();

const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session'); // <-- Importamos la sesión arriba

dotenv.config(); // Carga las variables de entorno desde el archivo .env.

global.__basedir = __dirname; // Guarda la ruta base del proyecto para uso general.

// Sirve los archivos estáticos del frontend: CSS, JS, imágenes y otros recursos públicos.
app.use(express.static('public'));

// Configura EJS como motor de plantillas y apunta a la carpeta de vistas.
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');

// Permite leer datos enviados desde formularios HTML y desde peticiones JSON del frontend.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Habilita el manejo de sesiones del usuario ANTES de registrar las rutas
app.use(session({
    secret: 'mi_clave_secreta',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Asegura que funcione bien en entorno local http://
        maxAge: 1000 * 60 * 60 * 2 // 2 horas de duración
    }
}));

// Carga las rutas principales definidas en el router del proyecto (AHORA SÍ CON ACCESO A LA SESIÓN)
const misRutas = require('./src/router');
app.use('/', misRutas);

const PORT = process.env.PORT || 3000;

// Levanta el servidor y deja la app disponible en el puerto configurado.
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});