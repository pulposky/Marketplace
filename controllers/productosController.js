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
    }
    
};

module.exports = ProductoController;