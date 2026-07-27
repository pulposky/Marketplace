const express = require('express');
const router = express.Router();

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');

// ------------------------------------
// 1. RUTAS DE VISTAS (Navegación HTML)
// ------------------------------------
router.get('/', ViewController.mostrarHome);
router.get('/productos', ViewController.mostrarCatalogo);

// ------------------------------------
// 2. RUTAS DE PETICIONES (API / Datos)
// ------------------------------------
router.get('/api/productos', ProductoController.obtenerTodos);

module.exports = router;