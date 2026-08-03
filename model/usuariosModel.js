const conexion = require('../database/conexion');

// Modelo de usuarios para consultar clientes y autenticar sesiones
const UsuarioModel = {
    // Devuelve todos los clientes registrados
    obtenerTodos: (callback) => {
        conexion.query('SELECT * FROM clientes', callback);
    },

    // Busca un usuario por documento para el login
    login: (documento) => {
        return new Promise((resuelta, rechazada) => {
            conexion.query(
                'SELECT * FROM clientes WHERE documento = ?',
                [documento],
                (error, registros) => {
                    if (error) {
                        rechazada(error);
                    }
                    resuelta(registros);
                }
            );
        });
    }
};

module.exports = UsuarioModel;