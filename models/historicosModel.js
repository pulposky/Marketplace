// =============================================
// MODELO DE HISTÓRICOS / ESTADÍSTICAS
// =============================================
// Consultas SQL para el dashboard de analytics.
// Muestra productos más vendidos, clientes que
// más compran, pedidos por admin y visitas.
// =============================================

const conexion = require('../database/conexion');

const HistoricosModel = {

    // Productos más vendidos (solo entregados)
    productosMasVendidos: (callback) => {
        const sql = `
            SELECT 
                p.nombre AS producto,
                p.unidad,
                p.categoria,
                SUM(a.cantidad) AS total_vendido,
                COUNT(a.id_apartado) AS total_pedidos
            FROM apartados a
            JOIN producto p ON a.producto = p.id_producto
            WHERE a.estado = 'entregado'
            GROUP BY p.id_producto, p.nombre, p.unidad, p.categoria
            ORDER BY total_vendido DESC
            LIMIT 10
        `;
        conexion.query(sql, callback);
    },

    // Clientes que más compran (solo entregados)
    clientesQueMasCompran: (callback) => {
        const sql = `
            SELECT 
                a.nombre_cliente AS cliente,
                COUNT(a.id_apartado) AS total_pedidos,
                SUM(a.cantidad) AS total_unidades
            FROM apartados a
            WHERE a.estado = 'entregado'
            GROUP BY a.nombre_cliente
            ORDER BY total_pedidos DESC
            LIMIT 10
        `;
        conexion.query(sql, callback);
    },

    // Pedidos agrupados por estado (pendiente, confirmado, entregado, cancelado)
    pedidosPorEstado: (callback) => {
        const sql = `
            SELECT 
                estado,
                COUNT(*) AS total
            FROM apartados
            GROUP BY estado
        `;
        conexion.query(sql, callback);
    },

    // Ventas por día (solo entregados, últimos 30 días)
    ventasPorDia: (callback) => {
        const sql = `
            SELECT 
                DATE(fecha) AS dia,
                COUNT(*) AS total_ventas
            FROM apartados
            WHERE estado = 'entregado'
                AND fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(fecha)
            ORDER BY dia ASC
        `;
        conexion.query(sql, callback);
    },

    // Visitas por día (IPs únicas por día, últimos 30 días)
    visitasPorDia: (callback) => {
        const sql = `
            SELECT 
                DATE(fecha) AS dia,
                COUNT(DISTINCT ip) AS total_visitas
            FROM page_views
            WHERE ruta = '/'
              AND fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(fecha)
            ORDER BY dia ASC
        `;
        conexion.query(sql, callback);
    },

    // Rutas más visitadas (excluye /, admin, api, logout)
    visitasPorRuta: (callback) => {
        const sql = `
            SELECT 
                ruta,
                COUNT(*) AS total_visitas
            FROM page_views
            WHERE fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)
              AND ruta != '/'
              AND ruta NOT LIKE '/admin%'
              AND ruta NOT LIKE '/api%'
              AND ruta != '/logout'
            GROUP BY ruta
            ORDER BY total_visitas DESC
            LIMIT 10
        `;
        conexion.query(sql, callback);
    },

    // Resumen general del dashboard
    resumen: (callback) => {
        // Ventas = solo pedidos entregados (ya que los confirmados aún pueden cancelarse)
        const sqlApartados = "SELECT COUNT(*) AS total FROM apartados WHERE estado = 'entregado'";
        const sqlVisitas = "SELECT COUNT(DISTINCT ip) AS total FROM page_views WHERE ruta = '/' AND fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        const sqlClientes = "SELECT COUNT(DISTINCT nombre_cliente) AS total FROM apartados WHERE estado = 'entregado'";

        conexion.query(sqlApartados, (err1, ventas) => {
            conexion.query(sqlVisitas, (err2, visitas) => {
                conexion.query(sqlClientes, (err3, clientes) => {
                    callback(null, {
                        ventasEntregadas: (err1 || !ventas || !ventas[0]) ? 0 : ventas[0].total,
                        totalVisitas: (err2 || !visitas || !visitas[0]) ? 0 : visitas[0].total,
                        clientesCompradores: (err3 || !clientes || !clientes[0]) ? 0 : clientes[0].total
                    });
                });
            });
        });
    }
};

module.exports = HistoricosModel;

