// =============================================
// HABILITAR PRODUCTO - JAVASCRIPT
// =============================================
// Maneja la vista de gestión de productos del admin.
// Permite buscar/filtrar productos, cambiar la cantidad
// a vender, y habilitar/deshabilitar productos con
// un switch. Los cambios se guardan directo en la BD.
//
// Maneja la conversión de cubetas de huevos (x30)
// para que en la BD se guarden unidades reales.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los filtros del DOM
    const inputBuscar = document.querySelector('.campo-busqueda input');
    const selectEstado = document.querySelector('.ordenar-por select');
    const chkDisponibles = document.getElementById('filtro-disponibles');
    const chkAgotados = document.getElementById('filtro-agotados');
    const btnFiltrar = document.querySelector('.boton-filtrar');
    const tarjetas = document.querySelectorAll('.tarjeta-producto');

    // -----------------------------------------------
    // FILTRADO LOCAL DE PRODUCTOS
    // -----------------------------------------------
    // Filtra las tarjetas según la búsqueda, el estado
    // seleccionado y si se quieren disponibles/agotados
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

            // Filtro por cantidad: disponibles (> 0) o agotados (=== 0)
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

    // Asigno los eventos de filtrado
    if (inputBuscar) inputBuscar.addEventListener('input', aplicarFiltros);
    if (selectEstado) selectEstado.addEventListener('change', aplicarFiltros);
    if (btnFiltrar) btnFiltrar.addEventListener('click', aplicarFiltros);

    // -----------------------------------------------
    // CAMBIAR CANTIDAD A VENDER
    // -----------------------------------------------
    // Cuando el admin cambia la cantidad de un producto,
    // hago PATCH a la API con la nueva cantidad.
    // Si es huevo, multiplico por 30 antes de enviar a la BD.
    document.querySelectorAll('.campo-cantidad').forEach(input => {
        input.addEventListener('change', async (e) => {
            const idProducto = e.target.dataset.id;
            const esHuevo = e.target.dataset.esHuevo === 'true';
            const nuevaCantidad = parseInt(e.target.value, 10);
            const tarjeta = e.target.closest('.tarjeta-producto');
            const checkbox = tarjeta.querySelector('.check-habilitar');

            if (isNaN(nuevaCantidad) || nuevaCantidad < 0) {
                toast('advertencia', 'Ingresa una cantidad válida');
                return;
            }

            // Si es huevo, multiplico por 30 para enviar unidades reales a la BD
            const cantidadEnviar = esHuevo ? nuevaCantidad * 30 : nuevaCantidad;

            const nombreProducto = tarjeta.dataset.nombre || 'este producto';
            const confirmar = confirm(`¿Deseas actualizar la cantidad de "${nombreProducto}" a ${nuevaCantidad}?`);
            if (!confirmar) {
                toast('info', 'Cambios cancelados.');
                return;
            }

            try {
                const response = await fetch(`/api/admin/productos/limite-venta/${idProducto}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cantidad: cantidadEnviar })
                });

                const data = await response.json();

                if (response.ok) {
                    // Actualizo los atributos data de la tarjeta para que los filtros funcionen
                    tarjeta.dataset.cantidad = data.limite;
                    tarjeta.dataset.estado = data.estado;
                    if (checkbox) checkbox.checked = (data.estado === 'activo');
                } else {
                    toast('error', data.error || 'Error al actualizar la cantidad');
                }
            } catch (error) {
                console.error(error);
                toast('error', 'Error de conexión con el servidor');
            }
        });
    });

    // -----------------------------------------------
    // SWITCH DE HABILITAR / DESHABILITAR
    // -----------------------------------------------
    // Cuando el admin cambia el switch de estado de un producto,
    // verifico que no esté intentando activar con cantidad 0.
    document.querySelectorAll('.check-habilitar').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const idProducto = e.target.dataset.id;
            const inputCantidad = document.querySelector(`.campo-cantidad[data-id="${idProducto}"]`);
            
            const esHuevo = inputCantidad?.dataset.esHuevo === 'true';
            const cantidad = Number(inputCantidad?.value || 0);

            // No permito activar un producto con cantidad 0
            if (e.target.checked && cantidad <= 0) {
                e.preventDefault();
                e.target.checked = false;
                toast('advertencia', 'No puedes habilitar un producto con cantidad 0 o vacía. Ingresa una cantidad válida primero.');
                
                if (inputCantidad) inputCantidad.focus();
                return;
            }

            const cantidadEnviar = esHuevo ? cantidad * 30 : cantidad;

            // Llamo a la función que hace el PATCH (si existe)
            if (typeof actualizarEstadoProducto === 'function') {
                actualizarEstadoProducto(idProducto, e.target.checked ? 'activo' : 'inactivo', cantidadEnviar);
            } else {
                console.warn('La función actualizarEstadoProducto no está definida en este archivo.');
            }
        });
    });
});
