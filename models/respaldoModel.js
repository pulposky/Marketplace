// =============================================
// MODELO DE RESPALDO / EXPORTACIÓN
// =============================================
// Única capa con SQL del módulo de respaldo. Expone
// lecturas de solo lectura sobre un conjunto FIJO de
// tablas (lista blanca). Por seguridad NO exporto las
// contraseñas (hash) de usuarios ni clientes.
// Uso el pool con Promesas (async/await).
// =============================================

const conexion = require('../database/conexion');

const pool = conexion.promise();

// Tablas exportables. 'clave' es lo que va en la URL.
// Cada SELECT lista sus columnas a mano: así nunca sale el
// hash de la contraseña y el respaldo queda predecible.
const TABLAS = [
    {
        clave: 'productos',
        etiqueta: 'Productos',
        sql: `SELECT id_producto, codigo, nombre, unidad, lugar, precio, categoria,
                     stock, limite_venta, estado, descripcion, descuento,
                     fecha_inicio_oferta, fecha_fin_oferta
              FROM producto ORDER BY id_producto`
    },
    {
        clave: 'apartados',
        etiqueta: 'Apartados / pedidos',
        sql: `SELECT id_apartado, nombre_cliente, producto, cantidad, precio_aplicado,
                     estado, cancelado_por, confirmado_por, fecha
              FROM apartados ORDER BY id_apartado`
    },
    {
        clave: 'clientes',
        etiqueta: 'Clientes (sin contraseña)',
        sql: `SELECT id_cliente, nombre, documento, direccion, telefono, rol
              FROM clientes ORDER BY id_cliente`
    },
    {
        clave: 'usuarios',
        etiqueta: 'Usuarios del panel (sin contraseña)',
        sql: `SELECT id_usuario, nombre, usuario, rol, activo
              FROM usuarios ORDER BY id_usuario`
    }
];

// Metadatos de las tablas exportables (para la pantalla y las rutas).
const listarTablas = () => TABLAS.map((t) => ({ clave: t.clave, etiqueta: t.etiqueta }));

// ¿La clave corresponde a una tabla permitida?
const buscarTabla = (clave) => TABLAS.find((t) => t.clave === String(clave || '').trim().toLowerCase()) || null;

const RespaldoModel = {

    listarTablas,

    buscarTabla,

    // Filas de una tabla permitida (por su clave).
    obtenerFilas: async (clave) => {
        const tabla = buscarTabla(clave);
        if (!tabla) throw new Error('Tabla no permitida.');
        const [filas] = await pool.query(tabla.sql);
        return filas;
    },

    // Respaldo completo: { productos: [...], apartados: [...], ... }.
    // Cada tabla va dentro de su try para que una que falte no rompa todo.
    obtenerTodo: async () => {
        const resultado = {};
        for (const tabla of TABLAS) {
            try {
                const [filas] = await pool.query(tabla.sql);
                resultado[tabla.clave] = filas;
            } catch (error) {
                console.error(`[Respaldo] No se pudo exportar "${tabla.clave}":`, error.message);
                resultado[tabla.clave] = [];
            }
        }
        return resultado;
    }
};

module.exports = RespaldoModel;
