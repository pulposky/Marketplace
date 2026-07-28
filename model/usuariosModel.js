const conexion = require('../database/conexion');

const UsuarioModel = {
    obtenerTodos: (callback) => {
        conexion.query('SELECT * FROM usuarios', callback);
    },

    login: (usuario) => {
        return new Promise((resuelta, rechazada)=>{
            conexion.query(
                'SELECT * FROM usuarios WHERE usuario = ?',
                [usuario],
                (error, registros)=>{
                    if(error){
                        rechazada(error)
                    }
                    resuelta(registros)
                }
            )
        })
    }
};

module.exports = UsuarioModel;