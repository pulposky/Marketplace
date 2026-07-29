const express = require('express');
const router = express.Router();

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');
const UsuarioController = require('../controllers/usuarioController');

// Vista Login
router.get('/login', ViewController.mostrarLogin);
router.post('/login', UsuarioController.loginUsuarioController);

// Catálogo
router.get('/', ViewController.mostrarCatalogo);
router.get('/api/productos', ProductoController.obtenerTodos);

module.exports = router;