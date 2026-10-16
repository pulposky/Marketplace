// =============================================
// API DE PERMISOS POR ROL
// =============================================
// Endpoints (solo Administrador) para leer la
// matriz de permisos y guardar los cambios.
// =============================================

const permisosService = require('../../services/permisosService');
const auditoriaService = require('../../services/auditoriaService');
const { esRolGestionable, esClaveValida } = require('../../utils/permisos');

const PermisosApiController = {

    // GET /api/admin/permisos
    // Devuelve el catálogo de permisos, los roles y la matriz actual.
    obtenerPermisos: (req, res) => {
        try {
            return res.json({ ok: true, ...permisosService.obtenerMatriz() });
        } catch (error) {
            console.error('Error obteniendo permisos:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al obtener los permisos.' });
        }
    },

    // PATCH /api/admin/permisos
    // Espera { roles: { <rol>: [<claves permitidas>], ... } }
    guardarPermisos: async (req, res) => {
        const roles = req.body?.roles;

        if (!roles || typeof roles !== 'object' || Array.isArray(roles)) {
            return res.status(400).json({ ok: false, mensaje: 'Formato de permisos inválido.' });
        }

        // Valido antes de tocar la base de datos para dar un error claro.
        for (const [rolRaw, claves] of Object.entries(roles)) {
            if (!esRolGestionable(rolRaw)) {
                return res.status(400).json({ ok: false, mensaje: `El rol "${rolRaw}" no se puede gestionar.` });
            }
            if (!Array.isArray(claves)) {
                return res.status(400).json({ ok: false, mensaje: `Los permisos de "${rolRaw}" deben ser una lista.` });
            }
            for (const clave of claves) {
                if (!esClaveValida(clave)) {
                    return res.status(400).json({ ok: false, mensaje: `El permiso "${clave}" no existe.` });
                }
            }
        }

        try {
            await permisosService.guardar(roles);
            auditoriaService.registrar(req, 'permisos_guardar', 'Actualizó los permisos por rol.');
            return res.json({ ok: true, mensaje: 'Permisos actualizados correctamente.' });
        } catch (error) {
            console.error('Error guardando permisos:', error);
            return res.status(500).json({ ok: false, mensaje: 'Error al guardar los permisos.' });
        }
    }
};

module.exports = PermisosApiController;
