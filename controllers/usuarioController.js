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
        // (en la BD la llave es id_cliente; uso ?? por si cambia el nombre)
        req.session.usuario = {
            id: clienteBD.id_cliente ?? clienteBD.id,
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

// Registro de nuevo usuario/cliente
const registroUsuarioController = async (req, res) => {
    const { nombre, documento, direccion, telefono, rol } = req.body;

    // Validar que todos los campos vengan
    if (!nombre || !documento || !direccion || !telefono || !rol) {
        return res.json({ ok: false, mensaje: 'Todos los campos son obligatorios' });
    }

    // Lista de roles válidos
    const rolesValidos = ['aprendiz', 'instructor', 'contratista', 'externo', 'administrativo'];
    if (!rolesValidos.includes(rol)) {
        return res.json({ ok: false, mensaje: 'Rol no válido' });
    }

    try {
        // Verificar si ya existe un cliente con ese documento
        const yaExiste = await UsuarioModel.existeDocumento(documento);
        if (yaExiste) {
            return res.json({ ok: false, mensaje: 'Ya existe un usuario con ese documento' });
        }

        // Insertar el nuevo registro
        await UsuarioModel.registrar({ nombre, documento, direccion, telefono, rol });

        return res.json({ ok: true, mensaje: 'Registro exitoso. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error en registroUsuarioController:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};

// Actualiza el perfil del cliente que está en sesión
// Solo permite cambiar nombre, dirección y teléfono
// (el documento no se puede modificar)
const actualizarPerfilController = async (req, res) => {
    if (!req.session || !req.session.usuario) {
        return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión.' });
    }

    // El perfil editable es solo para clientes;
    // admin y aprendiz no tienen esta vista
    const rolSesion = String(req.session.usuario.role || '').trim().toLowerCase();
    if (rolSesion === 'admin' || rolSesion === 'aprendiz') {
        return res.status(403).json({ ok: false, mensaje: 'Los administradores no tienen perfil de cliente.' });
    }

    const { nombre, direccion, telefono } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.json({ ok: false, mensaje: 'El nombre no puede estar vacío' });
    }
    if (!telefono || !String(telefono).trim()) {
        return res.json({ ok: false, mensaje: 'El teléfono no puede estar vacío' });
    }

    try {
        await UsuarioModel.actualizarCliente(req.session.usuario.id, {
            nombre: String(nombre).trim(),
            direccion: String(direccion || '').trim(),
            telefono: String(telefono).trim()
        });

        // Actualizo la sesión para que el resto del sitio
        // muestre el nuevo nombre de una vez
        req.session.usuario.nombre = String(nombre).trim();

        return res.json({ ok: true, mensaje: 'Perfil actualizado correctamente.' });
    } catch (error) {
        console.error('Error en actualizarPerfilController:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};

// Actualiza un cliente desde el panel admin
// Sirve para la vista de gestión de clientes
const actualizarClienteAdminController = async (req, res) => {
    // Validación de rol: solo admin o aprendiz pueden editar clientes.
    // Lo reviso acá porque las APIs de admin solo piden sesión activa.
    const rolSesion = String(req.session?.usuario?.role || '').trim().toLowerCase();
    if (rolSesion !== 'admin' && rolSesion !== 'aprendiz') {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para gestionar clientes.' });
    }

    const { id } = req.params;
    const { nombre, direccion, telefono } = req.body;

    if (!id) {
        return res.status(400).json({ ok: false, mensaje: 'Falta el ID del cliente.' });
    }
    if (!nombre || !nombre.trim()) {
        return res.json({ ok: false, mensaje: 'El nombre no puede estar vacío' });
    }

    try {
        await UsuarioModel.actualizarCliente(id, {
            nombre: String(nombre).trim(),
            direccion: String(direccion || '').trim(),
            telefono: String(telefono || '').trim()
        });

        return res.json({ ok: true, mensaje: 'Cliente actualizado correctamente.' });
    } catch (error) {
        console.error('Error en actualizarClienteAdminController:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};

module.exports = {
    loginUsuarioController,
    logoutUsuarioController,
    registroUsuarioController,
    actualizarPerfilController,
    actualizarClienteAdminController
};
