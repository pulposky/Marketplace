const conexion = require('../database/conexion');

// Modelo de productos con las consultas SQL principales del catálogo.
const ProductoModel = {
    // Devuelve todos los productos disponibles, excluyendo comodines y precios en cero.
    obtenerTodos: (callback) => {
        conexion.query("SELECT * FROM producto WHERE nombre != 'COMODIN' AND precio > 0 ORDER BY nombre ASC", callback);
    },

    // Devuelve los productos destacados según una lista fija de nombres
    obtenerDestacados: (callback) => {
        const sql = `
            SELECT nombre, unidad, lugar, precio, id_producto
            FROM producto
            WHERE nombre IN (
                'PLATANO HARTON 1A KG',
                'PLATANO HARTON 2A KG',
                'HUEVOS DE GALLINA A UND',
                'HUEVOS DE GALLINA AA UND'
            )
            AND unidad <> '25 KG' AND precio <> 0
        `;
        conexion.query(sql, callback);
    },

    // Inserta un nuevo registro de apartado en la tabla apartados
    crearApartado: (datosApartado, callback) => {
        const sql = `
            INSERT INTO apartados (nombre_cliente, producto, cantidad)
            VALUES (?, ?, ?)
        `;
        const valores = [
            datosApartado.nombreCliente,
            datosApartado.producto,
            datosApartado.cantidad
        ];

        conexion.query(sql, valores, callback);
    }
};

module.exports = ProductoModel;