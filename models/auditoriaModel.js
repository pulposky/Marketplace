// =============================================
// MODELO DE AUDITORÍA
// =============================================
// Única capa con SQL de la tabla 'auditoria':
// registra quién hizo qué en el panel (cambios
// de precios/ofertas, confirmaciones y
// cancelaciones de pedidos, cambios de permisos,
// gestión de usuarios, etc.).
// =============================================

const conexion = require('../database/conexion');

const pool = conexion.promise();

const AuditoriaModel = {

    // Crea la tabla si no existe.
    asegurarTabla: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS auditoria (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario VARCHAR(100) DEFAULT NULL,
                rol VARCHAR(50) DEFAULT NULL,
                accion VARCHAR(50) NOT NULL,
                detalle VARCHAR(255) DEFAULT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_auditoria_fecha (fecha)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    },

    // Inserta un registro de auditoría.
    registrar: async (datos) => {
        await pool.query(
            'INSERT INTO auditoria (usuario, rol, accion, detalle) VALUES (?, ?, ?, ?)',
            [datos.usuario, datos.rol, datos.accion, datos.detalle]
        );
    },

    // Lista registros con filtros opcionales y paginación.
    listar: async ({ busqueda, accion, limite, offset }) => {
        const condiciones = [];
        const valores = [];

        if (busqueda && busqueda.trim()) {
            condiciones.push('(usuario LIKE ? OR detalle LIKE ?)');
            const like = `%${busqueda.trim()}%`;
            valores.push(like, like);
        }
        if (accion && accion.trim()) {
            condiciones.push('accion = ?');
            valores.push(accion.trim());
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const [filas] = await pool.query(
            `SELECT id, usuario, rol, accion, detalle, fecha
             FROM auditoria ${where}
             ORDER BY fecha DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...valores, Number(limite), Number(offset)]
        );
        return filas;
    },

    // Cuenta registros con los mismos filtros (para paginar).
    contar: async ({ busqueda, accion }) => {
        const condiciones = [];
        const valores = [];

        if (busqueda && busqueda.trim()) {
            condiciones.push('(usuario LIKE ? OR detalle LIKE ?)');
            const like = `%${busqueda.trim()}%`;
            valores.push(like, like);
        }
        if (accion && accion.trim()) {
            condiciones.push('accion = ?');
            valores.push(accion.trim());
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const [filas] = await pool.query(`SELECT COUNT(*) AS total FROM auditoria ${where}`, valores);
        return filas[0] ? Number(filas[0].total) : 0;
    },

    // Acciones distintas registradas (para el filtro del frontend).
    accionesDistintas: async () => {
        const [filas] = await pool.query('SELECT DISTINCT accion FROM auditoria ORDER BY accion ASC');
        return filas.map((f) => f.accion);
    }
};

module.exports = AuditoriaModel;
