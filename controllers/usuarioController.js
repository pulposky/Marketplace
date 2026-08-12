const UsuarioModel = require('../model/usuariosModel');

// Controladores para la gestión de usuario y sesión del marketplace.

const loginUsuarioController = async (req, res) => {
    // Recibe los datos enviados desde el formulario de login
    const { documento, usuario, password } = req.body;

    // Si se intentó login como 'usuario' (campo usuario + password)
    if (usuario) {
        if (!password) {
            return res.json({ ok: false, tipo: 'vacio', mensaje: 'El campo password no puede estar vacío' });
        }

        try {
            const registros = await UsuarioModel.loginPorUsuario(usuario, password);
            if (!registros || registros.length === 0) {
                return res.json({ ok: false, tipo: 'incorrecto', mensaje: 'Usuario o contraseña incorrectos' });
            }

            const usuarioBD = registros[0];
            // Determinar rol con campos comunes de la tabla usuarios
            let role = 'usuario';
            const roleCampo = usuarioBD.role ? String(usuarioBD.role).trim().toLowerCase() : '';
            const rolAlternativo = usuarioBD.rol ? String(usuarioBD.rol).trim().toLowerCase() : '';
            const roleValue = roleCampo || rolAlternativo;

            if (['admin', 'administrator'].includes(roleValue)) role = 'admin';
            if (['aprendiz', 'apprentice'].includes(roleValue)) role = 'aprendiz';
            if (usuarioBD.is_admin === 1 || usuarioBD.is_admin === '1') role = 'admin';

            req.session.usuario = {
                id: usuarioBD.id,
                usuario: usuarioBD.usuario,
                nombre: usuarioBD.nombre || usuarioBD.usuario,
                role
            };

            // Si es admin o aprendiz, redirigir al área admin
            if (role === 'admin' || role === 'aprendiz') {
                return res.json({ ok: true, mensaje: 'Login correcto', redirect: '/admin' });
            }

            return res.json({ ok: true, mensaje: 'Login correcto' });
        } catch (err) {
            console.error('Error en login por usuario:', err);
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
        }
    }

    // Si no es 'usuario', intentamos login como cliente por documento
    if (!documento) {
        return res.json({ ok: false, tipo: 'vacio', mensaje: 'El campo documento no puede estar vacío' });
    }

    try {
        const resultado = await UsuarioModel.login(documento);

        if (resultado.length === 0) {
            return res.json({ ok: false, tipo: 'incorrecto', mensaje: 'El cliente no existe' });
        }

        const clienteBD = resultado[0];
        req.session.usuario = {
            id: clienteBD.id,
            documento: clienteBD.documento,
            nombre: clienteBD.nombre,
            role: 'cliente'
        };

        return res.json({ ok: true, mensaje: 'Login correcto' });
    } catch (error) {
        console.error('Error en loginUsuarioController:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
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