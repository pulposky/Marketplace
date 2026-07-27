const conexion = require('../database/conexion');

const ProductoModel = {
    obtenerTodos: (callback) => {
        conexion.query('SELECT * FROM producto', callback);
    }
};

module.exports = ProductoModel;