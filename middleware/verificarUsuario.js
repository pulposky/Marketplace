const protegerRuta = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }

    // Si es una petición AJAX/fetch
    if (req.xhr || req.headers.accept.includes("application/json")) {
        return res.status(401).json({
            ok: false,
            login: false,
            mensaje: "Debe iniciar sesión."
        });
    }

    // Si entra directamente por URL
    return res.redirect("/");
};

module.exports = protegerRuta;