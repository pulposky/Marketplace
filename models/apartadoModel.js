// =============================================
// MODELO DE APARTADOS (RESERVAS)
// =============================================
// Consultas SQL de la tabla 'apartados': crear,
// consultar, confirmar, entregar y cancelar
// apartados (incluida la expiración automática).
// =============================================

const conexion = require('../database/conexion');

const ApartadoModel = {

    // ------------------------------------------------
    // CREACIÓN
    // ------------------------------------------------

    // Crea un apartado nuevo cuando un cliente reserva
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

    // Trae todos los apartados de un cliente específico (para la vista "mis apartados")
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

    // Busca un apartado por su ID (lo uso para cancelar y devolver stock)
    obtenerApartadoPorId: (idApartado, callback) => {
        const sql = 'SELECT * FROM apartados WHERE id_apartado = ?';
        conexion.query(sql, [idApartado], callback);
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

    // Cambia el estado de un apartado a "confirmado" y registra quién confirmó
    confirmarApartado: (idApartado, nombreAdmin, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, confirmado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['confirmado', nombreAdmin || null, idApartado], callback);
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

    // Cambia el estado de un apartado a "cancelado" y registra quién canceló
    cancelarApartadoAdmin: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['cancelado', 'admin', idApartado], callback);
    },

    // Cancela un apartado desde el cliente (UPDATE en vez de DELETE para que aparezca en historial)
    cancelarApartadoCliente: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['cancelado', 'cliente', idApartado], callback);
    },

    // ------------------------------------------------
    // EXPIRACIÓN AUTOMÁTICA DE APARTADOS (1 HORA)
    // ------------------------------------------------

    // Busca apartados pendientes que ya pasaron de 1 hora
    obtenerApartadosExpirados: (callback) => {
        const sql = `
            SELECT a.id_apartado, a.producto, a.cantidad, a.nombre_cliente
            FROM apartados a
            WHERE a.estado = 'pendiente'
              AND DATE_ADD(a.fecha, INTERVAL 1 HOUR) < NOW()
        `;
        conexion.query(sql, callback);
    },

    // Cancela un apartado por expiración del sistema
    cancelarApartadoPorExpiracion: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ?';
        conexion.query(sql, ['cancelado', 'admin', idApartado], callback);
    }
};

module.exports = ApartadoModel;