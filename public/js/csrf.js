// =============================================
// CSRF - Protección de peticiones fetch del navegador
// =============================================
// Lee el token que el servidor pone en el <meta>
// name="csrf-token" y lo agrega automáticamente
// como cabecera "x-csrf-token" a TODAS las peticiones
// fetch del sitio. Así ningún fetch existente se
// rompe ni necesita modificarse.
// =============================================

// IIFE que se ejecuta apenas carga el script
(function () {
    'use strict';

    // Obtener el token CSRF desde la etiqueta <meta> que pinta el servidor
    const meta = document.querySelector('meta[name="csrf-token"]');
    const token = meta && meta.getAttribute('content') ? meta.getAttribute('content') : '';

    // Si no hay token (por ejemplo en una página pública sin CSRF), no hago nada
    if (!token) return;

    // Guardo una referencia al fetch original para envolverlo sin perder el contexto
    const fetchOriginal = window.fetch.bind(window);

    // Sobrescribo window.fetch para inyectar la cabecera CSRF en todas las peticiones
    window.fetch = function (url, opciones) {
        opciones = opciones || {};
        opciones.credentials = opciones.credentials || 'same-origin';

        const headers = new Headers(opciones.headers || {});
        if (!headers.has('x-csrf-token')) {
            headers.set('x-csrf-token', token);
        }
        opciones.headers = headers;

        return fetchOriginal(url, opciones).then(function (respuesta) {
            // Si el token CSRF caducó (por ejemplo, la sesión expiró
            // mientras la página estaba abierta), el servidor responde
            // 403 con { error }. Recargo la página para obtener una
            // sesión y un token frescos; así el usuario solo debe
            // reintentar la acción.
            if (respuesta.status === 403 && respuesta.headers.get('content-type') &&
                respuesta.headers.get('content-type').indexOf('application/json') !== -1) {
                return respuesta.clone().json().then(function (cuerpo) {
                    if (cuerpo && cuerpo.error) {
                        window.location.reload();
                        // Devuelvo la respuesta original para no romper el flujo
                        return respuesta;
                    }
                    return respuesta;
                });
            }
            return respuesta;
        });
    };
})();