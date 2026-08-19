/* =============================================
   TOAST NOTIFICATIONS - UTILIDAD JS
   =============================================
   Función global toast(tipo, mensaje, duracion).
   Tipos: 'exito', 'error', 'advertencia', 'info'
   
   Uso:
     toast('exito', 'Guardado correctamente');
     toast('error', 'Faltan campos obligatorios');
     toast('advertencia', 'Stock bajo');
     toast('info', 'Sesión verificada');
   ============================================= */

(function () {
    // Creo el contenedor donde se apilan los toasts
    const contenedor = document.createElement('div');
    contenedor.className = 'toast-contenedor';
    document.body.appendChild(contenedor);

    const ICONOS = {
        exito: '✓',
        error: '✕',
        advertencia: '⚠',
        info: 'ℹ'
    };

    window.toast = function (tipo, mensaje, duracion) {
        duracion = duracion || 3500;

        const el = document.createElement('div');
        el.className = 'toast toast-' + tipo;
        el.innerHTML =
            '<span class="toast-icono">' + (ICONOS[tipo] || '') + '</span>' +
            '<span class="toast-texto">' + escapeHtml(mensaje) + '</span>' +
            '<button class="toast-cerrar" aria-label="Cerrar">&times;</button>';

        // Cerrar al hacer click en la X
        el.querySelector('.toast-cerrar').addEventListener('click', function () {
            cerrarToast(el);
        });

        contenedor.appendChild(el);

        // Auto-cerrar después de la duración
        var timer = setTimeout(function () {
            cerrarToast(el);
        }, duracion);

        // Si el usuario pasa el mouse encima, pauso el timer
        el.addEventListener('mouseenter', function () {
            clearTimeout(timer);
        });
        el.addEventListener('mouseleave', function () {
            timer = setTimeout(function () {
                cerrarToast(el);
            }, 2000);
        });
    };

    function cerrarToast(el) {
        if (el.classList.contains('toast-saliendo')) return;
        el.classList.add('toast-saliendo');
        setTimeout(function () {
            el.remove();
        }, 300);
    }

    function escapeHtml(texto) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(texto));
        return div.innerHTML;
    }
})();
