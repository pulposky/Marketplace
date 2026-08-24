// =============================================
// MIDDLEWARE DE AUTENTICACIÓN POR ROL (ADMIN)
// =============================================
// Igual que verificarUsuario pero además exige
// que el rol sea admin o aprendiz. Lo usan las
// rutas nuevas del panel admin (clientes,
// reportes, entregas) para que un cliente
// logueado no pueda llamarlas.
// =============================================

const verificarAdmin = (req, res, next) => {
    if (!req.session || !req.session.usuario) {
        if (req.xhr || req.headers.accept?.includes("application/json")) {
            return res.status(401).json({
                ok: false,
                login: false,
                mensaje: "Debe iniciar sesión."
            });
        }
        return res.redirect("/");
    }

    const rol = String(req.session.usuario.role || '').trim().toLowerCase();
    if (rol !== 'admin' && rol !== 'aprendiz') {
        return res.status(403).json({
            ok: false,
            mensaje: "No tienes permisos para acceder a esta función."
        });
    }

    next();
};

module.exports = verificarAdmin;
