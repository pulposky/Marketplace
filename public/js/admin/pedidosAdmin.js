// =============================================
// PEDIDOS ADMIN - JAVASCRIPT
// =============================================
// Maneja la vista de pedidos/apartados del admin.
// Carga la lista de apartados pendientes, y permite
// confirmar o cancelar cada uno. Al hacerlo, la card
// se anima y se elimina de la lista.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const contenedorPedidos = document.getElementById('contenedor-pedidos');
    const btnRefrescar = document.getElementById('btnRefrescar');

    // -----------------------------------------------
    // RENDERIZAR LA LISTA DE PEDIDOS
    // -----------------------------------------------
    // Si no hay pedidos, muestro un mensaje vacío.
    // Si hay, armo las cards con la info de cada apartado.
    function renderizarPedidos(pedidos) {
        if (!pedidos || pedidos.length === 0) {
            contenedorPedidos.innerHTML = `
                <div class="estado-vacio">
                    <h3>No hay pedidos pendientes</h3>
                    <p>Cuando los clientes realicen pedidos, apareceran aqui.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="lista-pedidos">';
        pedidos.forEach(function(item) {
            html += `
                <div class="pedido-card" data-id="${item.id_apartado}">
                    <div class="pedido-info">
                        <div class="pedido-campo">
                            <span class="campo-label">Cliente</span>
                            <span class="campo-valor">${item.nombre_cliente}</span>
                        </div>
                        <div class="pedido-campo">
                            <span class="campo-label">Producto</span>
                            <span class="campo-valor">${item.nombre_producto}</span>
                        </div>
                        <div class="pedido-campo">
                            <span class="campo-label">Cantidad</span>
                            <span class="campo-valor">${item.cantidad} ${item.unidad || 'ud'}</span>
                        </div>
                    </div>
                    <div class="pedido-acciones">
                        <button class="btn-confirmar" data-id="${item.id_apartado}">Confirmar</button>
                        <button class="btn-cancelar-admin" data-id="${item.id_apartado}">Cancelar</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        contenedorPedidos.innerHTML = html;
    }

    // -----------------------------------------------
    // CARGAR PEDIDOS DESDE LA API
    // -----------------------------------------------
    async function cargarPedidos() {
        btnRefrescar.disabled = true;
        btnRefrescar.textContent = 'Cargando...';

        try {
            const respuesta = await fetch('/api/admin/apartados');
            if (!respuesta.ok) throw new Error('Error al cargar pedidos');

            const pedidos = await respuesta.json();
            renderizarPedidos(pedidos);
        } catch (error) {
            console.error('Error:', error);
            contenedorPedidos.innerHTML = `
                <div class="estado-vacio">
                    <h3>Error al cargar pedidos</h3>
                    <p>${error.message}</p>
                </div>
            `;
        } finally {
            btnRefrescar.disabled = false;
            btnRefrescar.textContent = 'Refrescar';
        }
    }

    // -----------------------------------------------
    // CONFIRMAR UN PEDIDO
    // -----------------------------------------------
    // Hace PATCH a la API, y si sale bien la card se
    // desliza hacia la derecha y se elimina con animación
    async function confirmarPedido(id) {
        try {
            const respuesta = await fetch(`/api/admin/apartados/confirmar/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                // Animación de salida: la card se va hacia la derecha
                const card = contenedorPedidos.querySelector(`[data-id="${id}"]`);
                if (card) {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(30px)';
                    setTimeout(() => card.remove(), 300);
                }
                // Después de la animación, verifico si quedan pedidos
                setTimeout(() => {
                    const cards = contenedorPedidos.querySelectorAll('.pedido-card');
                    if (cards.length === 0) {
                        contenedorPedidos.innerHTML = `
                            <div class="estado-vacio">
                                <h3>No hay pedidos pendientes</h3>
                                <p>Cuando los clientes realicen pedidos, apareceran aqui.</p>
                            </div>
                        `;
                    }
                }, 350);
            } else {
                toast('error', data.error || 'Error al confirmar el pedido.');
            }
        } catch (error) {
            console.error('Error:', error);
            toast('error', 'Error de conexion con el servidor.');
        }
    }

    // -----------------------------------------------
    // CANCELAR UN PEDIDO
    // -----------------------------------------------
    // Similar a confirmar, pero la card se va hacia la izquierda
    async function cancelarPedido(id) {
        try {
            const respuesta = await fetch(`/api/admin/apartados/cancelar/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                // Animación de salida: la card se va hacia la izquierda
                const card = contenedorPedidos.querySelector(`[data-id="${id}"]`);
                if (card) {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(-30px)';
                    setTimeout(() => card.remove(), 300);
                }
                setTimeout(() => {
                    const cards = contenedorPedidos.querySelectorAll('.pedido-card');
                    if (cards.length === 0) {
                        contenedorPedidos.innerHTML = `
                            <div class="estado-vacio">
                                <h3>No hay pedidos pendientes</h3>
                                <p>Cuando los clientes realicen pedidos, apareceran aqui.</p>
                            </div>
                        `;
                    }
                }, 350);
            } else {
                toast('error', data.error || 'Error al cancelar el pedido.');
            }
        } catch (error) {
            console.error('Error:', error);
            toast('error', 'Error de conexion con el servidor.');
        }
    }

    // -----------------------------------------------
    // EVENTOS DE CLICK EN BOTONES
    // -----------------------------------------------
    // Uso delegación de eventos: un solo listener en el contenedor
    // y verifico qué botón se clickeó con closest()
    contenedorPedidos.addEventListener('click', (e) => {
        const btnConfirmar = e.target.closest('.btn-confirmar');
        if (btnConfirmar) {
            const id = btnConfirmar.dataset.id;
            if (confirm('Confirmar este pedido?')) {
                confirmarPedido(id);
            }
            return;
        }

        const btnCancelar = e.target.closest('.btn-cancelar-admin');
        if (btnCancelar) {
            const id = btnCancelar.dataset.id;
            if (confirm('Cancelar este pedido? El stock sera devuelto.')) {
                cancelarPedido(id);
            }
            return;
        }
    });

    // Botón de refrescar: vuelve a cargar los pedidos desde la API
    btnRefrescar.addEventListener('click', cargarPedidos);

});
