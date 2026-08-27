// =============================================
// CONTROLADOR DE NOTIFICACIONES
// =============================================
// Endpoints que usa el panel admin para la
// campana de notificaciones de nuevos apartados.
// =============================================

const NotificacionModel = require('../models/notificacionModel');

const NotificacionesController = {

    // GET /api/admin/notificaciones
    // Devuelve el total sin leer + las notificaciones pendientes
    obtenerNotificaciones: (req, res) => {
        NotificacionModel.contarNoLeidas((err, resultado) => {
            const total = (err || !resultado || !resultado[0]) ? 0 : resultado[0].total;
            NotificacionModel.obtenerNotificacionesNoLeidas((err2, notificaciones) => {
                if (err2) {
                    return res.status(500).json({ error: 'Error al consultar notificaciones.' });
                }
                res.json({ total, notificaciones: Array.isArray(notificaciones) ? notificaciones : [] });
            });
        });
    },

    // PATCH /api/admin/notificaciones/:id/leida
    // Marca una notificación específica como leída
    marcarLeida: (req, res) => {
        NotificacionModel.marcarComoLeida(req.params.id, (error) => {
            if (error) {
                return res.status(500).json({ error: 'Error al marcar notificación.' });
            }
            res.json({ ok: true });
        });
    },

    // PATCH /api/admin/notificaciones/todas-leidas
    // Marca todas las no leídas como leídas
    marcarTodasLeidas: (req, res) => {
        NotificacionModel.marcarTodasLeidas((error) => {
            if (error) {
                return res.status(500).json({ error: 'Error al marcar notificaciones.' });
            }
            res.json({ ok: true });
        });
    }
};

module.exports = NotificacionesController;