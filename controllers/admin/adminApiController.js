// =============================================
// API DEL PANEL ADMIN (CLIENTES)
// =============================================
// Endpoints que devuelven JSON para la gestión
// de clientes: listar con búsqueda y actualizar
// datos (nombre, dirección, teléfono).
// =============================================

const UsuarioModel = require('../../models/usuarioModel');

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
        // Validación de rol: solo el admin edita clientes.
        const rolSesion = String(req.session?.usuario?.role || '').trim().toLowerCase();
        if (rolSesion !== 'admin') {
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
            console.error('Error en actualizarCliente:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
        }
    }
};

module.exports = AdminApiController;
