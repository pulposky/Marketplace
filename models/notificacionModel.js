// =============================================
// MODELO DE NOTIFICACIONES
// =============================================
// Consultas SQL de la tabla 'notificaciones':
// alertas para el admin cuando llega un apartado.
// =============================================

const conexion = require('../database/conexion');

const NotificacionModel = {

    // Crea una notificación nueva (se llama cuando alguien aparta un producto)
    crearNotificacion: (datos, callback) => {
        const sql = 'INSERT INTO notificaciones (titulo, mensaje) VALUES (?, ?)';
        conexion.query(sql, [datos.titulo, datos.mensaje], callback);
    },

    // Trae las notificaciones que no se han leído (máximo 20, las más recientes primero)
    obtenerNotificacionesNoLeidas: (callback) => {
        const sql = 'SELECT * FROM notificaciones WHERE leido = 0 ORDER BY fecha DESC LIMIT 20';
        conexion.query(sql, callback);
    },

    // Cuenta cuántas notificaciones hay sin leer (para el badge de la campana)
    contarNoLeidas: (callback) => {
        const sql = 'SELECT COUNT(*) AS total FROM notificaciones WHERE leido = 0';
        conexion.query(sql, callback);
    },

    // Marca una notificación individual como leída
    marcarComoLeida: (id, callback) => {
        const sql = 'UPDATE notificaciones SET leido = 1 WHERE id = ?';
        conexion.query(sql, [id], callback);
    },

    // Marca todas las notificaciones no leídas como leídas de una vez
    marcarTodasLeidas: (callback) => {
        const sql = 'UPDATE notificaciones SET leido = 1 WHERE leido = 0';
        conexion.query(sql, callback);
    }
};

module.exports = NotificacionModel;