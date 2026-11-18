// =============================================
// PÁGINA DEL CARRITO (/carrito)
// =============================================
// El carrito está en el servidor (/api/carrito). Paso 1: revisar productos
// y cantidades. "Continuar" pide sesión (modal de login; el carrito del
// visitante pasa a su cuenta) y abre el paso 2: cómo lo recibe y
// "Confirmar pedido", que pide sobre el carrito guardado y lo vacía.
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
    let hayDisponibles = false;

    function pintar({ items = [], cantidad = 0, total = 0 }) {
        document.getElementById('carritoVacio').hidden = items.length > 0;
        document.getElementById('carritoContenido').hidden = items.length === 0;
        hayDisponibles = items.some((i) => i.disponible);
        btnContinuar.disabled = !hayDisponibles;
        lista.innerHTML = items.map((i) => {
            const datos = `data-producto="${i.productoId}" data-presentacion="${i.presentacionId || ''}"`;
            const foto = `<a class="carrito-linea-foto" href="/producto/${i.productoId}">${i.imagen ? `<img src="${escapar(i.imagen)}" alt="">` : `<span>${escapar(String(i.nombre).charAt(0))}</span>`}</a>`;
            if (!i.disponible) {
                return `<li class="carrito-linea no-disponible" ${datos}>${foto}
                    <div class="carrito-linea-info"><span class="carrito-linea-nombre">${escapar(i.nombre)}</span>
                        <span class="carrito-linea-aviso">Ya no está disponible. No se incluirá en el pedido.</span>
                        <div class="carrito-linea-controles"><button type="button" class="btn-texto" data-accion="quitar">Eliminar</button></div></div></li>`;
            }
            const cant = Math.min(i.cantidad, i.limite);
            return `<li class="carrito-linea" ${datos}>${foto}
                <div class="carrito-linea-info">
                    <a href="/producto/${i.productoId}" class="carrito-linea-nombre">${escapar(i.nombre)}${i.presentacion ? ` <small>(${escapar(i.presentacion)})</small>` : ''}</a>
                    <span class="carrito-linea-precio">${cop(i.precio)} / ${escapar(i.unidad)}</span>
                    ${i.cantidad > i.limite ? `<span class="carrito-linea-aviso">Solo quedan ${i.limite}; ajustamos la cantidad.</span>` : ''}
                    <div class="carrito-linea-controles">
                        <div class="selector-cantidad">
                            <button type="button" data-accion="menos" aria-label="Uno menos">&minus;</button>
                            <input type="number" value="${cant}" min="1" max="${i.limite}" inputmode="numeric" aria-label="Cantidad de ${escapar(i.nombre)}">
                            <button type="button" data-accion="mas" aria-label="Uno más">&plus;</button>
                        </div>
                        <button type="button" class="btn-texto" data-accion="quitar">Eliminar</button>
                    </div>
                </div>
                <b class="carrito-linea-subtotal">${cop(cant * i.precio)}</b></li>`;
        }).join('');
        document.getElementById('carritoUnidades').textContent = `${cantidad} artículo${cantidad === 1 ? '' : 's'}`;
        document.getElementById('carritoTotal').textContent = cop(total);
    }

    // Cambia la cantidad de una línea en el servidor (0 = quitar) y repinta
    async function cambiar(li, nueva) {
        li.classList.add('cargando');
        try {
            const r = await C.fijar(Number(li.dataset.producto), li.dataset.presentacion ? Number(li.dataset.presentacion) : undefined, Math.max(0, nueva));
            if (r.aviso) toast('advertencia', r.aviso);
            pintar(r);
        } catch (e) {
            toast('error', e.message);
            li.classList.remove('cargando');
        }
    }

    lista.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        const li = boton.closest('.carrito-linea');
        const input = li.querySelector('input');
        const actual = input ? Number(input.value) || 1 : 0;
        const accion = boton.dataset.accion;
        cambiar(li, accion === 'quitar' ? 0 : actual + (accion === 'mas' ? 1 : -1));
    });
    lista.addEventListener('change', (e) => {
        if (e.target.matches('input')) cambiar(e.target.closest('.carrito-linea'), Math.floor(Number(e.target.value) || 1));
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
        if (!hayDisponibles) return;
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
                body: JSON.stringify({ desdeCarrito: true, entrega: envio.entrega, domicilio: envio.domicilio })
            });
            const datos = await respuesta.json().catch(() => ({}));
            if (respuesta.ok) {
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

    C.obtener().then((r) => {
        pintar(r);
        if (pagina.dataset.sesion && hayDisponibles && new URLSearchParams(location.search).get('paso') === 'entrega') mostrarEntrega();
    }).catch((e) => toast('error', e.message));
});
