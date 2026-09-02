// =============================================
// API DEL CLIENTE (PERFIL)
// =============================================
// Endpoint que permite al cliente actualizar
// sus datos personales: nombre, dirección,
// teléfono y contraseña.
// =============================================

const bcrypt = require('bcryptjs');
const UsuarioModel = require('../../models/usuarioModel');

const ClienteApiController = {

    // PATCH /api/perfil
    // Guarda los cambios de nombre, dirección y teléfono
    // (el documento no se puede modificar)
    actualizarPerfil: async (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión.' });
        }

        // El perfil editable es solo para clientes;
        // admin y aprendiz no tienen esta vista
        const rolSesion = String(req.session.usuario.role || '').trim().toLowerCase();
        if (rolSesion === 'admin' || rolSesion === 'aprendiz') {
            return res.status(403).json({ ok: false, mensaje: 'Los administradores no tienen perfil de cliente.' });
        }

        const { nombre, direccion, telefono, password } = req.body;

        if (!nombre || !nombre.trim()) {
            return res.json({ ok: false, mensaje: 'El nombre no puede estar vacío' });
        }
        if (!telefono || !String(telefono).trim()) {
            return res.json({ ok: false, mensaje: 'El teléfono no puede estar vacío' });
        }
        if (!password || !String(password).trim()) {
            return res.json({ ok: false, mensaje: 'Debes ingresar tu contraseña para guardar los cambios' });
        }

        try {
            // Obtengo el cliente con su contraseña para verificarla
            const clienteBD = await UsuarioModel.obtenerClienteConPasswordPorId(req.session.usuario.id);

            if (!clienteBD) {
                return res.json({ ok: false, mensaje: 'No se encontró el cliente.' });
            }

            // Verifico que la contraseña sea correcta antes de actualizar
            if (!clienteBD.password) {
                return res.json({ ok: false, mensaje: 'Este cliente no tiene contraseña configurada. Inicia sesión y créala primero.' });
            }

            const coincide = await bcrypt.compare(String(password), clienteBD.password);
            if (!coincide) {
                return res.json({ ok: false, mensaje: 'La contraseña es incorrecta.' });
            }

            // Si el cliente también quiere cambiar su contraseña, la actualizo
            const nuevaPassword = req.body.nuevaPassword;
            let mensaje = 'Perfil actualizado correctamente.';
            let cambioPassword = false;

            if (nuevaPassword && String(nuevaPassword).trim()) {
                if (String(nuevaPassword).length < 6 || String(nuevaPassword).length > 100) {
                    return res.json({ ok: false, mensaje: 'La nueva contraseña debe tener entre 6 y 100 caracteres.' });
                }
                const hash = await bcrypt.hash(String(nuevaPassword), 10);
                await UsuarioModel.crearPassword(req.session.usuario.id, hash);
                cambioPassword = true;
            }

            await UsuarioModel.actualizarCliente(req.session.usuario.id, {
                nombre: String(nombre).trim(),
                direccion: String(direccion || '').trim(),
                telefono: String(telefono).trim()
            });

            // Actualizo la sesión para que el resto del sitio
            // muestre el nuevo nombre de una vez
            req.session.usuario.nombre = String(nombre).trim();

            if (cambioPassword) {
                mensaje = 'Perfil y contraseña actualizados correctamente.';
            }

            return res.json({ ok: true, mensaje });
        } catch (error) {
            console.error('Error en actualizarPerfil:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
        }
    }
};

module.exports = ClienteApiController;
