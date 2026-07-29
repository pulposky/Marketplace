const UsuarioModel = require('../model/usuariosModel');


// controlador para login de usuarios

const loginUsuarioController = async(req,res)=>{

    // console.log(req.body);

    let usuario = req.body.usuario
    let password = req.body.password

    // validar campos vacios

    if(!usuario || !password){
        return res.json({
            ok:false,
            tipo:'vacio',
            mensaje:'Complete todos los campos'
        });
    }

    const resultado = await UsuarioModel.login(usuario)
        
    if(resultado.length === 0){
        return res.json({
            ok:false,
            tipo:'incorrecto',
            mensaje:'El usuario no existe'
        });
    }

        const usuarioBD = resultado[0]
        // validar contraseña
        // console.log("Usuario BD:", usuarioBD);
        // console.log("Password BD:", usuarioBD.password);
        // console.log("Password recibido:", password);

        if(usuarioBD.password !== password){
            return res.json({
                ok:false,
                tipo:'incorrecto',
                mensaje:'Contraseña incorrecta'
            });

        }
        return res.json({
            ok:true,
            mensaje:'Login correcto'
        });

}

module.exports = {
    loginUsuarioController
}