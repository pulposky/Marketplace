const conexion = require('../database/conexion');

const UsuarioModel = {
    obtenerTodos: (callback) => {
        conexion.query('SELECT * FROM clientes', callback);
    },

    login: (documento) => {
        return new Promise((resuelta, rechazada)=>{
            conexion.query(
                'SELECT * FROM clientes WHERE documento = ?',
                [documento],
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