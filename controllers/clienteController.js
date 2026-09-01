// =============================================
// CONTROLADOR DEL CLIENTE
// =============================================
// Todo lo que ve y hace un cliente autenticado:
// su perfil (verlo y editarlo) y sus apartados.
// =============================================

const bcrypt = require('bcryptjs');
const ApartadoModel = require('../models/apartadoModel');
const UsuarioModel = require('../models/usuarioModel');
const { asociarImagenesAProductos } = require('../utils/imagenes');

const ClienteController = {

    // Vista "Mis apartados"
    // Muestra solo los apartados que el cliente creó
    mostrarVerApartados: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/catalogo?login=1');
        }

        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        ApartadoModel.obtenerApartadosPorCliente(nombreCliente, (error, apartados) => {
            if (error) {
                console.error('Error al consultar apartados:', error);
                return res.status(500).send('Error en el servidor');
            }

            const listaApartadosRaw = Array.isArray(apartados) ? apartados : [];

            asociarImagenesAProductos(listaApartadosRaw, (apartadosConImagen) => {
                res.render('verApartados', {
                    apartados: apartadosConImagen,
                    usuario: req.session.usuario
                });
            });
        });
    },

    // Vista "Mi perfil"
    // Muestra sus datos y le permite editarlos.
    // Es solo para clientes; el admin va a su panel.
    mostrarPerfil: async (req, res) => {
        const usuarioSesion = req.session?.usuario;
        if (!usuarioSesion) {
            return res.redirect('/');
        }

        const rol = String(usuarioSesion.role || '').trim().toLowerCase();
        if (rol === 'admin' || rol === 'aprendiz') {
            return res.redirect('/admin');
        }

        try {
            // Traigo los datos frescos desde la BD por si cambiaron
            const cliente = await UsuarioModel.obtenerClientePorId(usuarioSesion.id);

            if (!cliente) {
                req.session.destroy(() => {});
                return res.redirect('/catalogo?login=1');
            }

            res.render('perfil', {
                cliente,
                usuario: usuarioSesion
            });
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
            return res.status(500).send('Error en el servidor');
        }
    },

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

module.exports = ClienteController;