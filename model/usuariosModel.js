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

    // Trae todos los clientes registrados (no se usa mucho, pero está por si acaso)
    obtenerTodos: (callback) => {
        conexion.query('SELECT * FROM clientes', callback);
    },

    // Login de cliente: busca por documento en la tabla 'clientes'
    // No pide password, solo verifica que exista
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

    // Login por documento + password (de la tabla 'usuarios')
    // Este método no se usa actualmente, pero queda por si acaso
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
    }
};

module.exports = UsuarioModel;
