// =============================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// =============================================
// Devuelve las opciones de conexión a MySQL desde
// el .env con valores por defecto. Se usa en
// database/conexion.js para crear la conexión.
// =============================================

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.BD_DATABASE,
    port: Number(process.env.DB_PORT) || 3306,
    // Timeout de espera de conexión (no quedarse colgado)
    connectTimeout: 10000
};
