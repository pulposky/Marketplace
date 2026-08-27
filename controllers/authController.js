// =============================================
// CONTROLADOR DE AUTENTICACIÓN
// =============================================
// Maneja el login y logout de usuarios.
// Soporta dos tipos de login:
//   1. Por usuario + password (admin/aprendiz)
//   2. Por documento (clientes)
// La sesión se guarda en req.session y el rol
// se determina buscando en la BD.
// =============================================

const bcrypt = require('bcryptjs');
const UsuarioModel = require('../models/usuarioModel');

const loginUsuarioController = async (req, res) => {
    // Extraigo los campos del body, puede venir usuario+password o solo documento
    const { documento, usuario, password, nuevaPassword } = req.body;

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
        // Busco el cliente por su documento (incluye la columna password)
        const resultado = await UsuarioModel.login(documento);

        if (resultado.length === 0) {
            return res.json({ ok: false, tipo: 'incorrecto', mensaje: 'El cliente no existe' });
        }

        const clienteBD = resultado[0];
        const tienePassword = !!clienteBD.password && String(clienteBD.password).trim() !== '';

        // ----- PASO 0: CREAR CONTRASEÑA -----
        // El cliente no tiene contraseña y está definiendo una nueva.
        if (nuevaPassword) {
            if (!String(nuevaPassword).trim()) {
                return res.json({ ok: false, tipo: 'vacio', mensaje: 'La contraseña no puede estar vacía' });
            }
            if (String(nuevaPassword).length < 6) {
                return res.json({ ok: false, tipo: 'vacio', mensaje: 'La contraseña debe tener al menos 6 caracteres' });
            }

            // Genero el hash y lo guardo (nunca el texto plano)
            const hash = await bcrypt.hash(String(nuevaPassword), 10);
            await UsuarioModel.crearPassword(clienteBD.id_cliente ?? clienteBD.id, hash);

            return res.json({
                ok: false,
                tipo: 'exito',
                passwordCreada: true,
                documento,
                mensaje: 'Contraseña creada correctamente. Ahora inicia sesión con tu documento y contraseña.'
            });
        }

        // ----- PASO 1: SOLO DOCUMENTO -----
        // El cliente aún no envió contraseña: verifico si ya tiene una.
        if (password === undefined || password === null || password === '') {
            if (!tienePassword) {
                // No tiene contraseña: le pido que cree una
                return res.json({
                    ok: false,
                    tipo: 'naranja',
                    necesitaPassword: true,
                    documento,
                    mensaje: 'Tu usuario no tiene contraseña. Crea una para continuar.'
                });
            }
            // Ya tiene contraseña: le pido que la ingrese
            return res.json({
                ok: false,
                tipo: 'naranja',
                requierePassword: true,
                documento,
                mensaje: 'Ingresa tu contraseña para continuar.'
            });
        }

        // ----- PASO 2: DOCUMENTO + CONTRASEÑA -----
        // El cliente ya tiene contraseña y la está comprobando.
        if (!tienePassword) {
            return res.json({ ok: false, tipo: 'incorrecto', mensaje: 'Este cliente no tiene contraseña creada' });
        }

        const coincide = await bcrypt.compare(String(password), clienteBD.password);
        if (!coincide) {
            return res.json({ ok: false, tipo: 'incorrecto', mensaje: 'Documento o contraseña incorrectos' });
        }

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

// GET /api/verificar-sesion
// Dice si hay una sesión activa (lo usa el frontend antes de apartar)
const verificarSesion = (req, res) => {
    if (req.session && req.session.usuario) {
        return res.json({ login: true });
    }
    res.json({ login: false });
};

// Registro de nuevo usuario/cliente
const registroUsuarioController = async (req, res) => {
    const { nombre, documento, direccion, telefono, rol, password, nuevaPassword } = req.body;

    // Validar que todos los campos vengan
    if (!nombre || !documento || !direccion || !telefono || !rol) {
        return res.json({ ok: false, mensaje: 'Todos los campos son obligatorios' });
    }

    // La contraseña puede venir como 'password' o 'nuevaPassword'
    const contrasena = password || nuevaPassword;
    if (!contrasena || !String(contrasena).trim()) {
        return res.json({ ok: false, mensaje: 'La contraseña es obligatoria' });
    }
    if (String(contrasena).length < 6) {
        return res.json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
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

        // Encripto la contraseña antes de guardarla (nunca texto plano)
        const hash = await bcrypt.hash(String(contrasena), 10);

        // Insertar el nuevo registro
        await UsuarioModel.registrar({ nombre, documento, direccion, telefono, rol, password: hash });

        return res.json({ ok: true, mensaje: 'Registro exitoso. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error en registroUsuarioController:', error);
        return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
    }
};

module.exports = {
    loginUsuarioController,
    logoutUsuarioController,
    verificarSesion,
    registroUsuarioController
};