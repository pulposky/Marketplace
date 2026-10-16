// =============================================
// API DE RECUPERACION DE CUENTAS DE CLIENTES
// =============================================
// Permito que solo el Administrador genere una clave
// temporal; guardo únicamente el hash y audito la acción.
// =============================================

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const UsuarioModel = require('../../models/usuarioModel');
const RecuperacionModel = require('../../models/recuperacionModel');
const auditoriaService = require('../../services/auditoriaService');

const RecuperacionApiController = {
    // GET /api/admin/recuperacion/contacto
    obtenerContacto: async (req, res) => {
        try {
            const telefono = await RecuperacionModel.obtenerTelefono();
            return res.json({ ok: true, telefono });
        } catch (error) {
            console.error('Error consultando el contacto de recuperación:', error);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo consultar el contacto.' });
        }
    },

    // PUT /api/admin/recuperacion/contacto
    guardarContacto: async (req, res) => {
        const telefono = String(req.body?.telefono || '').trim();
        const digitos = telefono.replace(/\D/g, '');
        if (telefono && (!/^\+?[\d\s().-]{7,29}$/.test(telefono) || digitos.length < 7 || digitos.length > 15)) {
            return res.status(400).json({ ok: false, mensaje: 'Ingresa un teléfono válido o deja el campo vacío.' });
        }

        try {
            await RecuperacionModel.guardarTelefono(telefono);
            auditoriaService.registrar(req, 'contacto_recuperacion_actualizado', 'Actualizó el teléfono público de recuperación.');
            return res.json({ ok: true, telefono, mensaje: telefono ? 'Teléfono de contacto actualizado.' : 'Teléfono de contacto eliminado.' });
        } catch (error) {
            console.error('Error guardando el contacto de recuperación:', error);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo guardar el teléfono.' });
        }
    },

    // POST /api/admin/recuperacion/cliente
    restablecerPasswordCliente: async (req, res) => {
        const documento = String(req.body?.documento || '').trim();
        if (!documento || documento.length > 30) {
            return res.status(400).json({ ok: false, mensaje: 'Ingresa un documento válido.' });
        }

        try {
            const cliente = await UsuarioModel.obtenerClientePorDocumento(documento);
            if (!cliente) {
                return res.status(404).json({ ok: false, mensaje: 'No se encontró un cliente con ese documento.' });
            }

            const passwordTemporal = crypto.randomBytes(12).toString('base64url');
            const hash = await bcrypt.hash(passwordTemporal, 10);
            await UsuarioModel.crearPassword(cliente.id_cliente, hash);
            auditoriaService.registrar(
                req,
                'cliente_password_reset',
                `Restableció la contraseña del cliente id ${cliente.id_cliente}.`
            );

            return res.json({
                ok: true,
                mensaje: 'Contraseña temporal generada. Entrégala al cliente por un canal seguro.',
                cliente: { id: cliente.id_cliente, nombre: cliente.nombre },
                passwordTemporal
            });
        } catch (error) {
            console.error('Error restableciendo contraseña de cliente:', error);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo restablecer la contraseña.' });
        }
    }
};

module.exports = RecuperacionApiController;
