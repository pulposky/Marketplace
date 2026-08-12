const conexion = require('../database/conexion');

// Modelo de usuarios para consultar clientes y autenticar sesiones.
const UsuarioModel = {
    // Devuelve todos los clientes registrados
    obtenerTodos: (callback) => {
        conexion.query('SELECT * FROM clientes', callback);
    },

    // Busca un cliente por documento
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

    // Verifica credenciales en la tabla 'usuarios' usando documento + password
    loginContrasena: (documento, password) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT * FROM usuarios WHERE documento = ? AND password = ?',
                [documento, password],
                (error, registros) => {
                    if (error) {
                        return rechazada(error);
                    }
                    resuelta(registros);
                }
            );
        });
    }
,

    // Verifica credenciales en la tabla 'usuarios' usando usuario + password
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
    }
};

module.exports = UsuarioModel;