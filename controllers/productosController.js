const ProductoModel = require('../model/productoModel');

const ProductoController = {
    mostrarHome: (req, res) => {
        res.render('home');
    },

    // Función para obtener y mostrar todos los productos
    mostrarProductos: (req, res) => {
        ProductoModel.obtenerTodos((error, resultados) => {
            if (error) {
                console.error('Error en la BD:', error);
                return res.status(500).send('Error al consultar la base de datos');
            }
            
            res.render('productos', { productos: resultados });
        });
    }
};

module.exports = ProductoController;