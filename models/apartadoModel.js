/* ============================================= */
/* APARTADO MODEL - Gestión de reservas          */
/* ============================================= */
/* Consultas SQL sobre la tabla 'apartados':     */
/* crear, consultar, confirmar, entregar y       */
/* cancelar apartados, incluyendo expiración     */
/* automática de reservas no confirmadas.        */
/* ============================================= */

const conexion = require('../database/conexion');
const tiendaService = require('../services/tiendaService');

const pool = conexion.promise();

const ApartadoModel = {

    // Agrega apartados.id_cliente (dueño real del apartado) si falta y,
    // solo al crearla, la rellena para nombres de cliente que no se repiten.
    // Los apartados viejos con nombre ambiguo quedan con id_cliente NULL.
    asegurarEsquema: async () => {
        await ApartadoModel.asegurarColumnasPresentacion();
        const [columnas] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'apartados' AND COLUMN_NAME = 'id_cliente'`
        );
        if (columnas.length > 0) return;
        await pool.query('ALTER TABLE apartados ADD COLUMN id_cliente INT NULL, ADD INDEX idx_apartados_id_cliente (id_cliente)');
        await pool.query(`
            UPDATE apartados a
            JOIN (SELECT nombre, MIN(id_cliente) AS id FROM clientes GROUP BY nombre HAVING COUNT(*) = 1) c
              ON a.nombre_cliente = c.nombre
            SET a.id_cliente = c.id
            WHERE a.id_cliente IS NULL
        `);
    },

    // Copia de la presentación elegida al apartar (nombre y factor), para que
    // el historial conserve su significado aunque el admin la cambie después.
    asegurarColumnasPresentacion: async () => {
        const [columnas] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'apartados'
               AND COLUMN_NAME IN ('presentacion_nombre', 'presentacion_factor', 'entrega', 'direccion_entrega', 'telefono_entrega', 'indicaciones_entrega')`
        );
        const existentes = new Set(columnas.map((c) => c.COLUMN_NAME));
        const faltan = [];
        if (!existentes.has('presentacion_nombre')) faltan.push('ADD COLUMN presentacion_nombre VARCHAR(50) NULL');
        if (!existentes.has('presentacion_factor')) faltan.push('ADD COLUMN presentacion_factor INT NULL');
        if (!existentes.has('entrega')) faltan.push('ADD COLUMN entrega VARCHAR(10) NULL'); // recoger | domicilio
        // Datos de envío a domicilio (copia al pedir: el cliente puede cambiar su perfil después)
        if (!existentes.has('direccion_entrega')) faltan.push('ADD COLUMN direccion_entrega VARCHAR(200) NULL');
        if (!existentes.has('telefono_entrega')) faltan.push('ADD COLUMN telefono_entrega VARCHAR(30) NULL');
        if (!existentes.has('indicaciones_entrega')) faltan.push('ADD COLUMN indicaciones_entrega VARCHAR(200) NULL');
        if (faltan.length) await pool.query(`ALTER TABLE apartados ${faltan.join(', ')}`);
    },

    // ------------------------------------------------
    // CREACIÓN
    // ------------------------------------------------

    // Crea un apartado nuevo cuando un cliente reserva un producto.
    // Recibe un objeto con nombreCliente, producto, cantidad (unidades mínimas),
    // precioAplicado (por unidad mínima) y opcionalmente presentacionNombre/Factor.
    // Devuelve el insert con el id_apartado generado.
    crearApartado: (datosApartado, callback) => {
        const sql = `
            INSERT INTO apartados (nombre_cliente, id_cliente, producto, cantidad, precio_aplicado,
                presentacion_nombre, presentacion_factor, entrega, direccion_entrega, telefono_entrega, indicaciones_entrega)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const valores = [
            datosApartado.nombreCliente,
            datosApartado.idCliente || null,
            datosApartado.producto,
            datosApartado.cantidad,
            Number(datosApartado.precioAplicado) || 0,
            datosApartado.presentacionNombre || null,
            datosApartado.presentacionFactor || null,
            datosApartado.entrega || null,
            datosApartado.domicilio ? datosApartado.domicilio.direccion : null,
            datosApartado.domicilio ? datosApartado.domicilio.telefono : null,
            datosApartado.domicilio ? datosApartado.domicilio.indicaciones || null : null
        ];

        conexion.query(sql, valores, callback);
    },

    // ------------------------------------------------
    // CONSULTAS
    // ------------------------------------------------

    // Trae todos los apartados de un cliente específico, con info del producto asociado.
    // Se usa en la vista "Mis Apartados" del cliente.
    // Devuelve el listado ordenado por id_apartado descendente (más recientes primero).
    obtenerApartadosPorCliente: (idCliente, callback) => {
        const query = `
            SELECT 
                a.id_apartado,
                a.nombre_cliente,
                a.cantidad,
                a.precio_aplicado,
                a.presentacion_nombre,
                a.presentacion_factor,
                a.entrega,
                a.direccion_entrega,
                a.telefono_entrega,
                a.indicaciones_entrega,
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
            WHERE a.id_cliente = ?
            ORDER BY a.id_apartado DESC
        `;
        conexion.query(query, [idCliente], callback);
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
                a.presentacion_nombre,
                a.presentacion_factor,
                a.entrega,
                a.direccion_entrega,
                a.telefono_entrega,
                a.indicaciones_entrega,
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
            LEFT JOIN clientes c ON (c.id_cliente = a.id_cliente
                OR (a.id_cliente IS NULL AND c.nombre = a.nombre_cliente))
            ${filtro}
            ORDER BY a.id_apartado DESC
            LIMIT 2000
        `;
        // shortcut: tope fijo sin paginación en UI; paginar si crece
        conexion.query(sql, parametros, callback);
    },

    // ------------------------------------------------
    // CAMBIOS DE ESTADO
    // ------------------------------------------------

    // Cambia el estado de un apartado a "confirmado" y registra el nombre del admin que confirmó.
    // Se usa cuando el admin revisa y aprueba una reserva pendiente.
    confirmarApartado: (idApartado, nombreAdmin, callback) => {
        // Solo un pendiente pasa a confirmado (no revive cancelados ni entregados)
        const sql = "UPDATE apartados SET estado = ?, confirmado_por = ? WHERE id_apartado = ? AND estado = 'pendiente'";
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
    // Solo cancela si sigue activo: affectedRows = 0 => ya estaba cancelado/entregado
    // y NO se debe devolver stock otra vez.
    cancelarApartadoAdmin: (idApartado, callback) => {
        const sql = "UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ? AND estado IN ('pendiente', 'confirmado')";
        conexion.query(sql, ['cancelado', 'admin', idApartado], callback);
    },

    // Cancela un apartado desde el lado del cliente.
    // Usa UPDATE en vez de DELETE para que el apartado quede en el historial.
    // Registra 'cliente' como quien canceló.
    // La propiedad se valida en el controller. Solo cancela si sigue activo.
    cancelarApartadoCliente: (idApartado, callback) => {
        const sql = "UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ? AND estado IN ('pendiente', 'confirmado')";
        conexion.query(sql, ['cancelado', 'cliente', idApartado], callback);
    },

    // ------------------------------------------------
    // EXPIRACIÓN AUTOMÁTICA DE APARTADOS (OPCIONAL)
    // ------------------------------------------------

    // Busca apartados en estado 'pendiente' cuya fecha de creación ya superó el
    // tiempo de reserva configurado en la tienda (0 = no vencen).
    // Se ejecuta periódicamente para cancelar reservas que el cliente no confirmó a tiempo.
    // Devuelve id, producto, cantidad y nombre_cliente para liberar stock después.
    obtenerApartadosExpirados: (callback) => {
        if (!tiendaService.minutosExpiracion()) return callback(null, []); // 0 = no vencen
        const sql = `
            SELECT a.id_apartado, a.producto, a.cantidad, a.nombre_cliente, a.id_cliente
            FROM apartados a
            WHERE a.estado = 'pendiente'
              AND DATE_ADD(a.fecha, INTERVAL ? MINUTE) < NOW()
        `;
        conexion.query(sql, [tiendaService.minutosExpiracion()], callback);
    },

    // Cancela un apartado por expiración del sistema.
    // Solo cancela si el apartado sigue pendiente (evita doble cancelación).
    cancelarApartadoPorExpiracion: (idApartado, callback) => {
        const sql = 'UPDATE apartados SET estado = ?, cancelado_por = ? WHERE id_apartado = ? AND estado = ?';
        conexion.query(sql, ['cancelado', 'admin', idApartado, 'pendiente'], callback);
    }
};

module.exports = ApartadoModel;