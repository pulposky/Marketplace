// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================
// Este middleware protege las rutas que solo
// pueden acceder usuarios logueados. Si no hay
// sesión, responde con 401 para peticiones AJAX
// o redirige al inicio si es una URL normal.
// =============================================

const protegerRuta = (req, res, next) => {
    // Si hay sesión activa, dejo pasar
    if (req.session && req.session.usuario) {
        return next();
    }

    // Si la petición viene de fetch (AJAX), devuelvo JSON con error 401
    // El optional chaining (?.) evita que explote si 'accept' es undefined
    if (req.xhr || req.headers.accept?.includes("application/json")) {
        return res.status(401).json({
            ok: false,
            login: false,
            mensaje: "Debe iniciar sesión."
        });
    }

    // Si es una URL normal (el usuario escribió la dirección), lo mando al inicio
    return res.redirect("/");
};

module.exports = protegerRuta;
