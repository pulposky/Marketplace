const conexion = require('../database/conexion');

// Modelo de productos con las consultas SQL principales del catálogo.
const ProductoModel = {
    // Devuelve todos los productos del catálogo (excluyendo comodines y sin precio)
    obtenerTodos: (callback) => {
        conexion.query("SELECT * FROM producto WHERE nombre != 'COMODIN' AND precio > 0 ORDER BY nombre ASC", callback);
    },

    // Devuelve los productos destacados según una lista fija de IDs
    obtenerDestacados: (callback) => {
        const sql = `
            SELECT nombre, unidad, lugar, precio, id_producto, limite_venta
            FROM producto
            WHERE id_producto IN (42, 44, 402, 401)
        `;
        conexion.query(sql, callback);
    },

    // Obtiene un solo producto por su ID
    obtenerPorId: (id, callback) => {
        const sql = 'SELECT * FROM producto WHERE id_producto = ?';
        conexion.query(sql, [id], callback);
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
    },

    // Actualiza la cantidad límite a vender y el estado
    actualizarLimiteVenta: (id, limite, estado, callback) => {
        const sql = 'UPDATE producto SET limite_venta = ?, estado = ? WHERE id_producto = ?';
        conexion.query(sql, [limite, estado, id], callback);
    },

    // Actualiza únicamente el estado manual del producto ('activo' / 'inactivo')
    actualizarEstado: (id, estado, callback) => {
        const sql = 'UPDATE producto SET estado = ? WHERE id_producto = ?';
        conexion.query(sql, [estado, id], callback);
    },

    obtenerApartadosPorCliente: (nombreCliente, callback) => {
        const query = `
            SELECT 
                a.id_apartado,
                a.nombre_cliente,
                a.cantidad,
                p.id_producto,
                p.nombre,
                p.precio,
                p.unidad,
                p.estado
            FROM apartados a
            JOIN producto p ON a.producto = p.id_producto
            WHERE a.nombre_cliente = ?
        `;
        conexion.query(query, [nombreCliente], callback);
    },

    obtenerApartadoPorId: (idApartado, callback) => {
        const sql = 'SELECT * FROM apartados WHERE id_apartado = ?';
        conexion.query(sql, [idApartado], callback);
    },

    eliminarApartado: (idApartado, callback) => {
        const sql = 'DELETE FROM apartados WHERE id_apartado = ?';
        conexion.query(sql, [idApartado], callback);
    },

    devolverStockProducto: (idProducto, cantidad, callback) => {
        const sql = `
            UPDATE producto 
            SET limite_venta = limite_venta + ?, 
                estado = 'activo' 
            WHERE id_producto = ?
        `;
        conexion.query(sql, [cantidad, idProducto], callback);
    }
};

module.exports = ProductoModel;