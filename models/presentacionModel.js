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
    },

    // Presentaciones activas de varios productos en UNA consulta.
    // Devuelve Map id_producto -> [{ id, nombre, factor }] ordenado.
    listarPorProductos: async (ids) => {
        const mapa = new Map();
        const lista = [...new Set((ids || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
        if (lista.length === 0) return mapa;
        const [filas] = await pool.query(
            `SELECT id, id_producto, nombre, factor FROM producto_presentacion
             WHERE activo = 1 AND id_producto IN (?) ORDER BY id_producto, orden, id`,
            [lista]
        );
        for (const f of filas) {
            if (!mapa.has(f.id_producto)) mapa.set(f.id_producto, []);
            mapa.get(f.id_producto).push({ id: f.id, nombre: f.nombre, factor: f.factor });
        }
        return mapa;
    },

    // Agrega 'presentaciones' a cada producto de la lista (muta y devuelve la lista).
    adjuntar: async (productos) => {
        const lista = Array.isArray(productos) ? productos : [];
        const mapa = await PresentacionModel.listarPorProductos(lista.map((p) => p.id_producto));
        lista.forEach((p) => { p.presentaciones = mapa.get(Number(p.id_producto)) || []; });
        return lista;
    },

    // Presentación activa que pertenece al producto, o null.
    obtenerDeProducto: async (idProducto, idPresentacion) => {
        const [filas] = await pool.query(
            'SELECT id, nombre, factor FROM producto_presentacion WHERE id = ? AND id_producto = ? AND activo = 1',
            [idPresentacion, idProducto]
        );
        return filas[0] || null;
    },

    // Reemplaza todas las presentaciones del producto (lista ya validada).
    // Los apartados guardan copia de nombre/factor, así que borrar no pierde historial.
    reemplazarDeProducto: async (idProducto, lista) => {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query('DELETE FROM producto_presentacion WHERE id_producto = ?', [idProducto]);
            if (lista.length > 0) {
                await conn.query(
                    'INSERT INTO producto_presentacion (id_producto, nombre, factor, activo, orden) VALUES ?',
                    [lista.map((p) => [idProducto, p.nombre, p.factor, 1, p.orden])]
                );
            }
            await conn.commit();
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }
};

module.exports = PresentacionModel;
