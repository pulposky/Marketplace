// =============================================
// MODELO DE CONTACTO PARA RECUPERACION
// =============================================
// Guardo el telefono que se muestra a los clientes
// cuando solicitan ayuda para recuperar su cuenta.
// =============================================

const conexion = require('../database/conexion');
const pool = conexion.promise();

const RecuperacionModel = {
    // Aseguro la tabla y su única fila de configuración.
    asegurarTabla: async () => {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS contacto_recuperacion (
                id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
                telefono VARCHAR(30) NOT NULL DEFAULT '',
                actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        await pool.execute(
            'INSERT IGNORE INTO contacto_recuperacion (id, telefono) VALUES (1, ?)',
            ['']
        );
    },

    // Leo el número público de contacto para recuperación.
    obtenerTelefono: async () => {
        await RecuperacionModel.asegurarTabla();
        const [filas] = await pool.execute(
            'SELECT telefono FROM contacto_recuperacion WHERE id = 1 LIMIT 1'
        );
        return filas[0]?.telefono || '';
    },

    // Guardo el número que el Administrador configura desde el panel.
    guardarTelefono: async (telefono) => {
        await RecuperacionModel.asegurarTabla();
        await pool.execute(
            'UPDATE contacto_recuperacion SET telefono = ? WHERE id = 1',
            [telefono]
        );
    }
};

module.exports = RecuperacionModel;
