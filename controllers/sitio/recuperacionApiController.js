// =============================================
// API PUBLICA DE CONTACTO PARA RECUPERACION
// =============================================
// Entrego únicamente el teléfono que el Administrador
// configuró para orientar a clientes que olvidaron su clave.
// =============================================

const RecuperacionModel = require('../../models/recuperacionModel');

const RecuperacionApiController = {
    // GET /api/recuperacion/contacto
    obtenerContacto: async (req, res) => {
        try {
            const telefono = await RecuperacionModel.obtenerTelefono();
            return res.json({ ok: true, telefono });
        } catch (error) {
            console.error('Error consultando el contacto de recuperación:', error);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo consultar el contacto.' });
        }
    }
};

module.exports = RecuperacionApiController;
