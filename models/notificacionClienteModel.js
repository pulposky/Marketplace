// =============================================
// MODELO DE NOTIFICACIONES DEL CLIENTE
// =============================================
// Consultas SQL de la tabla 'notificaciones_cliente':
// alertas que ve cada cliente sobre el estado de
// sus apartados (creado, confirmado, entregado,
// cancelado o expirado).
// =============================================

const conexion = require('../database/conexion');

const NotificacionClienteModel = {

    // Busca el id_cliente a partir del nombre guardado en un apartado
    // (la tabla apartados guarda el nombre como texto, no el id).
    buscarClientePorNombre: (nombre, callback) => {
        const sql = 'SELECT id_cliente FROM clientes WHERE nombre = ? ORDER BY id_cliente ASC LIMIT 1';
        conexion.query(sql, [nombre], callback);
    },

    // Crea una notificación para un cliente específico
    crear: (idCliente, titulo, mensaje, callback) => {
        const sql = 'INSERT INTO notificaciones_cliente (id_cliente, titulo, mensaje) VALUES (?, ?, ?)';
        conexion.query(sql, [idCliente, titulo, mensaje], callback);
    },

    // Trae las notificaciones no leídas de un cliente (máximo 30, recientes primero)
    obtenerNoLeidas: (idCliente, callback) => {
        const sql = `
            SELECT * FROM notificaciones_cliente
            WHERE id_cliente = ?
            ORDER BY fecha DESC, id DESC
            LIMIT 30
        `;
        conexion.query(sql, [idCliente], callback);
    },

    // Cuenta cuántas notificaciones sin leer tiene un cliente
    contarNoLeidas: (idCliente, callback) => {
        const sql = 'SELECT COUNT(*) AS total FROM notificaciones_cliente WHERE id_cliente = ? AND leido = 0';
        conexion.query(sql, [idCliente], callback);
    },

    // Marca una notificación como leída (solo si pertenece al cliente)
    marcarLeida: (idNotificacion, idCliente, callback) => {
        const sql = 'UPDATE notificaciones_cliente SET leido = 1 WHERE id = ? AND id_cliente = ?';
        conexion.query(sql, [idNotificacion, idCliente], callback);
    },

    // Marca todas las no leídas de un cliente como leídas
    marcarTodasLeidas: (idCliente, callback) => {
        const sql = 'UPDATE notificaciones_cliente SET leido = 1 WHERE id_cliente = ? AND leido = 0';
        conexion.query(sql, [idCliente], callback);
    }
};

module.exports = NotificacionClienteModel;