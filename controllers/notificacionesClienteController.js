// =============================================
// CONTROLADOR DE NOTIFICACIONES DEL CLIENTE
// =============================================
// Endpoints que usa un cliente logueado para ver
// sus alertas y marcarlas como leídas. El resto
// del flujo (crear notificaciones al confirmar,
// entregar, cancelar o expirar apartados) se hace
// directamente en apartadoController y en el
// servicio de expiración.
// =============================================

const NotificacionClienteModel = require('../models/notificacionClienteModel');

const NotificacionesClienteController = {

    // GET /api/mis-notificaciones
    // Devuelve el total sin leer + las notificaciones del cliente
    obtenerMisNotificaciones: (req, res) => {
        const idCliente = req.session.usuario.id;

        NotificacionClienteModel.contarNoLeidas(idCliente, (err, resultado) => {
            const total = (err || !resultado || !resultado[0]) ? 0 : resultado[0].total;

            NotificacionClienteModel.obtenerNoLeidas(idCliente, (errLista, notificaciones) => {
                if (errLista) {
                    return res.status(500).json({ error: 'Error al consultar tus notificaciones.' });
                }
                res.json({ total, notificaciones: Array.isArray(notificaciones) ? notificaciones : [] });
            });
        });
    },

    // PATCH /api/mis-notificaciones/:id/leida
    // Marca una notificación propia como leída
    marcarLeida: (req, res) => {
        const idNotificacion = req.params.id;
        const idCliente = req.session.usuario.id;

        if (!idNotificacion) {
            return res.status(400).json({ error: 'Falta el ID de la notificación.' });
        }

        NotificacionClienteModel.marcarLeida(idNotificacion, idCliente, (error) => {
            if (error) {
                return res.status(500).json({ error: 'Error al marcar la notificación.' });
            }
            res.json({ ok: true });
        });
    },

    // PATCH /api/mis-notificaciones/todas-leidas
    // Marca todas las propias como leídas
    marcarTodasLeidas: (req, res) => {
        NotificacionClienteModel.marcarTodasLeidas(req.session.usuario.id, (error) => {
            if (error) {
                return res.status(500).json({ error: 'Error al marcar las notificaciones.' });
            }
            res.json({ ok: true });
        });
    }
};

module.exports = NotificacionesClienteController;