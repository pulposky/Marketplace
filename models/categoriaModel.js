// =============================================
// MODELO DE CATEGORÍAS
// =============================================
// Única capa con SQL de la tabla 'categorias':
// lista canónica de categorías de productos.
// La web guarda la categoría como texto en
// producto.categoria; esta tabla permite
// administrarlas y renombrarlas en bloque.
// =============================================

const conexion = require('../database/conexion');

const pool = conexion.promise();

const CategoriaModel = {

    // Crea la tabla si no existe.
    asegurarTabla: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                UNIQUE KEY uk_categoria_nombre (nombre)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    },

    // Siembra la tabla con las categorías que ya usan los productos.
    sembrarDesdeProductos: async () => {
        await pool.query(`
            INSERT IGNORE INTO categorias (nombre)
            SELECT DISTINCT TRIM(categoria)
            FROM producto
            WHERE categoria IS NOT NULL AND TRIM(categoria) <> ''
        `);
    },

    // Lista las categorías con cuántos productos usan cada una.
    // Calculo los conteos en una consulta aparte (por producto) y los
    // cruzo en JS para no comparar columnas de distinta colación.
    listar: async () => {
        const [categorias] = await pool.query(
            'SELECT id, nombre FROM categorias ORDER BY nombre ASC'
        );

        const [conteos] = await pool.query(
            `SELECT TRIM(categoria) AS nombre, COUNT(*) AS total
             FROM producto
             WHERE categoria IS NOT NULL AND TRIM(categoria) <> ''
             GROUP BY TRIM(categoria)`
        );

        const mapa = new Map(conteos.map((c) => [String(c.nombre), Number(c.total)]));

        return categorias.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            total_productos: mapa.get(String(c.nombre)) || 0
        }));
    },

    // ¿Ya existe una categoría con ese nombre? (ignora mayúsculas/tildes exactas)
    existeNombre: async (nombre, exceptoId) => {
        const [filas] = await pool.query(
            'SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(?) AND id <> ?',
            [String(nombre).trim(), Number(exceptoId) || 0]
        );
        return filas.length > 0;
    },

    // Crea una categoría.
    crear: async (nombre) => {
        const [resultado] = await pool.query(
            'INSERT INTO categorias (nombre) VALUES (?)',
            [String(nombre).trim()]
        );
        return resultado.insertId;
    },

    // Renombra una categoría y actualiza los productos que la usaban.
    renombrar: async (id, nuevoNombre) => {
        const [filas] = await pool.query('SELECT nombre FROM categorias WHERE id = ?', [id]);
        if (!filas.length) return null;

        const anterior = filas[0].nombre;
        await pool.query('UPDATE categorias SET nombre = ? WHERE id = ?', [String(nuevoNombre).trim(), id]);
        await pool.query('UPDATE producto SET categoria = ? WHERE categoria = ?', [String(nuevoNombre).trim(), anterior]);
        return anterior;
    },

    // Cuántos productos usan una categoría.
    contarProductos: async (nombre) => {
        const [filas] = await pool.query(
            'SELECT COUNT(*) AS total FROM producto WHERE categoria = ?',
            [nombre]
        );
        return filas[0] ? Number(filas[0].total) : 0;
    },

    // Elimina una categoría (solo si no tiene productos asignados).
    eliminar: async (id) => {
        const [filas] = await pool.query('SELECT nombre FROM categorias WHERE id = ?', [id]);
        if (!filas.length) return { eliminada: false, motivo: 'noexiste' };

        const nombre = filas[0].nombre;
        const enUso = await CategoriaModel.contarProductos(nombre);
        if (enUso > 0) {
            return { eliminada: false, motivo: 'enuso', total: enUso };
        }

        await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
        return { eliminada: true, nombre };
    }
};

module.exports = CategoriaModel;
