// =============================================
// ROUTER DE ÁREA DEL CLIENTE
// =============================================
// Páginas y APIs de un cliente logueado: su
// perfil, sus apartados y crear/cancelar reservas.
// =============================================

const express = require('express');
const router = express.Router();

const ClienteController = require('../controllers/clienteController');
const ApartadoController = require('../controllers/apartadoController');
const NotificacionesClienteController = require('../controllers/notificacionesClienteController');
const protegerRuta = require('../middleware/verificarUsuario');

// Vista "Mi perfil" y su API de edición (solo clientes logueados)
router.get('/perfil', protegerRuta, ClienteController.mostrarPerfil);
router.patch('/api/perfil', protegerRuta, ClienteController.actualizarPerfil);

// Vista "Mis apartados".
// Solo la ve un usuario logueado; si no, vuelve al
// catálogo con el modal de login abierto (?login=1)
router.get('/verApartados', (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/catalogo?login=1');
    }
    next();
}, ClienteController.mostrarVerApartados);

// API: crear un apartado nuevo (descuenta stock y avisa al admin)
router.post('/api/apartar-producto', protegerRuta, ApartadoController.apartarProducto);

// API: cancelar un apartado propio (el cliente cancela desde su vista)
router.post('/api/apartados/cancelar/:idApartado', protegerRuta, ApartadoController.cancelarApartado);

// API: apartar varios productos de una vez (carrito del cliente)
router.post('/api/apartar-lote', protegerRuta, ApartadoController.apartarLote);

// --------------------------------------------------
// API DE NOTIFICACIONES DEL CLIENTE
// --------------------------------------------------
// GET: notificaciones no leídas del cliente + conteo
// PATCH: marcar una notificación como leída
// PATCH: marcar todas como leídas
router.get('/api/mis-notificaciones', protegerRuta, NotificacionesClienteController.obtenerMisNotificaciones);
router.patch('/api/mis-notificaciones/:id/leida', protegerRuta, NotificacionesClienteController.marcarLeida);
router.patch('/api/mis-notificaciones/todas-leidas', protegerRuta, NotificacionesClienteController.marcarTodasLeidas);

module.exports = router;