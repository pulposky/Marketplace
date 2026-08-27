// =============================================
// MODELO DE USUARIOS
// =============================================
// Consultas SQL para autenticar usuarios.
// Tiene dos formas de login:
//   1. Por documento (clientes, tabla 'clientes')
//   2. Por usuario + password (admin/aprendiz, tabla 'usuarios')
// =============================================

const conexion = require('../database/conexion');

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

    // Login por usuario + password (lo usan admin y aprendiz)
    // Busca en la tabla 'usuarios' con las credenciales exactas
    loginPorUsuario: (usuario, password) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT * FROM usuarios WHERE usuario = ? AND password = ?',
                [usuario, password],
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
};

module.exports = UsuarioModel;
