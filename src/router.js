// Definición de las rutas principales de la aplicación.
// Aquí se organizan las vistas, los endpoints de login y los servicios del catálogo.
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
// Ruta para panel de administración
router.get('/admin', protegerRuta, ViewController.mostrarHabilitacionProductos);

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