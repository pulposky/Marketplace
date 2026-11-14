// =============================================
// API DEL PANEL ADMIN (CLIENTES)
// =============================================
// Endpoints que devuelven JSON para la gestión
// de clientes: listar con búsqueda y actualizar
// datos (nombre, dirección, teléfono).
// =============================================

const UsuarioModel = require('../../models/usuarioModel');
const permisosService = require('../../services/permisosService');

const AdminApiController = {

    // GET /api/admin/clientes
    // Lista clientes con su resumen de compras; acepta ?busqueda= para filtrar
    listarClientes: (req, res) => {
        const busqueda = String(req.query.busqueda || '');

        UsuarioModel.obtenerClientesAdmin(busqueda, (error, clientes) => {
            if (error) {
                console.error('Error al consultar clientes:', error);
                return res.status(500).json({ error: 'Error al consultar clientes.' });
            }
            res.json(Array.isArray(clientes) ? clientes : []);
        });
    },

    // PATCH /api/admin/clientes/:id
    // Actualiza nombre, dirección y teléfono de un cliente
    actualizarCliente: async (req, res) => {
        // Validación de permiso: solo quien tenga 'clientes' edita clientes.
        const rolSesion = req.session?.usuario?.role;
        if (!permisosService.tienePermiso(rolSesion, 'clientes')) {
            return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para gestionar clientes.' });
        }

        const { id } = req.params;
        const { nombre, direccion, telefono } = req.body;

        if (!/^[1-9]\d*$/.test(String(id || ''))) {
            return res.status(400).json({ ok: false, mensaje: 'ID de cliente inválido.' });
        }
        if (!nombre || !String(nombre).trim()) {
            return res.json({ ok: false, mensaje: 'El nombre no puede estar vacío' });
        }
        // Evito que el nombre/dirección lleven HTML (se muestran en notificaciones)
        if (String(nombre).trim().length > 100 || /[<>"'`]/.test(String(nombre))) {
            return res.json({ ok: false, mensaje: 'El nombre debe tener máximo 100 caracteres y no puede contener caracteres especiales (< > comillas).' });
        }
        if (telefono && !/^\d{0,20}$/.test(String(telefono).trim())) {
            return res.json({ ok: false, mensaje: 'El teléfono solo puede tener números (máximo 20).' });
        }
        if (String(direccion || '').trim().length > 200 || /[<>]/.test(String(direccion || ''))) {
            return res.json({ ok: false, mensaje: 'La dirección debe tener máximo 200 caracteres y no puede contener < >' });
        }

        try {
            await UsuarioModel.actualizarCliente(id, {
                nombre: String(nombre).trim(),
                direccion: String(direccion || '').trim(),
                telefono: String(telefono || '').trim()
            });

            return res.json({ ok: true, mensaje: 'Cliente actualizado correctamente.' });
        } catch (error) {
            console.error('Error en actualizarCliente:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
        }
    }
};

module.exports = AdminApiController;
