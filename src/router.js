// Rutas de la aplicación: vistas principales, APIs y protección de endpoints.
const express = require('express');
const router = express.Router();

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');
const UsuarioController = require('../controllers/usuarioController');
const protegerRuta = require('../middleware/verificarUsuario');

// Rutas de autenticación de usuario
router.post('/login', UsuarioController.loginUsuarioController);
router.get('/logout', UsuarioController.logoutUsuarioController);

// Rutas de vistas públicas y privadas
router.get('/', ViewController.mostrarMain);
router.get('/catalogo', ViewController.mostrarCatalogo);

// Ruta para verificar si el usuario está autenticado desde el frontend
router.get('/api/verificar-sesion', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json({ login: true });
    }
    res.json({ login: false });
});

// API para obtener productos en JSON
router.get('/api/productos', ProductoController.obtenerTodos);

// API protegida para apartar productos, requiere sesión activa
router.post('/api/apartar-producto', protegerRuta, ProductoController.apartarProducto);

module.exports = router;