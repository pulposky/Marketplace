// =============================================
// MIDDLEWARE: NO-CACHE
// =============================================
// Evita que el navegador almacene en caché
// páginas con información sensible. Así, al
// cerrar sesión y usar la flecha del navegador,
// no se muestra contenido de sesión anterior.
// =============================================

const noCache = (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });
    next();
};

module.exports = noCache;