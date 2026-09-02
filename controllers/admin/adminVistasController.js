// =============================================
// VISTAS DEL PANEL ADMIN
// =============================================
// Renderiza las páginas del panel de administración:
// panel principal, habilitar productos, gestionar
// ofertas, pedidos, historial y clientes.
// =============================================

const ProductoModel = require('../../models/productoModel');
const { asociarImagenesAProductos } = require('../../utils/imagenes');

const AdminVistasController = {

    // Panel principal de administración
    // Solo ven admin y aprendiz, si no tiene permisos lo mando al inicio
    mostrarMainAdmin: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }
        res.render('admin/mainAdmin', { usuario: usuarioSesion });
    },

    // Página para habilitar/deshabilitar productos y cambiar cantidades
    mostrarHabilitarProducto: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;

            asociarImagenesAProductos(listaProductosRaw, (productosConImagen) => {
                res.render('admin/habilitarProducto', {
                    usuario: usuarioSesion,
                    productos: productosConImagen
                });
            });
        });
    },

    // Panel de gestión de ofertas del admin
    // Lista todos los productos con su descuento y fechas vigentes
    // para que admin y aprendiz puedan configurarlos.
    mostrarGestionOfertas: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/admin');
        }

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;

            asociarImagenesAProductos(listaProductosRaw, (productosConImagen) => {
                res.render('admin/gestionOfertas', {
                    usuario: usuarioSesion,
                    productos: productosConImagen
                });
            });
        });
    },

    // Panel de pedidos del admin
    // Muestra SOLO los pedidos pendientes; el historial completo
    // (confirmados, entregados y cancelados) vive en su propia vista.
    mostrarPedidos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        // La lista la carga el JS vía /api/admin/apartados?estado=pendiente;
        // acá solo renderizo el esqueleto de la vista.
        res.render('admin/pedidosAdmin', {
            usuario: usuarioSesion,
            modo: 'pendientes',
            titulo: 'Gestión de Pedidos'
        });
    },

    // Historial de pedidos del admin
    // Muestra todos los pedidos que ya NO están pendientes:
    // confirmados, entregados y cancelados.
    mostrarHistorialPedidos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        res.render('admin/pedidosAdmin', {
            usuario: usuarioSesion,
            modo: 'historial',
            titulo: 'Historial de Pedidos'
        });
    },

    // Vista de gestión de clientes del admin.
    // La lista la carga el JS con la API para poder buscar en vivo.
    // Solo admin (no aprendiz).
    mostrarGestionClientes: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || rol !== 'admin') {
            return res.redirect('/admin');
        }

        res.render('admin/gestionClientes', { usuario: usuarioSesion });
    }
};

module.exports = AdminVistasController;
