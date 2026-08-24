// =============================================
// MODELO DE PRODUCTOS Y NOTIFICACIONES
// =============================================
// Acá están todas las consultas SQL del proyecto.
// Cada función recibe un callback que se ejecuta
// cuando la consulta termina. Usamos mysql2 con
// callbacks (no promesas) porque es más sencillo
// para este proyecto.
//
// Tablas que maneja:
//   - producto (catálogo)
//   - apartados (reservas de clientes)
//   - notificaciones (para el admin)
// =============================================

const conexion = require('../database/conexion');

const ProductoModel = {

    // ------------------------------------------------
    // CONSULTAS DE PRODUCTOS
    // ------------------------------------------------

    // Trae todos los productos excepto el comodín y los sin precio
    obtenerTodos: (callback) => {
        conexion.query("SELECT * FROM producto WHERE nombre != 'COMODIN' AND precio > 0 ORDER BY nombre ASC", callback);
    },

    // Trae solo los productos destacados (hardcodeados por ID)
    obtenerDestacados: (callback) => {
        const sql = `
            SELECT nombre, unidad, lugar, precio, id_producto, limite_venta
            FROM producto
            WHERE id_producto IN (42, 44, 402, 401)
        `;
        conexion.query(sql, callback);
    },

    // Busca un producto por su ID (lo uso antes de crear un apartado)
    obtenerPorId: (id, callback) => {
        const sql = 'SELECT * FROM producto WHERE id_producto = ?';
        conexion.query(sql, [id], callback);
    },

    // ------------------------------------------------
    // CONSULTAS DE APARTADOS
    // ------------------------------------------------

    // Crea un apartado nuevo cuando un cliente reserva
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

    // Actualiza el límite de venta y el estado de un producto
    // Se usa cuando se crea un apartado (descuenta stock) o cuando el admin cambia la cantidad
    actualizarLimiteVenta: (id, limite, estado, callback) => {
        const sql = 'UPDATE producto SET limite_venta = ?, estado = ? WHERE id_producto = ?';
        conexion.query(sql, [limite, estado, id], callback);
    },

    // Cambia solo el estado del producto (activo/inactivo)
    actualizarEstado: (id, estado, callback) => {
        const sql = 'UPDATE producto SET estado = ? WHERE id_producto = ?';
        conexion.query(sql, [estado, id], callback);
    },

    // Trae todos los apartados de un cliente específico (para la vista "mis apartados")
    obtenerApartadosPorCliente: (nombreCliente, callback) => {
        const query = `
            SELECT 
                a.id_apartado,
                a.nombre_cliente,
                a.cantidad,
                a.estado AS estado_apartado,
                p.id_producto,
                p.nombre,
                p.precio,
                p.unidad,
                p.estado AS estado
            FROM apartados a
            JOIN producto p ON a.producto = p.id_producto
            WHERE a.nombre_cliente = ?
            ORDER BY a.id_apartado DESC
        `;
        conexion.query(query, [nombreCliente], callback);
    },

    // Busca un apartado por su ID (lo uso para cancelar y devolver stock)
    obtenerApartadoPorId: (idApartado, callback) => {
        const sql = 'SELECT * FROM apartados WHERE id_apartado = ?';
        conexion.query(sql, [idApartado], callback);
    },

    // Elimina un apartado completamente (lo usa el cliente cuando cancela)
    eliminarApartado: (idApartado, callback) => {
        const sql = 'DELETE FROM apartados WHERE id_apartado = ?';
        conexion.query(sql, [idApartado], callback);
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
    },

    // Trae los apartados para el admin.
    // Estados de filtro aceptados:
    //   'pendiente' | 'confirmado' | 'entregado' | 'cancelado' -> ese estado
    //   'activos'   -> pendientes + confirmados (fila de trabajo)
    //   'historial' -> entregados + cancelados (pedidos terminados)
    //   otro / 'todos' -> historial completo
        obtenerTodosApartados: (estado, callback) => {
        if (typeof estado === 'function') {
            callback = estado;
            estado = 'todos';
        }

        let filtro = '';
        let parametros = [];

        if (estado === 'activos') {
            filtro = "WHERE a.estado IN ('pendiente', 'confirmado')";
        } else if (estado === 'historial') {
            filtro = "WHERE a.estado IN ('entregado', 'cancelado')";
        } else if (estado && estado !== 'todos') {
            filtro = 'WHERE a.estado = ?';
            parametros = [estado];
        }

    const sql = `
            SELECT 
                a.id_apartado,
                a.nombre_cliente,
                a.cantidad,
                a.estado AS estado_apartado,
                p.id_producto,
                p.nombre,
                p.precio,
                p.unidad,
                p.estado AS estado
            FROM apartados a
            JOIN producto p ON a.producto = p.id_producto
            WHERE a.nombre_cliente = ?
            AND a.estado NOT IN ('entregado', 'cancelado')
            ORDER BY a.id_apartado DESC
        `;
        conexion.query(sql, parametros, callback);
    },

    // Cambia el estado de un apartado a "confirmado"
    confirmarApartado: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ? WHERE id_apartado = ?';
        conexion.query(sql, ['confirmado', idApartado], callback);
    },

    // Cambia el estado de un apartado a "entregado"
    // Solo se puede entregar un pedido que esté confirmado
    marcarEntregado: (idApartado, callback) => {
        const sql = `
            UPDATE apartados SET estado = ?
            WHERE id_apartado = ? AND estado IN ('pendiente', 'confirmado')
        `;
        conexion.query(sql, ['entregado', idApartado], callback);
    },

    // Cambia el estado de un apartado a "cancelado" (lo hace el admin)
    cancelarApartadoAdmin: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ? WHERE id_apartado = ?';
        conexion.query(sql, ['cancelado', idApartado], callback);
    },

    // ------------------------------------------------
    // CONSULTAS DE NOTIFICACIONES
    // ------------------------------------------------

    // Crea una notificación nueva (se llama cuando alguien aparta un producto)
    crearNotificacion: (datos, callback) => {
        const sql = 'INSERT INTO notificaciones (titulo, mensaje) VALUES (?, ?)';
        conexion.query(sql, [datos.titulo, datos.mensaje], callback);
    },

    // Trae las notificaciones que no se han leído (máximo 20, las más recientes primero)
    obtenerNotificacionesNoLeidas: (callback) => {
        const sql = 'SELECT * FROM notificaciones WHERE leido = 0 ORDER BY fecha DESC LIMIT 20';
        conexion.query(sql, callback);
    },

    // Cuenta cuántas notificaciones hay sin leer (para el badge de la campana)
    contarNoLeidas: (callback) => {
        const sql = 'SELECT COUNT(*) AS total FROM notificaciones WHERE leido = 0';
        conexion.query(sql, callback);
    },

    // Marca una notificación individual como leída
    marcarComoLeida: (id, callback) => {
        const sql = 'UPDATE notificaciones SET leido = 1 WHERE id = ?';
        conexion.query(sql, [id], callback);
    },

    // Marca todas las notificaciones no leídas como leídas de una vez
    marcarTodasLeidas: (callback) => {
        const sql = 'UPDATE notificaciones SET leido = 1 WHERE leido = 0';
        conexion.query(sql, callback);
    }
};

module.exports = ProductoModel;
