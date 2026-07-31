const conexion = require('../database/conexion');

const ProductoModel = {
    obtenerTodos: (callback) => {
        conexion.query("SELECT * FROM producto WHERE nombre != 'COMODIN' AND precio > 0 ORDER BY nombre ASC", callback);
    },
    obtenerDestacados: (callback) => {
    const sql = `
        SELECT nombre, unidad, lugar, precio
        FROM producto
        WHERE nombre IN (
            'PLATANO HARTON 1A',
            'PLATANO HARTON 2A',
            'HUEVOS DE GALLINA AA',
            'HUEVOS DE GALLINA AAA'
        )
        AND unidad <> '25 KG' AND precio <> 0
    `;
    conexion.query(sql, callback);
}
};

module.exports = ProductoModel;