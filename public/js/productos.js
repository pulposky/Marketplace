// =============================================
// CATÁLOGO - JAVASCRIPT
// =============================================
// Login del catálogo (búsqueda y paginación van por el servidor). Cada tarjeta
// lleva a la página del producto (productoDetalle.js);
// el carrito vive en carrito.js y /carrito.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const ventanaLogin = document.getElementById('modalLogin');
    const formularioLogin = document.getElementById('formLogin');

    // Llegaron desde /verApartados sin sesión (?login=1): abro el login y luego los llevo a sus pedidos
    let irPedidosTrasLogin = false;
    const parametros = new URLSearchParams(window.location.search);
    if (parametros.get('login') === '1') {
        irPedidosTrasLogin = !parametros.get('desde');
        if (ventanaLogin) ventanaLogin.style.display = 'flex';
        if (irPedidosTrasLogin) toast('advertencia', 'Inicia sesión para ver tus pedidos.');
        window.history.replaceState({}, '', '/catalogo');
    }

    if (formularioLogin) {
        configurarFormLogin(formularioLogin, {
            alLoginExitoso: () => {
                if (irPedidosTrasLogin) window.location.href = '/verApartados';
                else window.location.reload();
            }
        });
    }
    document.getElementById('abrirModalLogin')?.addEventListener('click', () => { ventanaLogin.style.display = 'flex'; });
    document.getElementById('cerrarModal')?.addEventListener('click', () => { ventanaLogin.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === ventanaLogin) ventanaLogin.style.display = 'none'; });
    // La búsqueda y la paginación las hace el servidor (/catalogo?busqueda=…&pagina=…)
});
