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
const protegerRuta = require('../middleware/verificarUsuario');
const verificarAdmin = require('../middleware/verificarAdmin');

// -----------------------------------------------
// PÁGINAS DEL PANEL
// -----------------------------------------------
router.get('/admin', protegerRuta, AdminController.mostrarMainAdmin);
router.get('/admin/habilitar-producto', protegerRuta, AdminController.mostrarHabilitarProducto);
router.get('/admin/pedidos', protegerRuta, AdminController.mostrarPedidos);
// Historial: pedidos confirmados, entregados y cancelados (no pendientes)
router.get('/admin/historial-pedidos', protegerRuta, AdminController.mostrarHistorialPedidos);
router.get('/admin/historicos', protegerRuta, HistoricosController.mostrarHistoricos);
router.get('/admin/clientes', verificarAdmin, AdminController.mostrarGestionClientes);

// -----------------------------------------------
// API DE PRODUCTOS
// -----------------------------------------------
// PATCH para actualizar límite de venta y estado de un producto
router.patch('/api/admin/productos/limite-venta/:id', protegerRuta, ProductoController.actualizarLimiteVenta);
router.patch('/api/admin/productos/estado/:id', protegerRuta, ProductoController.actualizarEstadoManual);

// -----------------------------------------------
// API DE PEDIDOS / APARTADOS
// -----------------------------------------------
// GET: trae los apartados para la tabla. Acepta ?estado=
// (pendiente | confirmado | entregado | cancelado | historial =
// todos menos pendientes) o sin filtro devuelve el historial completo.
// PATCH confirmar: cambia estado a "confirmado"
// PATCH entregado: marca el pedido como entregado
// PATCH cancelar: cambia estado a "cancelado" y devuelve el stock
router.get('/api/admin/apartados', protegerRuta, ApartadoController.obtenerApartadosAdmin);
router.patch('/api/admin/apartados/confirmar/:id', protegerRuta, ApartadoController.confirmarApartado);
router.patch('/api/admin/apartados/entregado/:id', verificarAdmin, ApartadoController.marcarEntregado);
router.patch('/api/admin/apartados/cancelar/:id', protegerRuta, ApartadoController.cancelarApartadoAdmin);

// -----------------------------------------------
// API DE GESTIÓN DE CLIENTES
// -----------------------------------------------
// GET: lista de clientes con sus compras; acepta ?busqueda= para filtrar
// PATCH: actualiza nombre, dirección y teléfono de un cliente
router.get('/api/admin/clientes', verificarAdmin, AdminController.listarClientes);
router.patch('/api/admin/clientes/:id', verificarAdmin, AdminController.actualizarCliente);

// -----------------------------------------------
// API DE REPORTES CSV
// -----------------------------------------------
// Descargan un archivo .csv con todos los pedidos o clientes
router.get('/api/admin/reportes/pedidos.csv', verificarAdmin, ReportesController.exportarPedidosCSV);
router.get('/api/admin/reportes/clientes.csv', verificarAdmin, ReportesController.exportarClientesCSV);

// -----------------------------------------------
// API DE NOTIFICACIONES
// -----------------------------------------------
// GET: devuelve las notificaciones no leídas + el conteo total
// PATCH marcar leída: marca una notificación específica como leída
// PATCH marcar todas leídas: marca todas las no leídas como leídas
router.get('/api/admin/notificaciones', protegerRuta, NotificacionesController.obtenerNotificaciones);
router.patch('/api/admin/notificaciones/:id/leida', protegerRuta, NotificacionesController.marcarLeida);
router.patch('/api/admin/notificaciones/todas-leidas', protegerRuta, NotificacionesController.marcarTodasLeidas);

// -----------------------------------------------
// API DE HISTÓRICOS / ESTADÍSTICAS
// -----------------------------------------------
router.get('/api/admin/historicos/productos', protegerRuta, HistoricosController.apiProductosMasVendidos);
router.get('/api/admin/historicos/clientes', protegerRuta, HistoricosController.apiClientesQueMasCompran);
router.get('/api/admin/historicos/estados', protegerRuta, HistoricosController.apiPedidosPorEstado);
router.get('/api/admin/historicos/ventas-dia', protegerRuta, HistoricosController.apiVentasPorDia);
router.get('/api/admin/historicos/visitas-dia', protegerRuta, HistoricosController.apiVisitasPorDia);
router.get('/api/admin/historicos/rutas', protegerRuta, HistoricosController.apiVisitasPorRuta);
router.get('/api/admin/historicos/exportar', protegerRuta, HistoricosController.exportarHistoricos);

module.exports = router;