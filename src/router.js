// =============================================
// ROUTER - DEFINICIÓN DE RUTAS
// =============================================
// Acá están todas las rutas del proyecto, tanto
// las de vistas (GET) como las de API (POST, PATCH).
// Cada ruta apunta a su controller correspondiente.
// Las rutas que empiezan con /api son endpoints
// que devuelve JSON, las demás renderizan páginas.
// =============================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');
const ProductoModel = require('../model/productoModel');
const UsuarioController = require('../controllers/usuarioController');
const HistoricosController = require('../controllers/historicosController');
const protegerRuta = require('../middleware/verificarUsuario');

// -----------------------------------------------
// RUTAS DE AUTENTICACIÓN
// -----------------------------------------------
// Login: recibe los datos del formulario y crea la sesión
// Logout: destruye la sesión y limpia la cookie
router.post('/login', UsuarioController.loginUsuarioController);
router.get('/logout', UsuarioController.logoutUsuarioController);
router.post('/registro', UsuarioController.registroUsuarioController);

// -----------------------------------------------
// RUTAS DE VISTAS PÚBLICAS Y PRIVADAS
// -----------------------------------------------
// La página principal ("/") y el catálogo ("/catalogo") son públicos
// verApartados solo lo puede ver un usuario logueado
router.get('/', ViewController.mostrarMain);
router.get('/catalogo', ViewController.mostrarCatalogo);
router.get('/verApartados', protegerRuta, ViewController.mostrarVerApartados);

// -----------------------------------------------
// RUTAS DEL PANEL ADMIN
// -----------------------------------------------
// Solo admin y aprendiz pueden acceder (el controller ya valida el rol)
router.get('/admin', protegerRuta, ViewController.mostrarMainAdmin);
router.get('/admin/habilitar-producto', protegerRuta, ViewController.mostrarHabilitarProducto);
router.get('/admin/pedidos', protegerRuta, ViewController.mostrarPedidos);
router.get('/admin/historicos', protegerRuta, HistoricosController.mostrarHistoricos);

// -----------------------------------------------
// API DE PRODUCTOS (admin)
// -----------------------------------------------
// PATCH para actualizar límite de venta y estado de un producto
router.patch('/api/admin/productos/limite-venta/:id', protegerRuta, ProductoController.actualizarLimiteVenta);
router.patch('/api/admin/productos/estado/:id', protegerRuta, ProductoController.actualizarEstadoManual);

// -----------------------------------------------
// API DE PEDIDOS/APARTADOS (admin)
// -----------------------------------------------
// GET: trae todos los apartados pendientes para mostrar en la tabla
// PATCH confirmar: cambia estado a "confirmado"
// PATCH cancelar: cambia estado a "cancelado" y devuelve el stock
router.get('/api/admin/apartados', protegerRuta, (req, res) => {
    ProductoModel.obtenerTodosApartados((error, apartados) => {
        if (error) {
            return res.status(500).json({ error: 'Error al consultar apartados.' });
        }
        res.json(Array.isArray(apartados) ? apartados : []);
    });
});
router.patch('/api/admin/apartados/confirmar/:id', protegerRuta, ProductoController.confirmarApartado);
router.patch('/api/admin/apartados/cancelar/:id', protegerRuta, ProductoController.cancelarApartadoAdmin);

// -----------------------------------------------
// API PARA EL CLIENTE
// -----------------------------------------------
// POST: cancelar un apartado propio (el cliente cancela desde su vista)
router.post('/api/apartados/cancelar/:idApartado', ProductoController.cancelarApartado);

// -----------------------------------------------
// API DE NOTIFICACIONES (admin)
// -----------------------------------------------
// GET: devuelve las notificaciones no leídas + el conteo total
// PATCH marcar leída: marca una notificación específica como leída
// PATCH marcar todas leídas: marca todas las no leídas como leídas
router.get('/api/admin/notificaciones', protegerRuta, (req, res) => {
    ProductoModel.contarNoLeidas((err, resultado) => {
        const total = (err || !resultado || !resultado[0]) ? 0 : resultado[0].total;
        ProductoModel.obtenerNotificacionesNoLeidas((err2, notificaciones) => {
            if (err2) {
                return res.status(500).json({ error: 'Error al consultar notificaciones.' });
            }
            res.json({ total, notificaciones: Array.isArray(notificaciones) ? notificaciones : [] });
        });
    });
});

router.patch('/api/admin/notificaciones/:id/leida', protegerRuta, (req, res) => {
    ProductoModel.marcarComoLeida(req.params.id, (error) => {
        if (error) {
            return res.status(500).json({ error: 'Error al marcar notificación.' });
        }
        res.json({ ok: true });
    });
});

router.patch('/api/admin/notificaciones/todas-leidas', protegerRuta, (req, res) => {
    ProductoModel.marcarTodasLeidas((error) => {
        if (error) {
            return res.status(500).json({ error: 'Error al marcar notificaciones.' });
        }
        res.json({ ok: true });
    });
});

// -----------------------------------------------
// API AUXILIARES
// -----------------------------------------------
// Verificar si hay sesión activa (lo usa el frontend antes de apartar)
router.get('/api/verificar-sesion', (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json({ login: true });
    }
    res.json({ login: false });
});

// API pública: imágenes del carrusel (lee la carpeta img/carrusel dinámicamente)
router.get('/api/carrusel-imagenes', (req, res) => {
    const carpetaCarrusel = path.join(__dirname, '..', 'public', 'img', 'carrusel');
    const extensionesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    fs.readdir(carpetaCarrusel, (error, archivos) => {
        if (error) {
            return res.json([]);
        }
        const imagenes = archivos
            .filter(archivo => extensionesValidas.includes(path.extname(archivo).toLowerCase()))
            .sort();
        res.json(imagenes);
    });
});

// API pública: lista de productos en JSON (la usa el catálogo)
router.get('/api/productos', ProductoController.obtenerTodos);

// API protegida: crear un apartado nuevo
router.post('/api/apartar-producto', protegerRuta, ProductoController.apartarProducto);

// -----------------------------------------------
// API DE HISTÓRICOS / ESTADÍSTICAS (admin)
// -----------------------------------------------
router.get('/api/admin/historicos/productos', protegerRuta, HistoricosController.apiProductosMasVendidos);
router.get('/api/admin/historicos/clientes', protegerRuta, HistoricosController.apiClientesQueMasCompran);
router.get('/api/admin/historicos/estados', protegerRuta, HistoricosController.apiPedidosPorEstado);
router.get('/api/admin/historicos/ventas-dia', protegerRuta, HistoricosController.apiVentasPorDia);
router.get('/api/admin/historicos/visitas-dia', protegerRuta, HistoricosController.apiVisitasPorDia);
router.get('/api/admin/historicos/rutas', protegerRuta, HistoricosController.apiVisitasPorRuta);

module.exports = router;
