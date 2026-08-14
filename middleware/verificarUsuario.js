// Middleware que protege rutas que solo puede usar un usuario autenticado
const protegerRuta = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }

    // Usamos optional chaining (?.), así si accept es undefined no rompe el código
    if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.status(401).json({
            ok: false,
            login: false,
            mensaje: "Debe iniciar sesión."
        });
    }

    // Si se accede por URL directamente, redirigimos al inicio
    return res.redirect("/");
};

module.exports = protegerRuta;