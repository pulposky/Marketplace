// =============================================
// ROUTER DE ÁREA ADMIN
// =============================================
// Panel de administración y todas sus APIs:
// productos, apartados/pedidos, clientes,
// notificaciones, reportes y estadísticas.
// =============================================

const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/adminController');
const ProductoController = require('../controllers/productoController');
const ApartadoController = require('../controllers/apartadoController');
const NotificacionesController = require('../controllers/notificacionesController');
const HistoricosController = require('../controllers/historicosController');
const ReportesController = require('../controllers/reportesController');
const verificarAdmin = require('../middleware/verificarAdmin');
const verificarRol = require('../middleware/verificarRol');

// -----------------------------------------------
// PÁGINAS DEL PANEL
// -----------------------------------------------
// Accesos generales (admin y aprendiz)
router.get('/admin', verificarAdmin, AdminController.mostrarMainAdmin);
router.get('/admin/habilitar-producto', verificarAdmin, AdminController.mostrarHabilitarProducto);
router.get('/admin/pedidos', verificarAdmin, AdminController.mostrarPedidos);
// Historial: pedidos confirmados, entregados y cancelados (no pendientes)
router.get('/admin/historial-pedidos', verificarAdmin, AdminController.mostrarHistorialPedidos);

// Secciones exclusivas del admin (el aprendiz no gestiona ofertas,
// clientes ni analítica)
router.get('/admin/ofertas', verificarRol('admin'), AdminController.mostrarGestionOfertas);
router.get('/admin/historicos', verificarRol('admin'), HistoricosController.mostrarHistoricos);
router.get('/admin/clientes', verificarRol('admin'), AdminController.mostrarGestionClientes);

// -----------------------------------------------
// API DE PRODUCTOS
// -----------------------------------------------
// PATCH para actualizar límite de venta y estado de un producto
router.patch('/api/admin/productos/limite-venta/:id', verificarAdmin, ProductoController.actualizarLimiteVenta);
router.patch('/api/admin/productos/estado/:id', verificarAdmin, ProductoController.actualizarEstadoManual);

// CRUD de productos: crear, editar datos y gestionar la imagen
router.post('/api/admin/productos', verificarAdmin, ProductoController.crearProducto);
router.patch('/api/admin/productos/:id/datos', verificarAdmin, ProductoController.actualizarDatosProducto);
router.post('/api/admin/productos/:id/imagen', verificarAdmin, ProductoController.subirImagenProducto);

// -----------------------------------------------
// API DE OFERTAS
// -----------------------------------------------
// GET: productos en oferta vigente (con precio original y descontado)
// PATCH: guarda el descuento y las fechas de vigencia de un producto
// Solo el admin configura ofertas.
router.get('/api/admin/ofertas', verificarRol('admin'), ProductoController.obtenerOfertasActivas);
// Nota: la ruta de precio va ANTES de la de :id para que Express la matchee primero
router.patch('/api/admin/ofertas/precio/:id', verificarRol('admin'), ProductoController.actualizarPrecioRapido);
router.patch('/api/admin/ofertas/:id', verificarRol('admin'), ProductoController.actualizarOferta);

// -----------------------------------------------
// API DE PEDIDOS / APARTADOS
// -----------------------------------------------
// GET: trae los apartados para la tabla. Acepta ?estado=
// (pendiente | confirmado | entregado | cancelado | historial =
// todos menos pendientes) o sin filtro devuelve el historial completo.
// PATCH confirmar: cambia estado a "confirmado"
// PATCH entregado: marca el pedido como entregado
// PATCH cancelar: cambia estado a "cancelado" y devuelve el stock
router.get('/api/admin/apartados', verificarAdmin, ApartadoController.obtenerApartadosAdmin);
router.patch('/api/admin/apartados/confirmar/:id', verificarAdmin, ApartadoController.confirmarApartado);
router.patch('/api/admin/apartados/entregado/:id', verificarAdmin, ApartadoController.marcarEntregado);
router.patch('/api/admin/apartados/cancelar/:id', verificarAdmin, ApartadoController.cancelarApartadoAdmin);

// -----------------------------------------------
// API DE GESTIÓN DE CLIENTES
// -----------------------------------------------
// GET: lista de clientes con sus compras; acepta ?busqueda= para filtrar
// PATCH: actualiza nombre, dirección y teléfono de un cliente
router.get('/api/admin/clientes', verificarRol('admin'), AdminController.listarClientes);
router.patch('/api/admin/clientes/:id', verificarRol('admin'), AdminController.actualizarCliente);

// -----------------------------------------------
// API DE REPORTES CSV
// -----------------------------------------------
// Descargan un archivo .csv con todos los pedidos o clientes
router.get('/api/admin/reportes/pedidos.csv', verificarRol('admin'), ReportesController.exportarPedidosCSV);
router.get('/api/admin/reportes/clientes.csv', verificarRol('admin'), ReportesController.exportarClientesCSV);

// -----------------------------------------------
// API DE NOTIFICACIONES
// -----------------------------------------------
// GET: devuelve las notificaciones no leídas + el conteo total
// PATCH marcar leída: marca una notificación específica como leída
// PATCH marcar todas leídas: marca todas las no leídas como leídas
router.get('/api/admin/notificaciones', verificarAdmin, NotificacionesController.obtenerNotificaciones);
router.patch('/api/admin/notificaciones/:id/leida', verificarAdmin, NotificacionesController.marcarLeida);
router.patch('/api/admin/notificaciones/todas-leidas', verificarAdmin, NotificacionesController.marcarTodasLeidas);

// -----------------------------------------------
// API DE HISTÓRICOS / ESTADÍSTICAS
// -----------------------------------------------
// Solo el admin ve analítica y reportes.
router.get('/api/admin/historicos/productos', verificarRol('admin'), HistoricosController.apiProductosMasVendidos);
router.get('/api/admin/historicos/clientes', verificarRol('admin'), HistoricosController.apiClientesQueMasCompran);
router.get('/api/admin/historicos/estados', verificarRol('admin'), HistoricosController.apiPedidosPorEstado);
router.get('/api/admin/historicos/ventas-dia', verificarRol('admin'), HistoricosController.apiVentasPorDia);
router.get('/api/admin/historicos/visitas-dia', verificarRol('admin'), HistoricosController.apiVisitasPorDia);
router.get('/api/admin/historicos/rutas', verificarRol('admin'), HistoricosController.apiVisitasPorRuta);
router.get('/api/admin/historicos/exportar', verificarRol('admin'), HistoricosController.exportarHistoricos);

module.exports = router;