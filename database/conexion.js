const mysql = require('mysql2');

// Configuración de conexión a MySQL usando mysql2
const conexion = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.BD_DATABASE,
    port: process.env.DB_PORT || 3306
});

conexion.connect((error) => {
    if (error) {
        console.error('Error de conexión a la base de datos:', error);
        return;
    }
    console.log('Conexión a la base de datos establecida correctamente');
});

module.exports = conexion;