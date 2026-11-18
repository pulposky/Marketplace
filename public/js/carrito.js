// =============================================
// CARRITO (cliente de /api/carrito)
// =============================================
// El carrito vive en el servidor: en la BD si hay sesión de cliente,
// en la sesión del visitante si no. Aquí solo se piden cambios y se
// actualiza el contador del encabezado (que el servidor ya pinta al cargar).
// =============================================

(function () {
    'use strict';

    async function pedir(metodo, datos) {
        const respuesta = await fetch('/api/carrito', {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: datos ? JSON.stringify(datos) : undefined
        });
        const cuerpo = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo actualizar el carrito.');
        pintarContador(cuerpo.cantidad);
        return cuerpo; // { items, cantidad, total, aviso? }
    }

    function pintarContador(n) {
        if (typeof n !== 'number') return;
        document.querySelectorAll('[data-contador-carrito]').forEach((el) => {
            el.textContent = n > 99 ? '99+' : String(n);
            el.hidden = n === 0;
        });
    }

    window.Carrito = {
        obtener: () => pedir('GET'),
        // Suma la cantidad a la línea producto + presentación
        agregar: (productoId, presentacionId, cantidad) => pedir('POST', { productoId, presentacionId, cantidad }),
        // Deja la línea con esa cantidad (0 = quitar)
        fijar: (productoId, presentacionId, cantidad) => pedir('PUT', { productoId, presentacionId, cantidad })
    };
})();
