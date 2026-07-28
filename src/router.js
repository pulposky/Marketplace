const express = require('express');
const router = express.Router();

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');
const UsuarioController = require('../controllers/usuarioController');

// Vista Login
router.get('/', ViewController.mostrarLogin);

// Catálogo
router.get('/productos', ViewController.mostrarCatalogo);
router.post('/login', UsuarioController.loginUsuarioController);
// API
router.get('/api/productos', ProductoController.obtenerTodos);

module.exports = router;