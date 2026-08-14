document.addEventListener('DOMContentLoaded', () => {
    const inputBuscar = document.querySelector('.campo-busqueda input');
    const selectEstado = document.querySelector('.ordenar-por select');
    const chkDisponibles = document.getElementById('filtro-disponibles');
    const chkAgotados = document.getElementById('filtro-agotados');
    const btnFiltrar = document.querySelector('.boton-filtrar');
    const tarjetas = document.querySelectorAll('.tarjeta-producto');

    // Filtrado local en la vista
    function aplicarFiltros() {
        const busqueda = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        const estadoSeleccionado = selectEstado ? selectEstado.value : 'todos';
        const soloDisponibles = chkDisponibles ? chkDisponibles.checked : false;
        const soloAgotados = chkAgotados ? chkAgotados.checked : false;

        tarjetas.forEach(tarjeta => {
            const nombre = tarjeta.dataset.nombre || '';
            const estado = tarjeta.dataset.estado; // 'activo' o 'inactivo'
            const cantidad = parseInt(tarjeta.dataset.cantidad, 10) || 0;

            const coincideNombre = nombre.includes(busqueda);
            let coincideEstado = estadoSeleccionado === 'todos' || estado === estadoSeleccionado;

            let coincideCantidad = true;
            if (soloDisponibles && !soloAgotados) {
                coincideCantidad = cantidad > 0;
            } else if (soloAgotados && !soloDisponibles) {
                coincideCantidad = cantidad === 0;
            }

            if (coincideNombre && coincideEstado && coincideCantidad) {
                tarjeta.style.display = 'block';
            } else {
                tarjeta.style.display = 'none';
            }
        });
    }

    if (inputBuscar) inputBuscar.addEventListener('input', aplicarFiltros);
    if (selectEstado) selectEstado.addEventListener('change', aplicarFiltros);
    if (btnFiltrar) btnFiltrar.addEventListener('click', aplicarFiltros);

    // Cambiar la cantidad a vender (Guardado en BD)
    document.querySelectorAll('.campo-cantidad').forEach(input => {
        input.addEventListener('change', async (e) => {
            const idProducto = e.target.dataset.id;
            const nuevaCantidad = parseInt(e.target.value, 10);
            const tarjeta = e.target.closest('.tarjeta-producto');
            const checkbox = tarjeta.querySelector('.check-habilitar');

            if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
                alert('Ingresa una cantidad válida');
                return;
            }

            try {
                const response = await fetch(`/api/admin/productos/limite-venta/${idProducto}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cantidad: nuevaCantidad })
                });

                const data = await response.json();

                if (response.ok) {
                    tarjeta.dataset.cantidad = data.limite;
                    tarjeta.dataset.estado = data.estado;
                    if (checkbox) checkbox.checked = (data.estado === 'activo');
                } else {
                    alert(data.error || 'Error al actualizar la cantidad');
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión con el servidor');
            }
        });
    });

    // Switch manual de estado (Guardado en BD)
    document.querySelectorAll('.check-habilitar').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const idProducto = e.target.dataset.id;
            // Buscamos el input de cantidad correspondiente al mismo producto
            const inputCantidad = document.querySelector(`.campo-cantidad[data-id="${idProducto}"]`);
            const cantidad = Number(inputCantidad?.value || 0);

            // Si intenta marcar 'activo' pero la cantidad es 0 o menor
            if (e.target.checked && cantidad <= 0) {
                e.preventDefault();
                e.target.checked = false; // Desmarcamos el checkbox de nuevo
                alert('No puedes habilitar un producto con cantidad 0 o vacía. Ingresa una cantidad válida primero.');
                
                // Opcional: poner el foco en el campo de cantidad para que lo corrija
                if (inputCantidad) inputCantidad.focus();
                return;
            }

            // Aquí continúa tu lógica actual para enviar el cambio de estado al servidor mediante fetch
            actualizarEstadoProducto(idProducto, e.target.checked ? 'activo' : 'inactivo', cantidad);
        });
    });
});