// =============================================
// CONFIGURACIÓN DE LA BASE DE DATOS
// =============================================
// Devuelve las opciones de conexión a MySQL desde
// el .env con valores por defecto. Se usa en
// database/conexion.js para crear la conexión.
//
// Nota de convención: el .env usa la convención BD_*
// (BD_HOST, BD_USER...). Por compatibilidad también
// se aceptan las variables DB_* si existieran.
// =============================================

module.exports = {
    host: process.env.BD_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.BD_USER || process.env.DB_USER || 'root',
    password: process.env.BD_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.BD_DATABASE || process.env.DB_DATABASE,
    port: Number(process.env.BD_PORT || process.env.DB_PORT) || 3306,
    // Timeout de espera de conexión (no quedarse colgado)
    connectTimeout: 10000
};
