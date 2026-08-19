// =============================================
// CONTROLADOR DE USUARIOS
// =============================================
// Maneja el login y logout de usuarios.
// Soporta dos tipos de login:
//   1. Por usuario + password (admin/aprendiz)
//   2. Por documento (clientes)
// La sesión se guarda en req.session y el rol
// se determina buscando en la BD.
// =============================================

const UsuarioModel = require('../model/usuariosModel');

const loginUsuarioController = async (req, res) => {
    // Extraigo los campos del body, puede venir usuario+password o solo documento
    const { documento, usuario, password } = req.body;

    // ----- LOGIN POR USUARIO (admin / aprendiz) -----
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

            // Determino el rol: primero miro la columna 'role', luego 'rol', y también 'is_admin'
            let role = 'usuario';
            const roleCampo = usuarioBD.role ? String(usuarioBD.role).trim().toLowerCase() : '';
            const rolAlternativo = usuarioBD.rol ? String(usuarioBD.rol).trim().toLowerCase() : '';
            const roleValue = roleCampo || rolAlternativo;

            if (['admin', 'administrator'].includes(roleValue)) role = 'admin';
            if (['aprendiz', 'apprentice'].includes(roleValue)) role = 'aprendiz';
            if (usuarioBD.is_admin === 1 || usuarioBD.is_admin === '1') role = 'admin';

            // Guardo los datos del usuario en la sesión
            req.session.usuario = {
                id: usuarioBD.id,
                usuario: usuarioBD.usuario,
                nombre: usuarioBD.nombre || usuarioBD.usuario,
                role
            };

            // Si es admin o aprendiz, le digo al frontend que redirija al panel admin
            if (role === 'admin' || role === 'aprendiz') {
                return res.json({ ok: true, mensaje: 'Login correcto', redirect: '/admin' });
            }

            return res.json({ ok: true, mensaje: 'Login correcto' });
        } catch (err) {
            console.error('Error en login por usuario:', err);
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
        }
    }

    // ----- LOGIN POR DOCUMENTO (clientes) -----
    if (!documento) {
        return res.json({ ok: false, tipo: 'vacio', mensaje: 'El campo documento no puede estar vacío' });
    }

    try {
        const resultado = await UsuarioModel.login(documento);

        if (resultado.length === 0) {
            return res.json({ ok: false, tipo: 'incorrecto', mensaje: 'El cliente no existe' });
        }

        const clienteBD = resultado[0];
        // Guardo los datos del cliente en la sesión con rol de cliente
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

// Cierra la sesión y limpia la cookie
const logoutUsuarioController = (req, res) => {
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
