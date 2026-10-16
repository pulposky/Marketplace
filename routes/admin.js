/* ============================================= */
/* ADMIN.JS - ROUTER DE ÁREA ADMIN               */
/* ============================================= */
/* Panel de administración y todas sus APIs:      */
/* productos, apartados/pedidos, clientes,        */
/* notificaciones, reportes y estadísticas.       */
/* ============================================= */

const express = require('express');
const router = express.Router();

const AdminVistasController = require('../controllers/admin/adminVistasController');
const AdminApiController = require('../controllers/admin/adminApiController');
const ProductoController = require('../controllers/productoController');
const ApartadoController = require('../controllers/apartadoController');
const CarruselVistasController = require('../controllers/carrusel/carruselVistasController');
const CarruselApiController = require('../controllers/carrusel/carruselApiController');
const NotificacionesController = require('../controllers/notificacionesController');
const HistoricosVistasController = require('../controllers/historicos/historicosVistasController');
const HistoricosApiController = require('../controllers/historicos/historicosApiController');
const ReportesController = require('../controllers/reportesController');
const PermisosVistasController = require('../controllers/admin/permisosVistasController');
const PermisosApiController = require('../controllers/admin/permisosApiController');
const UsuariosVistasController = require('../controllers/admin/usuariosVistasController');
const UsuariosApiController = require('../controllers/admin/usuariosApiController');
const CategoriasVistasController = require('../controllers/admin/categoriasVistasController');
const CategoriasApiController = require('../controllers/admin/categoriasApiController');
const AuditoriaVistasController = require('../controllers/admin/auditoriaVistasController');
const AuditoriaApiController = require('../controllers/admin/auditoriaApiController');
const RespaldoVistasController = require('../controllers/admin/respaldoVistasController');
const RespaldoApiController = require('../controllers/admin/respaldoApiController');
const RecuperacionVistasController = require('../controllers/admin/recuperacionVistasController');
const RecuperacionApiController = require('../controllers/admin/recuperacionApiController');
const verificarAdmin = require('../middleware/verificarAdmin');
const verificarRol = require('../middleware/verificarRol');
const verificarPermiso = require('../middleware/verificarPermiso');
const noCache = require('../middleware/noCache');
const { ROL_SUPERADMIN } = require('../utils/roles');

router.use(noCache);

// -----------------------------------------------
// PÁGINAS DEL PANEL
// -----------------------------------------------
// Acceso general al panel (cualquier rol del panel).
// Cada sección interna se protege con su permiso.
router.get('/admin', verificarAdmin, AdminVistasController.mostrarMainAdmin);
router.get('/admin/habilitar-producto', verificarPermiso('productos'), AdminVistasController.mostrarHabilitarProducto);
router.get('/admin/pedidos', verificarPermiso('pedidos'), AdminVistasController.mostrarPedidos);
// Historial: pedidos confirmados, entregados y cancelados (no pendientes)
router.get('/admin/historial-pedidos', verificarPermiso('pedidos'), AdminVistasController.mostrarHistorialPedidos);

// Secciones protegidas por permiso (el Administrador las administra
// desde /admin/permisos).
router.get('/admin/ofertas', verificarPermiso('ofertas'), AdminVistasController.mostrarGestionOfertas);
router.get('/admin/historicos', verificarPermiso('analitica'), HistoricosVistasController.mostrarHistoricos);
router.get('/admin/clientes', verificarPermiso('clientes'), AdminVistasController.mostrarGestionClientes);
router.get('/admin/carrusel', verificarPermiso('carrusel'), CarruselVistasController.mostrarGestionCarrusel);

// Administración de permisos: SOLO el Administrador (superadmin).
router.get('/admin/permisos', verificarRol([ROL_SUPERADMIN]), PermisosVistasController.mostrarPermisos);
router.get('/admin/recuperacion', verificarPermiso('recuperacion'), RecuperacionVistasController.mostrarRecuperacion);

// Módulos del superadmin que también se pueden delegar por permiso:
// personal del panel, ajustes del sitio, categorías y auditoría.
// El Administrador los concede o quita desde /admin/permisos.
router.get('/admin/usuarios', verificarPermiso('usuarios'), UsuariosVistasController.mostrarUsuarios);
router.get('/admin/categorias', verificarPermiso('categorias'), CategoriasVistasController.mostrarCategorias);
router.get('/admin/auditoria', verificarPermiso('auditoria'), AuditoriaVistasController.mostrarAuditoria);
router.get('/admin/respaldo', verificarPermiso('respaldo'), RespaldoVistasController.mostrarRespaldo);

// -----------------------------------------------
// API DE PRODUCTOS
// -----------------------------------------------
// PATCH para actualizar límite de venta y estado de un producto
router.patch('/api/admin/productos/limite-venta/:id', verificarPermiso('productos'), ProductoController.actualizarLimiteVenta);
router.patch('/api/admin/productos/estado/:id', verificarPermiso('productos'), ProductoController.actualizarEstadoManual);

// CRUD de productos: crear, editar datos y gestionar la imagen
router.post('/api/admin/productos', verificarPermiso('productos'), ProductoController.crearProducto);
router.patch('/api/admin/productos/:id/datos', verificarPermiso('productos'), ProductoController.actualizarDatosProducto);
router.post('/api/admin/productos/:id/imagen', verificarPermiso('productos'), ProductoController.subirImagenProducto);

// -----------------------------------------------
// API DE OFERTAS
// -----------------------------------------------
// GET: productos en oferta vigente (con precio original y descontado)
// PATCH: guarda el descuento y las fechas de vigencia de un producto
router.get('/api/admin/ofertas', verificarPermiso('ofertas'), ProductoController.obtenerOfertasActivas);
// Nota: la ruta de precio va ANTES de la de :id para que Express la matchee primero
router.patch('/api/admin/ofertas/precio/:id', verificarPermiso('ofertas'), ProductoController.actualizarPrecioRapido);
router.patch('/api/admin/ofertas/:id', verificarPermiso('ofertas'), ProductoController.actualizarOferta);

// -----------------------------------------------
// API DE PEDIDOS / APARTADOS
// -----------------------------------------------
// GET: trae los apartados para la tabla. Acepta ?estado=
// (pendiente | confirmado | entregado | cancelado | historial =
// todos menos pendientes) o sin filtro devuelve el historial completo.
// PATCH confirmar: cambia estado a "confirmado"
// PATCH entregado: marca el pedido como entregado
// PATCH cancelar: cambia estado a "cancelado" y devuelve el stock
router.get('/api/admin/apartados', verificarPermiso('pedidos'), ApartadoController.obtenerApartadosAdmin);
router.patch('/api/admin/apartados/confirmar/:id', verificarPermiso('pedidos'), ApartadoController.confirmarApartado);
router.patch('/api/admin/apartados/entregado/:id', verificarPermiso('pedidos'), ApartadoController.marcarEntregado);
router.patch('/api/admin/apartados/cancelar/:id', verificarPermiso('pedidos'), ApartadoController.cancelarApartadoAdmin);

// -----------------------------------------------
// API DE GESTIÓN DE CLIENTES
// -----------------------------------------------
// GET: lista de clientes con sus compras; acepta ?busqueda= para filtrar
// PATCH: actualiza nombre, dirección y teléfono de un cliente
router.get('/api/admin/clientes', verificarPermiso('clientes'), AdminApiController.listarClientes);
router.patch('/api/admin/clientes/:id', verificarPermiso('clientes'), AdminApiController.actualizarCliente);

// -----------------------------------------------
// API DE CARRUSEL
// -----------------------------------------------
// POST subir: recibe un dataURL base64 y la guarda en img/carrusel
// POST eliminar: borra una imagen de la carpeta del carrusel
router.post('/api/admin/carrusel/subir', verificarPermiso('carrusel'), CarruselApiController.subirImagen);
router.post('/api/admin/carrusel/eliminar', verificarPermiso('carrusel'), CarruselApiController.eliminarImagen);

// -----------------------------------------------
// API DE REPORTES CSV
// -----------------------------------------------
// Descargan un archivo .csv con todos los pedidos o clientes
router.get('/api/admin/reportes/pedidos.csv', verificarPermiso('analitica'), ReportesController.exportarPedidosCSV);
router.get('/api/admin/reportes/clientes.csv', verificarPermiso('analitica'), ReportesController.exportarClientesCSV);

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
router.get('/api/admin/historicos/productos', verificarPermiso('analitica'), HistoricosApiController.apiProductosMasVendidos);
router.get('/api/admin/historicos/clientes', verificarPermiso('analitica'), HistoricosApiController.apiClientesQueMasCompran);
router.get('/api/admin/historicos/estados', verificarPermiso('analitica'), HistoricosApiController.apiPedidosPorEstado);
router.get('/api/admin/historicos/ventas-dia', verificarPermiso('analitica'), HistoricosApiController.apiVentasPorDia);
router.get('/api/admin/historicos/visitas-dia', verificarPermiso('analitica'), HistoricosApiController.apiVisitasPorDia);
router.get('/api/admin/historicos/rutas', verificarPermiso('analitica'), HistoricosApiController.apiVisitasPorRuta);
router.get('/api/admin/historicos/exportar', verificarPermiso('analitica'), HistoricosApiController.exportarHistoricos);

// -----------------------------------------------
// API DE PERMISOS POR ROL (SOLO Administrador)
// -----------------------------------------------
router.get('/api/admin/permisos', verificarRol([ROL_SUPERADMIN]), PermisosApiController.obtenerPermisos);
router.patch('/api/admin/permisos', verificarRol([ROL_SUPERADMIN]), PermisosApiController.guardarPermisos);
router.get('/api/admin/recuperacion/contacto', verificarPermiso('recuperacion'), RecuperacionApiController.obtenerContacto);
router.put('/api/admin/recuperacion/contacto', verificarPermiso('recuperacion'), RecuperacionApiController.guardarContacto);

// Restablecer clave de cliente: operación sensible, delegable por el Administrador.
router.post('/api/admin/recuperacion/cliente', verificarPermiso('recuperacion'), RecuperacionApiController.restablecerPasswordCliente);

// -----------------------------------------------
// API DE USUARIOS DEL PANEL (permiso 'usuarios')
// -----------------------------------------------
router.get('/api/admin/usuarios', verificarPermiso('usuarios'), UsuariosApiController.listar);
router.post('/api/admin/usuarios', verificarPermiso('usuarios'), UsuariosApiController.crear);
router.patch('/api/admin/usuarios/:id/password', verificarPermiso('usuarios'), UsuariosApiController.cambiarPassword);
router.patch('/api/admin/usuarios/:id/activo', verificarPermiso('usuarios'), UsuariosApiController.cambiarActivo);
router.patch('/api/admin/usuarios/:id', verificarPermiso('usuarios'), UsuariosApiController.actualizar);

// -----------------------------------------------
// API DE CATEGORÍAS (permiso 'categorias')
// -----------------------------------------------
router.get('/api/admin/categorias', verificarPermiso('categorias'), CategoriasApiController.listar);
router.post('/api/admin/categorias', verificarPermiso('categorias'), CategoriasApiController.crear);
router.patch('/api/admin/categorias/:id', verificarPermiso('categorias'), CategoriasApiController.renombrar);
router.delete('/api/admin/categorias/:id', verificarPermiso('categorias'), CategoriasApiController.eliminar);

// -----------------------------------------------
// API DE AUDITORÍA (permiso 'auditoria')
// -----------------------------------------------
router.get('/api/admin/auditoria', verificarPermiso('auditoria'), AuditoriaApiController.listar);

// -----------------------------------------------
// API DE CONTENIDO DEL SITIO / MINI-CMS (permiso 'contenido')
// -----------------------------------------------

// -----------------------------------------------
// API DE BANNERS / PROMOCIONES (permiso 'banners')
// -----------------------------------------------
// La ruta de :id/activo va ANTES de :id para que Express la matchee primero

// -----------------------------------------------
// API DE RESPALDO Y EXPORTACIÓN (permiso 'respaldo')
// -----------------------------------------------
router.get('/api/admin/respaldo/completo', verificarPermiso('respaldo'), RespaldoApiController.exportarCompleto);
router.get('/api/admin/respaldo/tabla/:clave', verificarPermiso('respaldo'), RespaldoApiController.exportarTabla);

module.exports = router;
