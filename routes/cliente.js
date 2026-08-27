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
router.post('/api/apartados/cancelar/:idApartado', ApartadoController.cancelarApartado);

module.exports = router;