// =============================================
// CSRF - CLIENTE
// =============================================
// Lee el token que el servidor pone en el <meta>
// name="csrf-token" y lo agrega automáticamente
// como cabecera "x-csrf-token" a TODAS las peticiones
// fetch del sitio. Así ningún fetch existente se
// rompe ni necesita modificarse.
// =============================================

(function () {
    'use strict';

    const meta = document.querySelector('meta[name="csrf-token"]');
    const token = meta && meta.getAttribute('content') ? meta.getAttribute('content') : '';

    if (!token) return;

    const fetchOriginal = window.fetch.bind(window);

    window.fetch = function (url, opciones) {
        opciones = opciones || {};
        opciones.credentials = opciones.credentials || 'same-origin';

        const headers = new Headers(opciones.headers || {});
        if (!headers.has('x-csrf-token')) {
            headers.set('x-csrf-token', token);
        }
        opciones.headers = headers;

        return fetchOriginal(url, opciones);
    };
})();