const express = require('express');
const router = express.Router();
const PaginasController = require('../controllers/productosController');

router.get('/', PaginasController.mostrarHome);

router.get('/productos', PaginasController.mostrarProductos);

module.exports = router;