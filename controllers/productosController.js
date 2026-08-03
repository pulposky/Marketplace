const ProductoModel = require('../model/productoModel');

const ProductoController = {
    // Devuelve todos los productos en formato JSON para la API
    obtenerTodos: (req, res) => {
        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar la BD' });
            }
            res.json(resultados);
        });
    },

    // Procesa el apartado de un producto y guarda el registro en la tabla apartados
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