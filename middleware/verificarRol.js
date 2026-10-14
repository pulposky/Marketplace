/* ============================================= */
/* VERIFICARROL.JS - AUTENTICACIÓN POR ROL       */
/* ============================================= */
/* Permite restringir rutas a roles específicos   */
/* (p. ej. ROLES_ADMIN). Recibe la lista de roles */
/* permitidos y, si el usuario no está logueado o */
/* no tiene el rol, responde 401/403 en APIs o    */
/* redirige en páginas. Normaliza los roles con   */
/* rolCanonico (utils/roles.js) para aceptar      */
/* variantes como 'Administrador' o 'Técnico'.    */
/* ============================================= */

const { rolCanonico } = require('../utils/roles');

const verificarRol = (rolesPermitidos) => {
    const permitidos = (Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos])
        .map((r) => rolCanonico(r));

    return (req, res, next) => {
        const esAPI = req.xhr || String(req.path || '').startsWith('/api/')
            || req.headers.accept?.includes("application/json");

        if (!req.session || !req.session.usuario) {
            if (esAPI) {
                return res.status(401).json({
                    ok: false,
                    login: false,
                    mensaje: "Debe iniciar sesión."
                });
            }
            return res.redirect("/");
        }

        const rol = rolCanonico(req.session.usuario.role);
        if (!permitidos.includes(rol)) {
            if (esAPI) {
                return res.status(403).json({
                    ok: false,
                    mensaje: "No tienes permisos para acceder a esta función."
                });
            }
            return res.redirect("/admin");
        }

        next();
    };
};

module.exports = verificarRol;