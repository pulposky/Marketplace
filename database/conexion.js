/* ============================================= */
/* CONEXION.JS - CONEXIÓN A LA BASE DE DATOS     */
/* ============================================= */
/* Acá me conecto a MySQL usando mysql2. Las      */
/* credenciales las saco del archivo .env y si no  */
/* hay nada ahí uso valores por defecto para que  */
/* no explote en desarrollo.                     */
/* ============================================= */

const mysql = require('mysql2');
const dbConfig = require('../config/database');

// Creo el pool de conexiones con los datos del .env (centralizados en config/database)
const conexion = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probamos la conexión al arrancar pidiendo una conexión al pool
conexion.getConnection((error, conn) => {
    if (error) {
        console.error('Error de conexión a la base de datos:', error);
        return;
    }
    conn.release();
    console.log('Conexión al pool de base de datos establecida correctamente');
});

module.exports = conexion;
