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

    // Crea un producto nuevo (lo usa el admin). El código se genera
    // automáticamente para no chocar con los códigos del POS.
    crearProducto: (datos, callback) => {
        const sql = `
            INSERT INTO producto
                (codigo, nombre, unidad, lugar, precio, categoria, stock, limite_venta, estado, descripcion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const valores = [
            datos.codigo,
            datos.nombre,
            datos.unidad,
            datos.lugar,
            Number(datos.precio) || 0,
            datos.categoria,
            Number(datos.stock) || 0,
            Number(datos.limiteVenta) || 0,
            datos.estado,
            datos.descripcion
        ];
        conexion.query(sql, valores, callback);
    },

    // Actualiza los datos de un producto (nombre, categoría, unidad, lugar,
    // descripción y precio). El stock/estado se maneja en el panel principal.
    actualizarDatosProducto: (id, datos, callback) => {
        const sql = `
            UPDATE producto
            SET nombre = ?,
                categoria = ?,
                unidad = ?,
                lugar = ?,
                descripcion = ?,
                precio = ?
            WHERE id_producto = ?
        `;
        conexion.query(sql, [
            datos.nombre,
            datos.categoria,
            datos.unidad,
            datos.lugar,
            datos.descripcion,
            Number(datos.precio) || 0,
            id
        ], callback);
    },

    // Trae los productos más vendidos (los que más apartados confirmados/entregados tienen)
    obtenerDestacados: (callback) => {
        const sql = `
            SELECT 
                p.nombre,
                p.unidad,
                p.lugar,
                p.precio,
                p.descuento,
                p.fecha_inicio_oferta,
                p.fecha_fin_oferta,
                p.id_producto,
                p.limite_venta,
                p.estado,
                p.descripcion,
                SUM(a.cantidad) AS total_vendido
            FROM producto p
            INNER JOIN apartados a ON a.producto = p.id_producto
            WHERE a.estado IN ('confirmado', 'entregado')
              AND p.nombre != 'COMODIN'
              AND p.precio > 0
            GROUP BY p.id_producto, p.nombre, p.unidad, p.lugar, p.precio, p.descuento,
                     p.fecha_inicio_oferta, p.fecha_fin_oferta, p.limite_venta, p.estado, p.descripcion
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

    // Trae los productos que están en oferta vigente (descuento > 0
    // y dentro del rango de fechas). Lo usa la tarjeta "Ofertas activas".
    obtenerConOfertas: (callback) => {
        const sql = `
            SELECT * FROM producto
            WHERE nombre != 'COMODIN'
              AND precio > 0
              AND descuento > 0
              AND (fecha_inicio_oferta IS NULL OR fecha_inicio_oferta <= NOW())
              AND (fecha_fin_oferta IS NULL OR fecha_fin_oferta >= NOW())
            ORDER BY nombre ASC
        `;
        conexion.query(sql, callback);
    },

    // Actualiza la oferta (descuento y fechas) de un producto.
    // Descuento 0 sin fechas = quita la oferta.
    actualizarOferta: (id, datos, callback) => {
        const sql = `
            UPDATE producto
            SET descuento = ?,
                fecha_inicio_oferta = ?,
                fecha_fin_oferta = ?
            WHERE id_producto = ?
        `;
        conexion.query(sql, [datos.descuento, datos.fechaInicio, datos.fechaFin, id], callback);
    },

    // Actualiza el límite de venta y el estado de un producto.
    // Se usa cuando el admin cambia la cantidad manualmente
    actualizarLimiteVenta: (id, limite, estado, callback) => {
        const sql = 'UPDATE producto SET limite_venta = ?, estado = ? WHERE id_producto = ?';
        conexion.query(sql, [limite, estado, id], callback);
    },

    // Descuenta unidades de limite_venta al apartar un producto.
    // Solo descuenta si hay stock suficiente (WHERE limite_venta >= ?).
    // Si affectedRows = 0, significa que no había stock y NO se descontó.
    restarLimiteVenta: (id, cantidad, callback) => {
        const sql = `
            UPDATE producto 
            SET estado = CASE WHEN (limite_venta - ?) > 0 THEN 'activo' ELSE 'inactivo' END,
                limite_venta = limite_venta - ?
            WHERE id_producto = ? AND limite_venta >= ?
        `;
        conexion.query(sql, [cantidad, cantidad, id, cantidad], callback);
    },

    // Cambia solo el estado del producto (activo/inactivo)
    actualizarEstado: (id, estado, callback) => {
        const sql = 'UPDATE producto SET estado = ? WHERE id_producto = ?';
        conexion.query(sql, [estado, id], callback);
    },

    // Cambia solo el precio de un producto (lo usa el panel de ofertas
    // para editar el precio de forma rápida sin tocar el descuento).
    actualizarPrecio: (id, precio, callback) => {
        const sql = 'UPDATE producto SET precio = ? WHERE id_producto = ?';
        conexion.query(sql, [precio, id], callback);
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