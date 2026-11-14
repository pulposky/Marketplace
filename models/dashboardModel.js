// =============================================
// MODELO DEL DASHBOARD DEL PANEL
// =============================================
// Consultas agregadas para la página principal del
// panel. Todas son de solo lectura. Las ventas se
// calculan como cantidad (unidad mínima) por el
// precio aplicado al apartar; si un apartado viejo
// no lo guardó, se usa el precio actual.
// =============================================

const conexion = require('../database/conexion');
const tiendaService = require('../services/tiendaService');

const pool = conexion.promise();

// Monto de un apartado en pesos
const MONTO = 'CAST(a.cantidad AS UNSIGNED) * IF(a.precio_aplicado > 0, a.precio_aplicado, p.precio)';

// Productos internos del POS que no se muestran (p. ej. COMODIN)
const ocultos = () => {
    const lista = tiendaService.productosOcultos();
    return lista.length ? lista : [''];
};

const DashboardModel = {

    // Totales de un rango [desde, hasta)
    resumen: async (desde, hasta) => {
        const [filas] = await pool.query(`
            SELECT
                COUNT(*) AS apartados,
                COALESCE(SUM(a.estado = 'entregado'), 0) AS entregados,
                COALESCE(SUM(a.estado = 'cancelado'), 0) AS cancelados,
                COALESCE(SUM(CASE WHEN a.estado = 'entregado' THEN ${MONTO} END), 0) AS ventas,
                COUNT(DISTINCT CASE WHEN a.estado = 'entregado' THEN a.id_cliente END) AS clientes
            FROM apartados a
            LEFT JOIN producto p ON p.id_producto = a.producto
            WHERE a.fecha >= ? AND a.fecha < ?`, [desde, hasta]);
        return filas[0];
    },

    // Ventas entregadas y apartados creados por día desde 'desde'
    porDia: async (desde) => {
        const [filas] = await pool.query(`
            SELECT DATE_FORMAT(a.fecha, '%Y-%m-%d') AS dia,
                   COALESCE(SUM(CASE WHEN a.estado = 'entregado' THEN ${MONTO} END), 0) AS ventas,
                   COUNT(*) AS apartados
            FROM apartados a
            LEFT JOIN producto p ON p.id_producto = a.producto
            WHERE a.fecha >= ?
            GROUP BY dia`, [desde]);
        return filas;
    },

    // Apartados del período por estado
    porEstado: async (desde) => {
        const [filas] = await pool.query(
            'SELECT estado, COUNT(*) AS total FROM apartados WHERE fecha >= ? GROUP BY estado', [desde]);
        return filas;
    },

    // Productos con más ventas entregadas
    topProductos: async (desde, limite = 6) => {
        const [filas] = await pool.query(`
            SELECT p.nombre, p.unidad, SUM(${MONTO}) AS ventas, SUM(CAST(a.cantidad AS UNSIGNED)) AS unidades
            FROM apartados a
            JOIN producto p ON p.id_producto = a.producto
            WHERE a.estado = 'entregado' AND a.fecha >= ?
            GROUP BY p.id_producto, p.nombre, p.unidad
            ORDER BY ventas DESC
            LIMIT ?`, [desde, limite]);
        return filas;
    },

    // Ventas entregadas por categoría
    porCategoria: async (desde) => {
        const [filas] = await pool.query(`
            SELECT COALESCE(NULLIF(TRIM(p.categoria), ''), 'Sin categoría') AS categoria, SUM(${MONTO}) AS ventas
            FROM apartados a
            JOIN producto p ON p.id_producto = a.producto
            WHERE a.estado = 'entregado' AND a.fecha >= ?
            GROUP BY categoria
            ORDER BY ventas DESC`, [desde]);
        return filas;
    },

    // Apartados creados por hora del día
    porHora: async (desde) => {
        const [filas] = await pool.query(
            'SELECT HOUR(fecha) AS hora, COUNT(*) AS total FROM apartados WHERE fecha >= ? GROUP BY hora', [desde]);
        return filas;
    },

    // Visitantes únicos por día en la tienda pública
    visitasPorDia: async (desde) => {
        const [filas] = await pool.query(`
            SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS dia, COUNT(DISTINCT ip) AS visitas
            FROM page_views
            WHERE fecha >= ? AND ruta NOT LIKE '/admin%' AND ruta NOT LIKE '/api%'
            GROUP BY dia`, [desde]);
        return filas;
    },

    // Lo que necesita acción ahora: pendientes, por vencer y stock
    pendientes: async (minutosExpiracion) => {
        const [filas] = await pool.query(`
            SELECT
                COUNT(*) AS pendientes,
                COALESCE(SUM(fecha <= DATE_SUB(NOW(), INTERVAL ? MINUTE)), 0) AS porVencer
            FROM apartados WHERE estado = 'pendiente'`, [Math.max(0, minutosExpiracion - 15)]);
        return filas[0];
    },

    stockBajo: async (umbral = 10, limite = 6) => {
        const [agotados] = await pool.query(
            "SELECT COUNT(*) AS total FROM producto WHERE estado = 'activo' AND limite_venta <= 0 AND nombre NOT IN (?)",
            [ocultos()]);
        const [lista] = await pool.query(`
            SELECT id_producto, nombre, unidad, limite_venta
            FROM producto
            WHERE estado = 'activo' AND limite_venta <= ? AND nombre NOT IN (?)
            ORDER BY limite_venta ASC, nombre ASC
            LIMIT ?`, [umbral, ocultos(), limite]);
        return { agotados: agotados[0].total, lista };
    },

    ultimosApartados: async (limite = 6) => {
        const [filas] = await pool.query(`
            SELECT a.id_apartado, a.nombre_cliente, a.estado, a.fecha, a.cantidad,
                   a.presentacion_nombre, a.presentacion_factor, p.nombre AS producto, p.unidad,
                   ${MONTO} AS total
            FROM apartados a
            LEFT JOIN producto p ON p.id_producto = a.producto
            ORDER BY a.fecha DESC
            LIMIT ?`, [limite]);
        return filas;
    },
};

module.exports = DashboardModel;
