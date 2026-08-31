// =============================================
// CONEXIÓN A LA BASE DE DATOS
// =============================================
// Acá me conecto a MySQL usando mysql2.
// Las credenciales las saco del archivo .env
// y si no hay nada ahí uso valores por defecto
// para que no explote en desarrollo.
// =============================================

const mysql = require('mysql2');
const dbConfig = require('../config/database');

// Creo la conexión con los datos del .env (centralizados en config/database)
const conexion = mysql.createConnection(dbConfig);

// Probamos la conexión al arrancar, si falla avisa en consola
conexion.connect((error) => {
    if (error) {
        console.error('Error de conexión a la base de datos:', error);
        return;
    }
    console.log('Conexión a la base de datos establecida correctamente');
});

module.exports = conexion;
