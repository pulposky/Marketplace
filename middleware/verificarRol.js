// =============================================
// MIDDLEWARE DE AUTENTICACIÓN POR ROL
// =============================================
// Igual que verificarAdmin pero permite restringir
// rutas a roles específicos (p. ej. solo 'admin').
// Recibe la lista de roles permitidos y, si el
// usuario no está logueado o no tiene el rol,
// responde 401/403 en APIs o redirige en páginas.
// =============================================

const verificarRol = (rolesPermitidos) => {
    const permitidos = (Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos])
        .map((r) => String(r).trim().toLowerCase());

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

        const rol = String(req.session.usuario.role || '').trim().toLowerCase();
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