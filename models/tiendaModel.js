// =============================================
// MODELO DE CONFIGURACIÓN DE LA TIENDA
// =============================================
// Única capa con SQL de la tabla configuracion_tienda
// (una sola fila, id = 1): identidad y ajustes del
// negocio que editan los administradores.
// =============================================

const conexion = require('../database/conexion');

const pool = conexion.promise();

// Columnas editables (lista blanca para el UPDATE).
const COLUMNAS = [
    'nombre', 'eslogan', 'descripcion', 'logo_url', 'color_primario', 'color_secundario',
    'telefono', 'whatsapp', 'correo', 'direccion', 'horario', 'moneda',
    'minutos_expiracion_apartado', 'facebook', 'instagram', 'tiktok', 'productos_ocultos', 'tipo_negocio', 'apariencia'
];

const TiendaModel = {

    COLUMNAS,

    // Crea la tabla y su única fila si faltan (mismo DDL que database/schema.sql).
    asegurarTabla: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS configuracion_tienda (
                id TINYINT UNSIGNED NOT NULL DEFAULT 1 PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL DEFAULT 'Mi Tienda',
                eslogan VARCHAR(200) NOT NULL DEFAULT '',
                descripcion VARCHAR(500) NOT NULL DEFAULT '',
                logo_url VARCHAR(255) DEFAULT NULL,
                color_primario CHAR(7) NOT NULL DEFAULT '#1F7A4D',
                color_secundario CHAR(7) NOT NULL DEFAULT '#F2A33A',
                telefono VARCHAR(30) NOT NULL DEFAULT '',
                whatsapp VARCHAR(30) NOT NULL DEFAULT '',
                correo VARCHAR(120) NOT NULL DEFAULT '',
                direccion VARCHAR(200) NOT NULL DEFAULT '',
                horario VARCHAR(200) NOT NULL DEFAULT '',
                moneda CHAR(3) NOT NULL DEFAULT 'COP',
                minutos_expiracion_apartado INT NOT NULL DEFAULT 60,
                facebook VARCHAR(255) NOT NULL DEFAULT '',
                instagram VARCHAR(255) NOT NULL DEFAULT '',
                tiktok VARCHAR(255) NOT NULL DEFAULT '',
                productos_ocultos VARCHAR(500) NOT NULL DEFAULT 'COMODIN',
                tipo_negocio VARCHAR(20) NOT NULL DEFAULT 'supermercado',
                apariencia TEXT DEFAULT NULL,
                actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Tablas creadas antes de existir el tipo de negocio
        const [col] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'configuracion_tienda' AND COLUMN_NAME = 'tipo_negocio'`
        );
        if (!col.length) {
            await pool.query("ALTER TABLE configuracion_tienda ADD COLUMN tipo_negocio VARCHAR(20) NOT NULL DEFAULT 'supermercado' AFTER productos_ocultos");
        }
        // Columna de apariencia (JSON) añadida después
        const [colApar] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'configuracion_tienda' AND COLUMN_NAME = 'apariencia'`
        );
        if (!colApar.length) {
            await pool.query('ALTER TABLE configuracion_tienda ADD COLUMN apariencia TEXT DEFAULT NULL AFTER tipo_negocio');
        }
        await pool.query('INSERT IGNORE INTO configuracion_tienda (id) VALUES (1)');
    },

    // Fila de configuración (o null si la tabla está vacía).
    obtener: async () => {
        const [filas] = await pool.query('SELECT * FROM configuracion_tienda WHERE id = 1 LIMIT 1');
        return filas[0] || null;
    },

    // Guarda solo las columnas de la lista blanca que vengan en 'datos'.
    actualizar: async (datos) => {
        const columnas = COLUMNAS.filter((c) => Object.prototype.hasOwnProperty.call(datos, c));
        if (columnas.length === 0) return;
        const asignaciones = columnas.map((c) => `${c} = ?`).join(', ');
        await pool.query(
            `UPDATE configuracion_tienda SET ${asignaciones} WHERE id = 1`,
            columnas.map((c) => datos[c])
        );
    }
};

module.exports = TiendaModel;
