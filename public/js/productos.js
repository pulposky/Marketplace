// =============================================
// CATÁLOGO - JAVASCRIPT
// =============================================
// Búsqueda en vivo, paginación y login. Cada tarjeta
// lleva a la página del producto (productoDetalle.js);
// el carrito vive en carrito.js y /carrito.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const ventanaLogin = document.getElementById('modalLogin');
    const formularioLogin = document.getElementById('formLogin');
    const sinTildes = (t) => String(t || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

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

    // Búsqueda en vivo sobre las tarjetas cargadas (sin tildes, todas las palabras)
    const inputBuscar = document.getElementById('inputBuscar');
    const paginacion = window.crearPaginacionProductos('.rejilla-productos .tarjeta-producto', '#paginacionProductos');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            const palabras = sinTildes(inputBuscar.value).split(/\s+/).filter(Boolean);
            const coincidencias = [];
            document.querySelectorAll('.rejilla-productos .tarjeta-producto').forEach((tarjeta) => {
                const texto = sinTildes(`${tarjeta.querySelector('.nombre-producto')?.textContent} ${tarjeta.dataset.categoria}`);
                if (palabras.every((p) => texto.includes(p))) coincidencias.push(tarjeta);
                else tarjeta.style.display = 'none';
            });
            paginacion.aplicarFiltro(coincidencias);
            const aviso = document.getElementById('avisoSinResultados');
            if (aviso) aviso.style.display = coincidencias.length ? 'none' : 'block';
        });
    }
});
