const UsuarioModel = require('../model/usuariosModel');


// controlador para login de usuarios

const loginUsuarioController = async(req,res)=>{

    // console.log(req.body);

    const documento = req.body.documento;

    if(!documento){
        return res.json({
            ok:false,
            tipo:'vacio',
            mensaje:'El campo documento no puede estar vacío'
        });
    }

    const resultado = await UsuarioModel.login(documento);
        
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
    
    req.session.usuario = {
        id: usuarioBD.id,
        documento: usuarioBD.documento,
        nombre: usuarioBD.nombre
    };  

    return res.json({
        ok:true,
        mensaje:'Login correcto'
    });

}

const logoutUsuarioController = (req, res) => {

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Error al cerrar sesión");
        }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });

};

module.exports = {
    loginUsuarioController,
    logoutUsuarioController
}