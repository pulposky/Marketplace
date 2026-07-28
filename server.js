console.clear()

const express = require('express');
const app = express();
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

global.__basedir = __dirname;

app.use(express.static('public'))

app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true })); // para <form method="post">
app.use(express.json()); // para peticiones fetch/AJAX con JSON

const PORT = process.env.PORT;

const misRutas = require('./src/router'); 
app.use('/', misRutas);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${PORT}`);
});