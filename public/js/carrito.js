// =============================================
// CARRITO COMPARTIDO (localStorage)
// =============================================
// Lo usan la página del producto (agregar), la página /carrito (revisar y
// pedir) y el encabezado (contador). Cada producto + presentación es una
// línea; 'limite' y 'precioNum' van en la presentación elegida. El servidor
// recalcula precios y stock al hacer el pedido.
// =============================================

(function () {
    'use strict';
    const CLAVE = 'carritoMarketplace_v2';

    const leer = () => {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
            return Array.isArray(datos) ? datos : [];
        } catch (e) { return []; }
    };
    const guardar = (carrito) => {
        try { localStorage.setItem(CLAVE, JSON.stringify(carrito)); } catch (e) { /* almacenamiento bloqueado */ }
        pintarContador();
    };
    const contar = (carrito = leer()) => carrito.reduce((s, i) => s + (Number(i.cantidad) || 0), 0);
    const total = (carrito = leer()) => carrito.reduce((s, i) => s + (Number(i.cantidad) || 0) * (Number(i.precioNum) || 0), 0);

    // Suma la cantidad (sin pasar del límite). Devuelve la cantidad final de esa línea.
    const agregar = (item, cantidad) => {
        const carrito = leer();
        const clave = `${item.id}:${item.presentacionId || ''}`;
        const limite = Number(item.limite) || 0;
        let linea = carrito.find((i) => i.clave === clave);
        if (!linea) {
            linea = { ...item, clave, id: String(item.id), presentacionId: item.presentacionId || null, limite, cantidad: 0 };
            carrito.push(linea);
        }
        linea.cantidad = Math.min(limite, linea.cantidad + Math.max(1, Math.floor(cantidad) || 1));
        guardar(carrito);
        return linea.cantidad;
    };

    function pintarContador() {
        const n = contar();
        document.querySelectorAll('[data-contador-carrito]').forEach((el) => {
            el.textContent = n > 99 ? '99+' : String(n);
            el.hidden = n === 0;
        });
    }

    window.Carrito = { leer, guardar, contar, total, agregar, pintarContador };
    document.addEventListener('DOMContentLoaded', pintarContador);
    // Otra pestaña cambió el carrito
    window.addEventListener('storage', (e) => { if (e.key === CLAVE) pintarContador(); });
})();
