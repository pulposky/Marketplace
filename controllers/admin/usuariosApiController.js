// =============================================
// API DE USUARIOS DEL PANEL
// =============================================
// Endpoints (permiso 'usuarios') para gestionar el
// personal del panel (tabla 'usuarios'):
//   - Listar y buscar
//   - Crear
//   - Editar (nombre, usuario, rol)
//   - Cambiar contraseña
//   - Activar / desactivar
// Solo un Administrador (superadmin) puede crear/editar
// cuentas de Administrador; el resto de gestores no.
// Incluye protecciones para no quedarse sin administradores.
// =============================================

const bcrypt = require('bcryptjs');
const UsuarioModel = require('../../models/usuarioModel');
const auditoriaService = require('../../services/auditoriaService');
const { ROLES_STAFF, ETIQUETAS_ROL_STAFF, rolCanonico, esSuperAdmin } = require('../../utils/roles');

// Valida y normaliza los datos básicos del formulario.
// Devuelve { error } si algo está mal, o { datos } si está bien.
function validarDatosStaff(body) {
    const nombre = String(body.nombre || '').trim();
    const usuario = String(body.usuario || '').trim();
    const rolCanon = rolCanonico(body.rol);

    if (!nombre) return { error: 'El nombre es obligatorio.' };
    if (!usuario) return { error: 'El usuario es obligatorio.' };
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(usuario)) {
        return { error: 'El usuario debe tener de 3 a 50 caracteres (letras, números, punto, guion o guion bajo).' };
    }
    if (!ROLES_STAFF.includes(rolCanon)) {
        return { error: 'El rol seleccionado no es válido.' };
    }

    return {
        datos: {
            nombre,
            usuario,
            rolCanon,
            // El valor que se guarda en la BD (mismo formato que ya usa la tabla).
            rolBD: ETIQUETAS_ROL_STAFF[rolCanon] || rolCanon
        }
    };
}

const UsuariosApiController = {

    // GET /api/admin/usuarios?buscar=...
    // Lista el personal del panel (sin la contraseña).
    listar: async (req, res) => {
        try {
            const busqueda = req.query.buscar || '';
            const usuarios = await UsuarioModel.listarStaff(busqueda);
            return res.json({ ok: true, usuarios });
        } catch (error) {
            console.error('Error listando usuarios del panel:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al obtener los usuarios.' });
        }
    },

    // POST /api/admin/usuarios
    // Crea un usuario del panel. Body: { nombre, usuario, rol, password }
    crear: async (req, res) => {
        const { error, datos } = validarDatosStaff(req.body || {});
        if (error) {
            return res.status(400).json({ ok: false, mensaje: error });
        }

        const password = String(req.body.password || '');
        if (password.length < 6) {
            return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        // Solo un Administrador (superadmin) puede crear otro Administrador.
        // Quien tenga el permiso 'usuarios' sin ser superadmin gestiona al
        // resto del personal, pero no puede fabricarse cuentas con acceso total.
        if (datos.rolCanon === 'admin' && !esSuperAdmin(req.session?.usuario?.role)) {
            return res.status(403).json({ ok: false, mensaje: 'Solo un Administrador puede asignar el rol de Administrador.' });
        }

        try {
            const yaExiste = await UsuarioModel.existeUsuario(datos.usuario, 0);
            if (yaExiste) {
                return res.status(409).json({ ok: false, mensaje: 'Ya existe un usuario con ese nombre de usuario.' });
            }

            const hash = await bcrypt.hash(password, 10);
            const id = await UsuarioModel.crearStaff({
                nombre: datos.nombre,
                usuario: datos.usuario,
                rol: datos.rolBD,
                password: hash
            });

            auditoriaService.registrar(req, 'usuario_crear', `Creó al usuario "${datos.usuario}" con rol ${datos.rolBD} (id ${id}).`);

            return res.status(201).json({ ok: true, id, mensaje: 'Usuario creado correctamente.' });
        } catch (error) {
            console.error('Error creando usuario del panel:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al crear el usuario.' });
        }
    },

    // PATCH /api/admin/usuarios/:id
    // Edita nombre, usuario y rol. Body: { nombre, usuario, rol }
    actualizar: async (req, res) => {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ ok: false, mensaje: 'Usuario inválido.' });
        }

        const { error, datos } = validarDatosStaff(req.body || {});
        if (error) {
            return res.status(400).json({ ok: false, mensaje: error });
        }

        try {
            const objetivo = await UsuarioModel.obtenerStaffPorId(id);
            if (!objetivo) {
                return res.status(404).json({ ok: false, mensaje: 'El usuario no existe.' });
            }

            const yaExiste = await UsuarioModel.existeUsuario(datos.usuario, id);
            if (yaExiste) {
                return res.status(409).json({ ok: false, mensaje: 'Ya existe otro usuario con ese nombre de usuario.' });
            }

            const sesion = req.session?.usuario;
            const soySuperadmin = esSuperAdmin(sesion?.role);

            // Un gestor que no sea Administrador no puede editar cuentas de
            // Administrador ni ascender a nadie a Administrador.
            if (rolCanonico(objetivo.rol) === 'admin' && !soySuperadmin) {
                return res.status(403).json({ ok: false, mensaje: 'Solo un Administrador puede editar a otro Administrador.' });
            }
            if (datos.rolCanon === 'admin' && !soySuperadmin) {
                return res.status(403).json({ ok: false, mensaje: 'Solo un Administrador puede asignar el rol de Administrador.' });
            }

            // No me dejo cambiarme el rol a mí mismo (evita dejarme sin acceso).
            if (sesion && Number(sesion.id) === id && datos.rolCanon !== rolCanonico(objetivo.rol)) {
                return res.status(400).json({ ok: false, mensaje: 'No puedes cambiar tu propio rol.' });
            }

            // Si le quito el rol de admin a un administrador, debe quedar al menos otro.
            const eraAdmin = rolCanonico(objetivo.rol) === 'admin';
            const sigueAdmin = datos.rolCanon === 'admin';
            if (eraAdmin && !sigueAdmin) {
                const admins = await UsuarioModel.contarAdminsActivos();
                if (admins <= 1) {
                    return res.status(400).json({ ok: false, mensaje: 'Debe quedar al menos un administrador activo.' });
                }
            }

            await UsuarioModel.actualizarStaff(id, {
                nombre: datos.nombre,
                usuario: datos.usuario,
                rol: datos.rolBD
            });

            auditoriaService.registrar(req, 'usuario_editar', `Editó al usuario "${datos.usuario}" (id ${id}), rol ${datos.rolBD}.`);

            return res.json({ ok: true, mensaje: 'Usuario actualizado correctamente.' });
        } catch (error) {
            console.error('Error actualizando usuario del panel:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al actualizar el usuario.' });
        }
    },

    // PATCH /api/admin/usuarios/:id/password
    // Body: { password }
    cambiarPassword: async (req, res) => {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ ok: false, mensaje: 'Usuario inválido.' });
        }

        const password = String(req.body?.password || '');
        if (password.length < 6) {
            return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        try {
            const objetivo = await UsuarioModel.obtenerStaffPorId(id);
            if (!objetivo) {
                return res.status(404).json({ ok: false, mensaje: 'El usuario no existe.' });
            }

            // No se puede cambiar la contraseña de un Administrador si no eres Administrador.
            if (rolCanonico(objetivo.rol) === 'admin' && !esSuperAdmin(req.session?.usuario?.role)) {
                return res.status(403).json({ ok: false, mensaje: 'Solo un Administrador puede cambiar la contraseña de otro Administrador.' });
            }

            const hash = await bcrypt.hash(password, 10);
            await UsuarioModel.actualizarPasswordStaff(id, hash);

            auditoriaService.registrar(req, 'usuario_password', `Cambió la contraseña de "${objetivo.usuario}" (id ${id}).`);

            return res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente.' });
        } catch (error) {
            console.error('Error cambiando contraseña del panel:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al cambiar la contraseña.' });
        }
    },

    // PATCH /api/admin/usuarios/:id/activo
    // Body: { activo: true|false }
    cambiarActivo: async (req, res) => {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ ok: false, mensaje: 'Usuario inválido.' });
        }

        const activo = req.body?.activo === true || req.body?.activo === 'true' || req.body?.activo === 1;

        try {
            const objetivo = await UsuarioModel.obtenerStaffPorId(id);
            if (!objetivo) {
                return res.status(404).json({ ok: false, mensaje: 'El usuario no existe.' });
            }

            // Solo un Administrador puede activar/desactivar a otro Administrador.
            if (rolCanonico(objetivo.rol) === 'admin' && !esSuperAdmin(req.session?.usuario?.role)) {
                return res.status(403).json({ ok: false, mensaje: 'Solo un Administrador puede activar o desactivar a otro Administrador.' });
            }

            const sesion = req.session?.usuario;
            if (sesion && Number(sesion.id) === id && !activo) {
                return res.status(400).json({ ok: false, mensaje: 'No puedes desactivar tu propio usuario.' });
            }

            // Si voy a desactivar al último administrador, lo bloqueo.
            if (!activo && rolCanonico(objetivo.rol) === 'admin') {
                const admins = await UsuarioModel.contarAdminsActivos();
                if (admins <= 1) {
                    return res.status(400).json({ ok: false, mensaje: 'Debe quedar al menos un administrador activo.' });
                }
            }

            await UsuarioModel.actualizarActivoStaff(id, activo);

            auditoriaService.registrar(req, activo ? 'usuario_activar' : 'usuario_desactivar',
                `${activo ? 'Activó' : 'Desactivó'} al usuario "${objetivo.usuario}" (id ${id}).`);

            return res.json({ ok: true, mensaje: activo ? 'Usuario activado.' : 'Usuario desactivado.' });
        } catch (error) {
            console.error('Error cambiando estado del usuario:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al cambiar el estado del usuario.' });
        }
    }
};

module.exports = UsuariosApiController;
