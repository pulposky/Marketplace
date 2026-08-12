const ProductoModel = require('../model/productoModel');

// Convierte los filtros de categoría recibidos desde la URL en un arreglo limpio.
const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

const ProductoController = {
    // Devuelve los productos en formato JSON; opcionalmente filtra por categoría.
    obtenerTodos: (req, res) => {
        const categorias = normalizarCategorias(req.query.categoria || req.query.categorias);

        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar la BD' });
            }

            const productosFiltrados = categorias.length > 0
                ? resultados.filter((producto) => categorias.includes(producto.categoria))
                : resultados;

            res.json(productosFiltrados);
        });
    },

    // Registra un apartado de producto en la base de datos si el usuario tiene sesión activa.
    apartarProducto: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Debe iniciar sesión para apartar un producto.' });
        }

        const { productoId, cantidad } = req.body;

        if (!productoId || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para apartar.' });
        }

        const cantidadNumero = parseInt(cantidad, 10);
        if (Number.isNaN(cantidadNumero) || cantidadNumero <= 0) {
            return res.status(400).json({ error: 'Cantidad inválida.' });
        }

        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        const datosApartado = {
            nombreCliente,
            producto: productoId,
            cantidad: cantidadNumero
        };

        ProductoModel.crearApartado(datosApartado, (error, resultado) => {
            if (error) {
                console.error('Error al registrar apartado:', error);
                return res.status(500).json({ error: 'Error al procesar el apartado en la BD.' });
            }

            return res.status(200).json({
                mensaje: '¡Producto apartado con éxito!',
                idInsertado: resultado.insertId
            });
        });
    }
};

module.exports = ProductoController;