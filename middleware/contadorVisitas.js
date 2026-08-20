// =============================================
// MIDDLEWARE: CONTADOR DE VISITAS
// =============================================
// Registra cada petición GET en la tabla
// page_views para poder mostrar estadísticas
// de tráfico en el dashboard de históricos.
// Solo registra rutas de páginas HTML (no API).
// =============================================

const conexion = require('../database/conexion');

const contarVisita = (req, res, next) => {
    const rol = req.session?.usuario?.role ? String(req.session.usuario.role).trim().toLowerCase() : '';

    // No registro visitas de admin ni aprendiz
    if (rol === 'admin' || rol === 'aprendiz') {
        return next();
    }

    // Solo registro peticiones GET de páginas (no APIs, no assets estáticos)
    if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.includes('.')) {
        const ruta = req.path;
        const usuario = req.session?.usuario?.nombre || req.session?.usuario?.usuario || null;
        const ip = req.ip || req.connection?.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        const sql = 'INSERT INTO page_views (ruta, usuario, ip, user_agent) VALUES (?, ?, ?, ?)';
        conexion.query(sql, [ruta, usuario, ip, userAgent], () => {
            // No bloqueo la petición si falla el insert
        });

        // Limpio registros de más de 30 días
        conexion.query('DELETE FROM page_views WHERE fecha < DATE_SUB(NOW(), INTERVAL 30 DAY)', () => {});
    }
    next();
};

module.exports = contarVisita;
