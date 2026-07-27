const mysql = require('mysql2');

const dotenv = require('dotenv');
dotenv.config();

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const bd = process.env.DB_NAME;
const port = process.env.DB_PORT;

const conexion = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: bd,
    port: port
});

conexion.connect((error) => {
    if (error) {
        console.error('Error de conexión a la base de datos:', error);
        return;
    }
    console.log('Conexión a la base de datos establecida');
});