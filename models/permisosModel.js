// =============================================
// MODELO DE PERMISOS POR ROL
// =============================================
// Única capa con SQL de la tabla 'permisos_rol':
// guarda qué permisos (módulos del panel) tiene
// cada rol. Solo se guardan los roles gestionables;
// el Administrador (superadmin) no se almacena.
//
// Uso el pool con Promesas (conexion.promise()),
// igual que usuarioModel, para trabajar con async/await.
// =============================================

const conexion = require('../database/conexion');
const {
    ROLES_GESTIONABLES,
    CLAVES_PERMISO,
    permisosPorDefectoDe
} = require('../utils/permisos');

const pool = conexion.promise();
const PERMISOS_OBSOLETOS = ['configuracion', 'contenido', 'banners'];

const PermisosModel = {

    // Crea la tabla si todavía no existe (así no hay que correr
    // SQL a mano). Guarda una fila por cada combinación rol+permiso.
    asegurarTabla: async () => {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS permisos_rol (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rol VARCHAR(50) NOT NULL,
                permiso VARCHAR(50) NOT NULL,
                permitido TINYINT(1) NOT NULL DEFAULT 0,
                UNIQUE KEY uk_rol_permiso (rol, permiso)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
    },

    // Elimino filas que quedaron de módulos retirados del catálogo.
    eliminarPermisosObsoletos: async () => {
        const marcadores = PERMISOS_OBSOLETOS.map(() => '?').join(', ');
        await pool.query(
            `DELETE FROM permisos_rol WHERE permiso IN (${marcadores})`,
            PERMISOS_OBSOLETOS
        );
    },

    // Siembra las combinaciones que falten con su valor por defecto.
    // Uso INSERT IGNORE para NO pisar lo que el Administrador ya guardó
    // (solo rellena filas nuevas, p. ej. un permiso recién agregado).
    sembrarPorDefecto: async () => {
        const filas = [];
        ROLES_GESTIONABLES.forEach((rol) => {
            const permitidos = permisosPorDefectoDe(rol);
            CLAVES_PERMISO.forEach((clave) => {
                filas.push([rol, clave, permitidos.includes(clave) ? 1 : 0]);
            });
        });

        if (filas.length === 0) return;
        await pool.query(
            'INSERT IGNORE INTO permisos_rol (rol, permiso, permitido) VALUES ?',
            [filas]
        );
    },

    // Todas las filas de la tabla (para cargar la caché en memoria).
    obtenerTodas: async () => {
        const [filas] = await pool.query(
            'SELECT rol, permiso, permitido FROM permisos_rol'
        );
        return filas;
    },

    // Guarda los permisos de un rol (inserta o actualiza cada combinación).
    guardarRol: async (rol, mapaPermitidos) => {
        const filas = CLAVES_PERMISO.map((clave) => [
            rol, clave, mapaPermitidos[clave] ? 1 : 0
        ]);

        await pool.query(
            `INSERT INTO permisos_rol (rol, permiso, permitido) VALUES ?
             ON DUPLICATE KEY UPDATE permitido = VALUES(permitido)`,
            [filas]
        );
    }
};

module.exports = PermisosModel;
