// =============================================
// CONTROLADOR DEL PANEL ADMIN
// =============================================
// Páginas del panel de administración y la gestión
// de clientes (listar, buscar y editar).
// Las APIs de productos/apartados viven en sus
// propios controllers.
// =============================================

const ProductoModel = require('../models/productoModel');
const UsuarioModel = require('../models/usuarioModel');
const { asociarImagenesAProductos } = require('../utils/imagenes');

const AdminController = {

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
    // para que el admin pueda configurarlos. Solo admin (no aprendiz).
    mostrarGestionOfertas: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || rol !== 'admin') {
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
    },

    // GET /api/admin/clientes
    // Lista clientes con su resumen de compras; acepta ?busqueda= para filtrar
    listarClientes: (req, res) => {
        const busqueda = String(req.query.busqueda || '');

        UsuarioModel.obtenerClientesAdmin(busqueda, (error, clientes) => {
            if (error) {
                console.error('Error al consultar clientes:', error);
                return res.status(500).json({ error: 'Error al consultar clientes.' });
            }
            res.json(Array.isArray(clientes) ? clientes : []);
        });
    },

    // PATCH /api/admin/clientes/:id
    // Actualiza nombre, dirección y teléfono de un cliente
    actualizarCliente: async (req, res) => {
        // Validación de rol: solo el admin edita clientes.
        const rolSesion = String(req.session?.usuario?.role || '').trim().toLowerCase();
        if (rolSesion !== 'admin') {
            return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para gestionar clientes.' });
        }

        const { id } = req.params;
        const { nombre, direccion, telefono } = req.body;

        if (!id) {
            return res.status(400).json({ ok: false, mensaje: 'Falta el ID del cliente.' });
        }
        if (!nombre || !nombre.trim()) {
            return res.json({ ok: false, mensaje: 'El nombre no puede estar vacío' });
        }

        try {
            await UsuarioModel.actualizarCliente(id, {
                nombre: String(nombre).trim(),
                direccion: String(direccion || '').trim(),
                telefono: String(telefono || '').trim()
            });

            return res.json({ ok: true, mensaje: 'Cliente actualizado correctamente.' });
        } catch (error) {
            console.error('Error en actualizarCliente:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
        }
    }
};

module.exports = AdminController;