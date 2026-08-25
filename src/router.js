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
const UsuarioModel = require('../model/usuariosModel');
const HistoricosController = require('../controllers/historicosController');
const ReportesController = require('../controllers/reportesController');
const protegerRuta = require('../middleware/verificarUsuario');
const verificarAdmin = require('../middleware/verificarAdmin');

// -----------------------------------------------
// RUTAS DE AUTENTICACIÓN
// -----------------------------------------------
// Login: recibe los datos del formulario y crea la sesión
// Logout: destruye la sesión y limpia la cookie
router.post('/login', UsuarioController.loginUsuarioController);
router.get('/logout', UsuarioController.logoutUsuarioController);
router.post('/registro', UsuarioController.registroUsuarioController);

// -----------------------------------------------
// RUTAS DE PERFIL DEL CLIENTE
// -----------------------------------------------
// Vista "Mi perfil" (solo clientes logueados)
// PATCH: guarda los cambios de nombre, dirección y teléfono
router.get('/perfil', protegerRuta, ViewController.mostrarPerfil);
router.patch('/api/perfil', protegerRuta, UsuarioController.actualizarPerfilController);

// -----------------------------------------------
// RUTAS DE VISTAS PÚBLICAS Y PRIVADAS
// -----------------------------------------------
// La página principal ("/") y el catálogo ("/catalogo") son públicos
// verApartados solo lo puede ver un usuario logueado; si no,
// lo regreso al catálogo con el modal de login abierto (?login=1)
router.get('/', ViewController.mostrarMain);
router.get('/catalogo', ViewController.mostrarCatalogo);
router.get('/verApartados', (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        return res.redirect('/catalogo?login=1');
    }
    next();
}, ViewController.mostrarVerApartados);

// -----------------------------------------------
// RUTAS DEL PANEL ADMIN
// -----------------------------------------------
// Solo admin y aprendiz pueden acceder (el controller ya valida el rol)
router.get('/admin', protegerRuta, ViewController.mostrarMainAdmin);
router.get('/admin/habilitar-producto', protegerRuta, ViewController.mostrarHabilitarProducto);
router.get('/admin/pedidos', protegerRuta, ViewController.mostrarPedidos);
// Historial: pedidos confirmados, entregados y cancelados (no pendientes)
router.get('/admin/historial-pedidos', protegerRuta, ViewController.mostrarHistorialPedidos);
router.get('/admin/historicos', protegerRuta, HistoricosController.mostrarHistoricos);
router.get('/admin/clientes', verificarAdmin, ViewController.mostrarGestionClientes);

// -----------------------------------------------
// API DE PRODUCTOS (admin)
// -----------------------------------------------
// PATCH para actualizar límite de venta y estado de un producto
router.patch('/api/admin/productos/limite-venta/:id', protegerRuta, ProductoController.actualizarLimiteVenta);
router.patch('/api/admin/productos/estado/:id', protegerRuta, ProductoController.actualizarEstadoManual);

// -----------------------------------------------
// API DE PEDIDOS/APARTADOS (admin)
// -----------------------------------------------
// GET: trae los apartados para la tabla. Acepta ?estado=
// (pendiente | confirmado | entregado | cancelado | historial =
// todos menos pendientes) o sin filtro devuelve el historial completo.
// PATCH confirmar: cambia estado a "confirmado"
// PATCH entregado: marca el pedido como entregado
// PATCH cancelar: cambia estado a "cancelado" y devuelve el stock
router.get('/api/admin/apartados', protegerRuta, (req, res) => {
    const estado = String(req.query.estado || 'todos').trim();

    ProductoModel.obtenerTodosApartados(estado, (error, apartados) => {
        if (error) {
            return res.status(500).json({ error: 'Error al consultar apartados.' });
        }
        res.json(Array.isArray(apartados) ? apartados : []);
    });
});
router.patch('/api/admin/apartados/confirmar/:id', protegerRuta, ProductoController.confirmarApartado);
router.patch('/api/admin/apartados/entregado/:id', verificarAdmin, ProductoController.marcarEntregado);
router.patch('/api/admin/apartados/cancelar/:id', protegerRuta, ProductoController.cancelarApartadoAdmin);

// -----------------------------------------------
// API DE GESTIÓN DE CLIENTES (admin)
// -----------------------------------------------
// GET: lista de clientes con sus compras; acepta ?busqueda= para filtrar
// PATCH: actualiza nombre, dirección y teléfono de un cliente
router.get('/api/admin/clientes', verificarAdmin, (req, res) => {
    const busqueda = String(req.query.busqueda || '');

    UsuarioModel.obtenerClientesAdmin(busqueda, (error, clientes) => {
        if (error) {
            console.error('Error al consultar clientes:', error);
            return res.status(500).json({ error: 'Error al consultar clientes.' });
        }
        res.json(Array.isArray(clientes) ? clientes : []);
    });
});

router.patch('/api/admin/clientes/:id', verificarAdmin, UsuarioController.actualizarClienteAdminController);

// -----------------------------------------------
// API DE REPORTES CSV (admin)
// -----------------------------------------------
// Descargan un archivo .csv con todos los pedidos o clientes
router.get('/api/admin/reportes/pedidos.csv', verificarAdmin, ReportesController.exportarPedidosCSV);
router.get('/api/admin/reportes/clientes.csv', verificarAdmin, ReportesController.exportarClientesCSV);

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
router.get('/api/admin/historicos/exportar', protegerRuta, HistoricosController.exportarHistoricos);

module.exports = router;
