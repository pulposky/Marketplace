const UsuarioModel = require('../model/usuariosModel');

// Controladores para la gestión de usuario y sesión

const loginUsuarioController = async (req, res) => {
    // Recibe los datos enviados desde el formulario de login
    const documento = req.body.documento;

    if (!documento) {
        return res.json({
            ok: false,
            tipo: 'vacio',
            mensaje: 'El campo documento no puede estar vacío'
        });
    }

    const resultado = await UsuarioModel.login(documento);

    if (resultado.length === 0) {
        return res.json({
            ok: false,
            tipo: 'incorrecto',
            mensaje: 'El usuario no existe'
        });
    }

    const usuarioBD = resultado[0];

    // Guarda los datos del usuario en la sesión
    req.session.usuario = {
        id: usuarioBD.id,
        documento: usuarioBD.documento,
        nombre: usuarioBD.nombre
    };

    return res.json({
        ok: true,
        mensaje: 'Login correcto'
    });
};

const logoutUsuarioController = (req, res) => {
    // Destruye la sesión y limpia la cookie del navegador
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
};

module.exports = {
    loginUsuarioController,
    logoutUsuarioController
};