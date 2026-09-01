// =============================================
// ROUTER DE ÁREA PÚBLICA
// =============================================
// Páginas y APIs que cualquier visitante puede
// usar sin sesión: inicio, catálogo, imágenes del
// carrusel, lista de productos y verificar sesión.
// =============================================

const express = require('express');
const router = express.Router();

const SitioController = require('../controllers/sitioController');
const ProductoController = require('../controllers/productoController');
const AuthController = require('../controllers/authController');
const { limiteAuth } = require('../config/rateLimit');
const { validarLogin, validarRegistro } = require('../middleware/validar');

// Vista: página principal
router.get('/', SitioController.mostrarMain);

// Vista: catálogo de productos
router.get('/catalogo', SitioController.mostrarCatalogo);

// Vista: ficha de detalle de un producto
router.get('/producto/:id', SitioController.mostrarDetalleProducto);

// Autenticación: login, logout y registro de nuevos clientes
// límite estricto para frenar fuerza bruta + validación de inputs
router.post('/login', limiteAuth, validarLogin, AuthController.loginUsuarioController);
router.get('/logout', AuthController.logoutUsuarioController);
router.post('/registro', limiteAuth, validarRegistro, AuthController.registroUsuarioController);

// API: lista de productos en JSON (la usa el catálogo)
router.get('/api/productos', ProductoController.obtenerTodos);

// API: imágenes del carrusel (lee la carpeta img/carrusel dinámicamente)
router.get('/api/carrusel-imagenes', SitioController.carruselImagenes);

// API: verificar si hay sesión activa (lo usa el frontend antes de apartar)
router.get('/api/verificar-sesion', AuthController.verificarSesion);

// API: restablecer contraseña de un cliente existente
router.post('/api/restablecer-password', limiteAuth, AuthController.restablecerPassword);

module.exports = router;