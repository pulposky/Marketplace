const ProductoModel = require('../model/productoModel');

const ProductoController = {
    // Petición GET: Devuelve el listado de productos en JSON
    obtenerTodos: (req, res) => {
        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                return res.status(500).json({ error: 'Error al consultar la BD' });
            }
            res.json(resultados);
        });
    },

    // Petición POST: Procesa el apartado del producto
    apartarProducto: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ error: 'Debe iniciar sesión para apartar un producto.' });
        }

        const { productoId, cantidad } = req.body;

        // Validar que lleguen los datos requeridos
        if (!productoId || !cantidad) {
            return res.status(400).json({ error: 'Faltan datos obligatorios para apartar.' });
        }

        const cantidadNumero = parseInt(cantidad, 10);
        if (Number.isNaN(cantidadNumero) || cantidadNumero <= 0) {
            return res.status(400).json({ error: 'Cantidad inválida.' });
        }

        // Obtener el cliente logueado desde la sesión (o fallback si aplica)
        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        const datosApartado = {
            nombreCliente,
            producto: productoId,
            cantidad: cantidadNumero
        };

        // Guardar en la base de datos
        ProductoModel.crearApartado(datosApartado, (error, resultado) => {
            if (error) {
                console.error("Error al registrar apartado:", error);
                return res.status(500).json({ error: 'Error al procesar el apartado en la BD.' });
            }

            // Devuelve status 200/201 para que el frontend (fetch) reciba respuestaApartar.ok = true
            return res.status(200).json({
                mensaje: '¡Producto apartado con éxito!',
                idInsertado: resultado.insertId
            });
        });
    }
};

module.exports = ProductoController;