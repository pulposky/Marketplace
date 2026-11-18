// =============================================
// PÁGINA DEL CARRITO (/carrito)
// =============================================
// Paso 1: revisar productos y cantidades. "Continuar" pide sesión (modal
// de login) y abre el paso 2: cómo lo recibe (partials/opcionesEntrega)
// y "Confirmar pedido" -> POST /api/apartar-lote.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const C = window.Carrito;
    const pagina = document.querySelector('.carrito-pagina');
    const lista = document.getElementById('carritoLineas');
    const pasoEntrega = document.getElementById('pasoEntrega');
    const btnContinuar = document.getElementById('btnContinuar');
    const btnConfirmar = document.getElementById('btnConfirmarPedido');
    const ventanaLogin = document.getElementById('modalLogin');
    const cop = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
    const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    function pintar() {
        const carrito = C.leer();
        document.getElementById('carritoVacio').hidden = carrito.length > 0;
        document.getElementById('carritoContenido').hidden = carrito.length === 0;
        lista.innerHTML = carrito.map((i) => `
            <li class="carrito-linea" data-clave="${escapar(i.clave)}">
                <a class="carrito-linea-foto" href="/producto/${encodeURIComponent(i.id)}">
                    ${i.imagen ? `<img src="${escapar(i.imagen)}" alt="">` : `<span>${escapar(String(i.nombre || '?').charAt(0))}</span>`}
                </a>
                <div class="carrito-linea-info">
                    <a href="/producto/${encodeURIComponent(i.id)}" class="carrito-linea-nombre">${escapar(i.nombre)}</a>
                    <span class="carrito-linea-precio">${cop(i.precioNum)} / ${escapar(i.unidad || 'unidad')}</span>
                    <div class="carrito-linea-controles">
                        <div class="selector-cantidad">
                            <button type="button" data-accion="menos" aria-label="Uno menos">&minus;</button>
                            <input type="number" value="${Number(i.cantidad)}" min="1" max="${Number(i.limite)}" inputmode="numeric" aria-label="Cantidad de ${escapar(i.nombre)}">
                            <button type="button" data-accion="mas" aria-label="Uno más">&plus;</button>
                        </div>
                        <button type="button" class="btn-texto" data-accion="quitar">Eliminar</button>
                    </div>
                </div>
                <b class="carrito-linea-subtotal">${cop(i.cantidad * i.precioNum)}</b>
            </li>`).join('');
        const n = C.contar(carrito);
        document.getElementById('carritoUnidades').textContent = `${n} artículo${n === 1 ? '' : 's'}`;
        document.getElementById('carritoTotal').textContent = cop(C.total(carrito));
    }

    // Cambia la cantidad de una línea (0 = quitar), sin pasar del límite
    function cambiar(clave, nueva) {
        const carrito = C.leer();
        const linea = carrito.find((i) => i.clave === clave);
        if (!linea) return;
        if (nueva < 1) carrito.splice(carrito.indexOf(linea), 1);
        else {
            if (nueva > linea.limite) toast('advertencia', `Solo hay ${linea.limite} disponibles.`);
            linea.cantidad = Math.min(linea.limite, Math.floor(nueva));
        }
        C.guardar(carrito);
        pintar();
    }

    lista.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        const li = boton.closest('.carrito-linea');
        const actual = Number(li.querySelector('input').value) || 1;
        const accion = boton.dataset.accion;
        cambiar(li.dataset.clave, accion === 'quitar' ? 0 : actual + (accion === 'mas' ? 1 : -1));
    });
    lista.addEventListener('change', (e) => {
        if (e.target.matches('input')) cambiar(e.target.closest('.carrito-linea').dataset.clave, Number(e.target.value) || 1);
    });

    // Paso 2 (con sesión). Sin sesión: login y se vuelve directo al paso 2.
    function mostrarEntrega() {
        pasoEntrega.hidden = false;
        btnContinuar.hidden = true;
        pasoEntrega.querySelector('input, button').focus();
    }
    btnContinuar.addEventListener('click', () => {
        if (pagina.dataset.sesion) return mostrarEntrega();
        if (ventanaLogin) ventanaLogin.style.display = 'flex';
        toast('info', 'Inicia sesión o crea tu cuenta para hacer el pedido.');
    });

    btnConfirmar.addEventListener('click', async () => {
        const carrito = C.leer();
        if (!carrito.length) return;
        const envio = window.leerEntrega ? window.leerEntrega() : {};
        if (envio.error) {
            toast('advertencia', envio.error);
            if (envio.campo) envio.campo.focus();
            return;
        }
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Enviando…';
        try {
            const respuesta = await fetch('/api/apartar-lote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: carrito.map((i) => ({ productoId: Number(i.id), cantidad: Number(i.cantidad), presentacionId: i.presentacionId ? Number(i.presentacionId) : undefined })),
                    entrega: envio.entrega,
                    domicilio: envio.domicilio
                })
            });
            const datos = await respuesta.json().catch(() => ({}));
            if (respuesta.ok) {
                C.guardar([]);
                toast('exito', datos.mensaje || '¡Pedido recibido!');
                setTimeout(() => { window.location.href = '/verApartados'; }, 1200);
                return;
            }
            toast('error', datos.error || 'No se pudo hacer el pedido.');
        } catch (e) {
            toast('error', 'Error de conexión con el servidor.');
        }
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Confirmar pedido';
    });

    // Login desde el modal: recarga y abre el paso de entrega
    const formLogin = document.getElementById('formLogin');
    if (formLogin && typeof configurarFormLogin === 'function') {
        configurarFormLogin(formLogin, { alLoginExitoso: () => { window.location.href = '/carrito?paso=entrega'; } });
    }
    document.getElementById('abrirModalLogin')?.addEventListener('click', () => { ventanaLogin.style.display = 'flex'; });
    document.getElementById('cerrarModal')?.addEventListener('click', () => { ventanaLogin.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === ventanaLogin) ventanaLogin.style.display = 'none'; });

    pintar();
    if (pagina.dataset.sesion && new URLSearchParams(location.search).get('paso') === 'entrega' && C.leer().length) mostrarEntrega();
});
