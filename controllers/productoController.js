// =============================================
// CONTROLADOR DE PRODUCTOS
// =============================================
// Lógica del catálogo a nivel de API:
// listar productos (JSON) y que el admin pueda
// cambiar la cantidad límite o el estado.
// =============================================

const ProductoModel = require('../models/productoModel');
const { normalizarCategorias } = require('../utils/helpers');

const ProductoController = {

    // GET /api/productos
    // Devuelve todos los productos como JSON.
    // Opcionalmente filtra por categoría (?categoria=xxx)
    // o por texto de búsqueda (?busqueda=xxx)
    obtenerTodos: (req, res) => {
        const categorias = normalizarCategorias(req.query.categoria || req.query.categorias);
        const busqueda = String(req.query.busqueda || '').trim().toLowerCase();

        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar la BD' });
            }

            let productosFiltrados = resultados;

            if (categorias.length > 0) {
                productosFiltrados = productosFiltrados.filter((producto) => categorias.includes(producto.categoria));
            }

            if (busqueda) {
                productosFiltrados = productosFiltrados.filter((producto) =>
                    producto.nombre && producto.nombre.toLowerCase().includes(busqueda)
                );
            }

            res.json(productosFiltrados);
        });
    },

    // PATCH /api/admin/productos/limite-venta/:id
    // Actualiza la cantidad límite a vender de un producto (lo usa el admin)
    actualizarLimiteVenta: (req, res) => {
        const { id } = req.params;
        const { cantidad } = req.body;
        const limite = parseInt(cantidad, 10);

        if (isNaN(limite) || limite < 0) {
            return res.status(400).json({ error: 'Cantidad inválida' });
        }

        const nuevoEstado = limite > 0 ? 'activo' : 'inactivo';

        ProductoModel.actualizarLimiteVenta(id, limite, nuevoEstado, (error) => {
            if (error) {
                console.error('Error actualizando límite:', error);
                return res.status(500).json({ error: 'Error en el servidor al guardar cantidad.' });
            }

            return res.json({
                ok: true,
                limite,
                estado: nuevoEstado
            });
        });
    },

    // PATCH /api/admin/productos/estado/:id
    // Cambia el estado manual de un producto (activo/inactivo)
    actualizarEstadoManual: (req, res) => {
        const { id } = req.params;
        const { activo } = req.body;
        const nuevoEstado = activo ? 'activo' : 'inactivo';

        ProductoModel.actualizarEstado(id, nuevoEstado, (error) => {
            if (error) {
                console.error('Error actualizando estado:', error);
                return res.status(500).json({ error: 'Error en el servidor al cambiar estado.' });
            }

            return res.json({
                ok: true,
                estado: nuevoEstado
            });
        });
    }
};

module.exports = ProductoController;