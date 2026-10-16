/* ============================================= */
/* VERIFICARPERMISO.JS - AUTORIZACIÓN POR PERMISO */
/* ============================================= */
/* Factory que exige que el rol del usuario tenga  */
/* un permiso concreto (módulo del panel). El      */
/* Administrador (superadmin) siempre pasa.         */
/*                                                 */
/* Se usa en las rutas así:                        */
/*   router.get('/admin/clientes',                 */
/*       verificarPermiso('clientes'), ...)        */
/*                                                 */
/* Responde 401/403 en JSON para las API y        */
/* redirige a /admin en las páginas.               */
/* ============================================= */

const permisosService = require('../services/permisosService');

const verificarPermiso = (clavePermiso) => (req, res, next) => {
    // Es API si el cliente lo pide (XHR/JSON) o si la ruta empieza por /api/
    const esAPI = req.xhr || String(req.path || '').startsWith('/api/')
        || req.headers.accept?.includes('application/json');

    if (!req.session || !req.session.usuario) {
        if (esAPI) {
            return res.status(401).json({
                ok: false,
                login: false,
                mensaje: 'Debe iniciar sesión.'
            });
        }
        return res.redirect('/');
    }

    const rol = req.session.usuario.role;
    if (permisosService.tienePermiso(rol, clavePermiso)) {
        return next();
    }

    if (esAPI) {
        return res.status(403).json({
            ok: false,
            mensaje: 'No tienes permisos para acceder a esta función.'
        });
    }
    return res.redirect('/admin');
};

module.exports = verificarPermiso;
