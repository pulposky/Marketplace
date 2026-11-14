// =============================================
// MODELO DE PRESENTACIONES DE PRODUCTO
// =============================================
// SQL de la tabla producto_presentacion: formas de
// venta de un producto (ej. "Caja" = 12 unidades).
// El stock se guarda siempre en la unidad mínima
// (producto.limite_venta); 'factor' indica cuántas
// unidades mínimas trae cada presentación.
// =============================================

const conexion = require('../database/conexion');

const pool = conexion.promise();

const PresentacionModel = {

    // Crea la tabla si falta (mismo DDL que database/schema.sql).
    asegurarTabla: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS producto_presentacion (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_producto INT NOT NULL,
                nombre VARCHAR(50) NOT NULL,
                factor INT NOT NULL,
                activo TINYINT(1) NOT NULL DEFAULT 1,
                orden INT NOT NULL DEFAULT 0,
                KEY idx_presentacion_producto (id_producto),
                CONSTRAINT fk_presentacion_producto FOREIGN KEY (id_producto)
                    REFERENCES producto (id_producto) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT chk_presentacion_factor CHECK (factor > 0)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    }
};

module.exports = PresentacionModel;
