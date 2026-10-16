// =============================================
// MODELO DE USUARIOS
// =============================================
// Consultas SQL para autenticar usuarios.
// Tiene dos formas de login:
//   1. Por documento (clientes, tabla 'clientes')
//   2. Por usuario + password (staff del panel, tabla 'usuarios')
// También trae el CRUD del personal del panel que usa
// /admin/usuarios (permiso 'usuarios').
// =============================================

const conexion = require('../database/conexion');

// Pool con Promesas para las funciones nuevas (async/await).
const pool = conexion.promise();

const UsuarioModel = {

    // Login de cliente: busca por documento en la tabla 'clientes'
    // Devuelve el registro completo (incluye la columna password)
    login: (documento) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT * FROM clientes WHERE documento = ?',
                [documento],
                (error, registros) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(registros);
                }
            );
        });
    },

    // Busca un cliente por documento para que el Administrador le restablezca la clave.
    obtenerClientePorDocumento: async (documento) => {
        const [filas] = await pool.execute(
            'SELECT id_cliente, nombre, documento FROM clientes WHERE documento = ? LIMIT 1',
            [documento]
        );
        return filas[0] || null;
    },

    // Crea o actualiza la contraseña de un cliente.
    // Recibe el hash bcrypt ya generado (nunca se guarda en texto plano).
    crearPassword: (idCliente, hashPassword) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'UPDATE clientes SET password = ? WHERE id_cliente = ?',
                [hashPassword, idCliente],
                (error, resultado) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(resultado);
                }
            );
        });
    },

    // Login por usuario + password (lo usa el staff del panel)
    // Busca solo por usuario; la comparación de password se hace
    // con bcrypt para soportar hashes (nunca texto plano en SQL).
    loginPorUsuario: (usuario) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT * FROM usuarios WHERE usuario = ?',
                [usuario],
                (error, registros) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(registros);
                }
            );
        });
    },

    // Verifica si ya existe un cliente con ese documento
    existeDocumento: (documento) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT * FROM clientes WHERE documento = ?',
                [documento],
                (error, registros) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(registros.length > 0);
                }
            );
        });
    },

    // Registra un nuevo cliente en la tabla 'clientes'
    // 'password' ya viene como hash bcrypt (nunca texto plano)
    registrar: (datos) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'INSERT INTO clientes (nombre, documento, direccion, telefono, rol, password) VALUES (?, ?, ?, ?, ?, ?)',
                [datos.nombre, datos.documento, datos.direccion, datos.telefono, datos.rol, datos.password || null],
                (error, resultado) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(resultado);
                }
            );
        });
    },

    // ------------------------------------------------
    // PERFIL DEL CLIENTE
    // ------------------------------------------------

    // Busca un cliente por su ID (para la vista de perfil)
    // En la BD real la llave se llama id_cliente; la devuelvo como 'id'
    obtenerClientePorId: (id) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT id_cliente AS id, nombre, documento, direccion, telefono, rol FROM clientes WHERE id_cliente = ?',
                [id],
                (error, registros) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(registros && registros[0]);
                }
            );
        });
    },

    // Busca un cliente por su ID incluyendo la contraseña (hash).
    // Se usa para verificar la contraseña al actualizar el perfil.
    obtenerClienteConPasswordPorId: (id) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT id_cliente AS id, nombre, documento, direccion, telefono, rol, password FROM clientes WHERE id_cliente = ?',
                [id],
                (error, registros) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(registros && registros[0]);
                }
            );
        });
    },

    // Actualiza los datos de un cliente.
    // Si cambió el nombre, actualiza también sus apartados,
    // porque la tabla apartados guarda el nombre del cliente como texto.
    actualizarCliente: (id, datos) => {
        return new Promise(async (resuelta, rechazada) => {
            try {
                const anterior = await UsuarioModel.obtenerClientePorId(id);

                conexion.query(
                    'UPDATE clientes SET nombre = ?, direccion = ?, telefono = ? WHERE id_cliente = ?',
                    [datos.nombre, datos.direccion, datos.telefono, id],
                    (error, resultado) => {
                        if (error) {
                            return rechazada(error);
                        }

                        const cambioNombre = anterior && anterior.nombre !== datos.nombre;
                        if (!cambioNombre) {
                            return resuelta(resultado);
                        }

                        conexion.query(
                            'UPDATE apartados SET nombre_cliente = ? WHERE nombre_cliente = ?',
                            [datos.nombre, anterior.nombre],
                            (errorApartados) => {
                                if (errorApartados) {
                                    return rechazada(errorApartados);
                                }
                                resuelta(resultado);
                            }
                        );
                    }
                );
            } catch (error) {
                rechazada(error);
            }
        });
    },

    // ------------------------------------------------
    // GESTIÓN DE CLIENTES (ADMIN)
    // ------------------------------------------------

    // Lista todos los clientes con su resumen de compras.
    // Si le paso una búsqueda filtra por nombre o documento.
    obtenerClientesAdmin: (busqueda, callback) => {
        let filtro = '';
        let valores = [];
        if (busqueda && busqueda.trim()) {
            filtro = 'WHERE c.nombre LIKE ? OR c.documento LIKE ?';
            const like = `%${busqueda.trim()}%`;
            valores = [like, like];
        }

        // Las compras cuentan los pedidos confirmados y entregados (ventas reales)
        const sql = `
            SELECT
                c.id_cliente AS id,
                c.nombre,
                c.documento,
                c.direccion,
                c.telefono,
                c.rol,
                COUNT(a.id_apartado) AS total_pedidos,
                SUM(CASE WHEN a.estado IN ('confirmado', 'entregado') THEN 1 ELSE 0 END) AS total_compras
            FROM clientes c
            LEFT JOIN apartados a ON a.nombre_cliente = c.nombre
            ${filtro}
            GROUP BY c.id_cliente, c.nombre, c.documento, c.direccion, c.telefono, c.rol
            ORDER BY c.nombre ASC
        `;
        conexion.query(sql, valores, callback);
    },

    // ------------------------------------------------
    // GESTIÓN DEL PERSONAL DEL PANEL (SOLO ADMIN)
    // ------------------------------------------------
    // El personal vive en la tabla 'usuarios' (compartida con el POS).
    // Columnas: id_usuario, nombre, usuario, password, rol.
    // Le agrego la columna 'activo' para poder desactivar sin borrar.

    // Asegura la columna 'activo' (se llama al arrancar el server).
    // MySQL no soporta ADD COLUMN IF NOT EXISTS, así que primero
    // pregunto a information_schema si la columna ya existe.
    asegurarEsquema: async () => {
        const [columnas] = await pool.query(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'activo'`
        );
        if (columnas.length === 0) {
            await pool.query('ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1');
        }
    },

    // Lista el personal del panel (excluye a los clientes, que están en otra tabla).
    // Si le paso una búsqueda filtra por nombre o usuario.
    listarStaff: async (busqueda) => {
        let filtro = '';
        const valores = [];
        if (busqueda && busqueda.trim()) {
            filtro = 'WHERE nombre LIKE ? OR usuario LIKE ?';
            const like = `%${busqueda.trim()}%`;
            valores.push(like, like);
        }

        const [filas] = await pool.query(
            `SELECT id_usuario AS id, nombre, usuario, rol, activo
             FROM usuarios ${filtro}
             ORDER BY nombre ASC`,
            valores
        );
        return filas;
    },

    // Trae un usuario del panel por su id.
    obtenerStaffPorId: async (id) => {
        const [filas] = await pool.query(
            'SELECT id_usuario AS id, nombre, usuario, rol, activo FROM usuarios WHERE id_usuario = ?',
            [id]
        );
        return filas && filas[0];
    },

    // ¿Ya existe ese nombre de usuario? (ignorando un id, para editar).
    existeUsuario: async (usuario, exceptoId) => {
        const [filas] = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE usuario = ? AND id_usuario <> ?',
            [String(usuario).trim(), Number(exceptoId) || 0]
        );
        return filas.length > 0;
    },

    // Crea un usuario del panel. 'password' ya viene como hash bcrypt.
    crearStaff: async (datos) => {
        const [resultado] = await pool.query(
            'INSERT INTO usuarios (nombre, usuario, password, rol, activo) VALUES (?, ?, ?, ?, 1)',
            [datos.nombre, datos.usuario, datos.password, datos.rol]
        );
        return resultado.insertId;
    },

    // Actualiza nombre, usuario y rol (no toca la contraseña).
    actualizarStaff: async (id, datos) => {
        await pool.query(
            'UPDATE usuarios SET nombre = ?, usuario = ?, rol = ? WHERE id_usuario = ?',
            [datos.nombre, datos.usuario, datos.rol, id]
        );
    },

    // Cambia la contraseña (hash bcrypt ya generado).
    actualizarPasswordStaff: async (id, hashPassword) => {
        await pool.query(
            'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
            [hashPassword, id]
        );
    },

    // Activa o desactiva un usuario del panel.
    actualizarActivoStaff: async (id, activo) => {
        await pool.query(
            'UPDATE usuarios SET activo = ? WHERE id_usuario = ?',
            [activo ? 1 : 0, id]
        );
    },

    // Cuenta cuántos administradores siguen activos (para no quedarnos sin ninguno).
    contarAdminsActivos: async () => {
        const [filas] = await pool.query(
            "SELECT COUNT(*) AS total FROM usuarios WHERE activo = 1 AND rol IN ('admin', 'Administrador')"
        );
        return filas[0] ? Number(filas[0].total) : 0;
    },
};

module.exports = UsuarioModel;
