/* ============================================= */
/* DATABASE.JS - CONFIGURACIÓN DE BASE DE DATOS  */
/* ============================================= */
/* Opciones de conexión a MySQL desde el .env.    */
/* Se usa en database/conexion.js.                */
/*                                                */
/* Variables: DB_HOST, DB_PORT, DB_USER,          */
/* DB_PASSWORD y DB_DATABASE. Los nombres viejos  */
/* BD_* se aceptan como alias (obsoletos).        */
/* ============================================= */

// DB_* manda; BD_* queda como alias para .env antiguos.
const variableBD = (nombre) => process.env[`DB_${nombre}`] ?? process.env[`BD_${nombre}`];

module.exports = {
    // Sin valores por defecto: server.js exige estas variables al arrancar
    host: variableBD('HOST'),
    user: variableBD('USER'),
    password: variableBD('PASSWORD'),
    database: variableBD('DATABASE'),
    port: Number(variableBD('PORT')) || 3306,
    // Timeout de espera de conexión (no quedarse colgado)
    connectTimeout: 5000
};

module.exports.variableBD = variableBD;
