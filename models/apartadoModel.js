/* ============================================= */
/* APARTADO MODEL - Gestión de reservas          */
/* ============================================= */
/* Consultas SQL sobre la tabla 'apartados':     */
/* crear, consultar, confirmar, entregar y       */
/* cancelar apartados, incluyendo expiración     */
/* automática de reservas no confirmadas.        */
/* ============================================= */

const conexion = require('../database/conexion');

const ApartadoModel = {

    // ------------------------------------------------
    // CREACIÓN
    // ------------------------------------------------

    // Crea un apartado nuevo cuando un cliente reserva un producto.
    // Recibe un objeto con nombreCliente, producto, cantidad y precioAplicado.
    // Devuelve el insert con el id_apartado generado.
    crearApartado: (datosApartado, callback) => {
        const sql = `
            INSERT INTO apartados (nombre_cliente, producto, cantidad, precio_aplicado)
            VALUES (?, ?, ?, ?)
        `;
        const valores = [
            datosApartado.nombreCliente,
            datosApartado.producto,
            datosApartado.cantidad,
            Number(datosApartado.precioAplicado) || 0
        ];

        conexion.query(sql, valores, callback);
    },

    // ------------------------------------------------
    // CONSULTAS
    // ------------------------------------------------

    // Trae todos los apartados de un cliente específico, con info del producto asociado.
    // Se usa en la vista "Mis Apartados" del cliente.
    // Devuelve el listado ordenado por id_apartado descendente (más recientes primero).
    obtenerApartadosPorCliente: (nombreCliente, callback) => {
        const query = `
            SELECT 
                a.id_apartado,
                a.nombre_cliente,
                a.cantidad,
                a.precio_aplicado,
                a.estado AS estado_apartado,
                a.cancelado_por,
                a.fecha,
                p.id_producto,
                p.nombre,
                p.precio,
                p.descuento,
                p.fecha_inicio_oferta,
                p.fecha_fin_oferta,
                p.unidad,
                p.estado AS estado
            FROM apartados a
            JOIN producto p ON a.producto = p.id_producto
            WHERE a.nombre_cliente = ?
            ORDER BY a.id_apartado DESC
        `;
        conexion.query(query, [nombreCliente], callback);
    },

    // Busca un apartado por su ID.
    // Se usa internamente para cancelar apartados y devolver stock al producto.
    // Devuelve un solo registro con todos los campos de la tabla apartados.
    obtenerApartadoPorId: (idApartado, callback) => {
        const sql = 'SELECT * FROM apartados WHERE id_apartado = ?';
        conexion.query(sql, [idApartado], callback);
    },

    // Trae los apartados para el panel de administración, con info del cliente y producto.
    // Estados de filtro aceptados:
    //   'pendiente' | 'confirmado' | 'entregado' | 'cancelado' -> ese estado específico
    //   'activos'   -> pendientes + confirmados (fila de trabajo del admin)
    //   'historial' -> entregados + cancelados (pedidos terminados)
    //   otro / 'todos' -> historial completo
    // Devuelve listado ordenado por id_apartado descendente.
    // TODO: validar que el parámetro 'estado' sea uno de los valores permitidos antes de armar la consulta SQL
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
                c.documento AS cliente_documento,
                c.telefono AS cliente_telefono,
                c.direccion AS cliente_direccion,
                a.cantidad,
                a.precio_aplicado,
                a.fecha,
                a.estado,
                a.cancelado_por,
                a.confirmado_por,
                p.id_producto,
                p.nombre AS nombre_producto,
                p.precio,
                p.descuento,
                p.fecha_inicio_oferta,
                p.fecha_fin_oferta,
                p.unidad
            FROM apartados a
            JOIN producto p ON a.producto = p.id_producto
            LEFT JOIN clientes c ON a.nombre_cliente = c.nombre
            ${filtro}
            ORDER BY a.id_apartado DESC
        `;
        conexion.query(sql, parametros, callback);
    },

    // ------------------------------------------------
    // CAMBIOS DE ESTADO
    // ------------------------------------------------

    // Cambia el estado de un apartado a "confirmado" y registra el nombre del admin que confirmó.
    // Se usa cuando el admin revisa y aprueba una reserva pendiente.
    confirmarApartado: (idApartado, nombreAdmin, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, confirmado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['confirmado', nombreAdmin || null, idApartado], callback);
    },

    // Cambia el estado de un apartado a "entregado".
    // Solo permite entregar pedidos que estén en estado 'pendiente' o 'confirmado'.
    // Devuelve affectedRows = 0 si el apartado no existe o ya fue entregado/cancelado.
    marcarEntregado: (idApartado, callback) => {
        const sql = `
            UPDATE apartados SET estado = ?
            WHERE id_apartado = ? AND estado IN ('pendiente', 'confirmado')
        `;
        conexion.query(sql, ['entregado', idApartado], callback);
    },

    // Cancela un apartado desde el panel de administración.
    // Registra 'admin' como quien canceló para trazabilidad.
    cancelarApartadoAdmin: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['cancelado', 'admin', idApartado], callback);
    },

    // Cancela un apartado desde el lado del cliente.
    // Usa UPDATE en vez de DELETE para que el apartado quede en el historial.
    // Registra 'cliente' como quien canceló.
    // FIXME: falta validar que el apartado pertenezca al cliente logueado antes de permitir la cancelación
    cancelarApartadoCliente: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['cancelado', 'cliente', idApartado], callback);
    },

    // ------------------------------------------------
    // EXPIRACIÓN AUTOMÁTICA DE APARTADOS (1 HORA)
    // ------------------------------------------------

    // Busca apartados en estado 'pendiente' cuya fecha de creación ya superó 1 hora.
    // Se ejecuta periódicamente para cancelar reservas que el cliente no confirmó a tiempo.
    // Devuelve id, producto, cantidad y nombre_cliente para liberar stock después.
    obtenerApartadosExpirados: (callback) => {
        const sql = `
            SELECT a.id_apartado, a.producto, a.cantidad, a.nombre_cliente
            FROM apartados a
            WHERE a.estado = 'pendiente'
              AND DATE_ADD(a.fecha, INTERVAL 1 HOUR) < NOW()
        `;
        conexion.query(sql, callback);
    },

    // Cancela un apartado por expiración del sistema.
    // Solo cancela si el apartado sigue pendiente (evita doble cancelación).
    cancelarApartadoPorExpiracion: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ? AND estado = ?';
        conexion.query(sql, ['cancelado', 'admin', idApartado, 'pendiente'], callback);
    }
};

module.exports = ApartadoModel;