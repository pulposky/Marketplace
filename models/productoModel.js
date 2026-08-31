// =============================================
// MODELO DE PRODUCTOS
// =============================================
// Consultas SQL de la tabla 'producto' (catálogo):
// listar, buscar, actualizar stock y estado.
// Las consultas de apartados y notificaciones
// viven en apartadoModel y notificacionModel.
// =============================================

const conexion = require('../database/conexion');

const ProductoModel = {

    // Trae todos los productos excepto el comodín y los sin precio
    obtenerTodos: (callback) => {
        conexion.query("SELECT * FROM producto WHERE nombre != 'COMODIN' AND precio > 0 ORDER BY nombre ASC", callback);
    },

    // Trae los productos más vendidos (los que más apartados confirmados/entregados tienen)
    obtenerDestacados: (callback) => {
        const sql = `
            SELECT 
                p.nombre,
                p.unidad,
                p.lugar,
                p.precio,
                p.id_producto,
                p.limite_venta,
                p.estado,
                SUM(a.cantidad) AS total_vendido
            FROM producto p
            INNER JOIN apartados a ON a.producto = p.id_producto
            WHERE a.estado IN ('confirmado', 'entregado')
              AND p.nombre != 'COMODIN'
              AND p.precio > 0
            GROUP BY p.id_producto, p.nombre, p.unidad, p.lugar, p.precio, p.limite_venta, p.estado
            ORDER BY total_vendido DESC
            LIMIT 4
        `;
        conexion.query(sql, callback);
    },

    // Busca un producto por su ID (lo uso antes de crear un apartado)
    obtenerPorId: (id, callback) => {
        const sql = 'SELECT * FROM producto WHERE id_producto = ?';
        conexion.query(sql, [id], callback);
    },

    // Actualiza el límite de venta y el estado de un producto.
    // Se usa cuando el admin cambia la cantidad manualmente
    actualizarLimiteVenta: (id, limite, estado, callback) => {
        const sql = 'UPDATE producto SET limite_venta = ?, estado = ? WHERE id_producto = ?';
        conexion.query(sql, [limite, estado, id], callback);
    },

    // Descuenta unidades de limite_venta al apartar un producto.
    // Es atómico (evita condiciones de carrera entre la lectura y el update)
    // y pone el producto inactivo si llega a 0, activo si queda stock.
    restarLimiteVenta: (id, cantidad, callback) => {
        const sql = `
            UPDATE producto 
            SET limite_venta = GREATEST(0, limite_venta - ?),
                estado = CASE WHEN GREATEST(0, limite_venta - ?) > 0 THEN 'activo' ELSE 'inactivo' END
            WHERE id_producto = ?
        `;
        conexion.query(sql, [cantidad, cantidad, id], callback);
    },

    // Cambia solo el estado del producto (activo/inactivo)
    actualizarEstado: (id, estado, callback) => {
        const sql = 'UPDATE producto SET estado = ? WHERE id_producto = ?';
        conexion.query(sql, [estado, id], callback);
    },

    // Devuelve las unidades al stock del producto cuando se cancela un apartado
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