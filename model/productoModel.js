const conexion = require('../database/conexion');

const ProductoModel = {
    obtenerTodos: (callback) => {
        conexion.query("SELECT * FROM producto WHERE nombre != 'COMODIN' AND precio > 0 ORDER BY nombre ASC", callback);
    },
    obtenerDestacados: (callback) => {
    const sql = `
        SELECT nombre, unidad, lugar, precio, id_producto
        FROM producto
        WHERE nombre IN (
            'PLATANO HARTON 1A',
            'PLATANO HARTON 2A',
            'HUEVOS DE GALLINA A',
            'HUEVOS DE GALLINA AA'
        )
        AND unidad <> '25 KG' AND precio <> 0
    `;
    conexion.query(sql, callback);
    },
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