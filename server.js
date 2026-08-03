// Archivo principal del servidor Express
// Configura middleware, sesiones, rutas y arranca la aplicación
// para SENAEMPRESA Marketplace.
console.clear()

const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config(); // Carga variables de entorno desde .env

global.__basedir = __dirname; // Ruta base global para el proyecto

// Archivos estáticos públicos como CSS, JS e imágenes
app.use(express.static('public'))

// Configura EJS como motor de plantillas y la carpeta de vistas
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');

// Parseo de datos enviados por formularios HTML y JSON en peticiones fetch
app.use(express.urlencoded({ extended: true })); // para <form method="post">
app.use(express.json()); // para peticiones fetch/AJAX con JSON

const PORT = process.env.PORT;

const session = require("express-session");
app.use(session({
    secret: "mi_clave_secreta",
    resave: false,
    saveUninitialized: false,
}));

// Carga las rutas principales de la aplicación
const misRutas = require('./src/router'); 
app.use('/', misRutas);

// Inicia el servidor en el puerto configurado
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});