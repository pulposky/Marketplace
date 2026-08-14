const express = require('express');
const router = express.Router();

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');
const UsuarioController = require('../controllers/usuarioController');
const protegerRuta = require('../middleware/verificarUsuario');

// Rutas de autenticación de usuario.
router.post('/login', UsuarioController.loginUsuarioController);
router.get('/logout', UsuarioController.logoutUsuarioController);

// Rutas de vistas públicas y privadas del marketplace.
router.get('/', ViewController.mostrarMain);
router.get('/catalogo', ViewController.mostrarCatalogo);
router.get('/verApartados', protegerRuta, ViewController.mostrarVerApartados);

// Ruta para panel de administración
router.get('/admin', protegerRuta, ViewController.mostrarMainAdmin);
router.get('/admin/habilitar-producto', protegerRuta, ViewController.mostrarHabilitarProducto);

// API para la gestión de productos desde el panel admin
router.patch('/api/admin/productos/limite-venta/:id', protegerRuta, ProductoController.actualizarLimiteVenta);
router.patch('/api/admin/productos/estado/:id', protegerRuta, ProductoController.actualizarEstadoManual);
// Ruta para cancelar apartado vía POST
router.post('/api/apartados/cancelar/:idApartado', ProductoController.cancelarApartado);

// Endpoint para verificar si el usuario tiene una sesión activa.
router.get('/api/verificar-sesion', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json({ login: true });
    }
    res.json({ login: false });
});

// API pública para consultar productos en formato JSON.
router.get('/api/productos', ProductoController.obtenerTodos);

// API protegida para crear apartados; solo funciona si hay sesión activa.
router.post('/api/apartar-producto', protegerRuta, ProductoController.apartarProducto);

module.exports = router;