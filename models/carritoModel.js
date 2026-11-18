/* ============================================= */
/* CARRITOMODEL.JS - CARRITO DEL CLIENTE EN BD   */
/* ============================================= */
/* Una fila por producto + presentación (0 = la  */
/* unidad mínima). Se vacía al hacer el pedido.  */
/* ============================================= */

const conexion = require('../database/conexion');

const pool = conexion.promise();

const CarritoModel = {

    asegurarTabla: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS carrito_items (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                id_cliente INT NOT NULL,
                id_producto INT NOT NULL,
                id_presentacion INT NOT NULL DEFAULT 0,
                cantidad INT NOT NULL,
                actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_carrito_linea (id_cliente, id_producto, id_presentacion)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    },

    // [{ idProducto, idPresentacion, cantidad }] en el orden en que se agregaron
    lineas: async (idCliente) => {
        const [filas] = await pool.query(
            'SELECT id_producto AS idProducto, id_presentacion AS idPresentacion, cantidad FROM carrito_items WHERE id_cliente = ? ORDER BY id',
            [idCliente]
        );
        return filas;
    },

    // Deja la línea con esa cantidad (0 = la quita)
    fijarLinea: async (idCliente, { idProducto, idPresentacion, cantidad }) => {
        if (cantidad > 0) {
            await pool.query(
                `INSERT INTO carrito_items (id_cliente, id_producto, id_presentacion, cantidad) VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE cantidad = VALUES(cantidad)`,
                [idCliente, idProducto, idPresentacion, cantidad]
            );
        } else {
            await pool.query('DELETE FROM carrito_items WHERE id_cliente = ? AND id_producto = ? AND id_presentacion = ?',
                [idCliente, idProducto, idPresentacion]);
        }
    },

    vaciar: async (idCliente) => {
        await pool.query('DELETE FROM carrito_items WHERE id_cliente = ?', [idCliente]);
    },

    // Datos actuales de los productos del carrito (precio, oferta, stock, estado)
    productos: async (ids) => {
        if (!ids.length) return [];
        const [filas] = await pool.query(
            `SELECT id_producto, nombre, unidad, precio, descuento, fecha_inicio_oferta, fecha_fin_oferta, limite_venta, estado
             FROM producto WHERE id_producto IN (?)`, [ids]);
        return filas;
    },

    contar: async (idCliente) => {
        const [[fila]] = await pool.query('SELECT COALESCE(SUM(cantidad), 0) AS total FROM carrito_items WHERE id_cliente = ?', [idCliente]);
        return Number(fila.total) || 0;
    }
};

module.exports = CarritoModel;
