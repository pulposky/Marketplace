// =============================================
// GESTIÓN DE CLIENTES - JAVASCRIPT
// =============================================
// Vista del admin para ver, buscar y editar
// clientes registrados.
//   - Carga la lista desde /api/admin/clientes
//   - Búsqueda en vivo por nombre o documento
//   - Editar nombre/teléfono/dirección en un modal
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const cuerpoTabla = document.getElementById('cuerpoTablaClientes');
    const estadoVacio = document.getElementById('estadoVacioClientes');
    const inputBuscar = document.getElementById('inputBuscarCliente');
    const btnRefrescar = document.getElementById('btnRefrescar');

    const modalEditar = document.getElementById('modalEditarCliente');
    const btnCerrarModal = document.getElementById('cerrarModalCliente');
    const infoModal = document.getElementById('modalInfoCliente');
    const formularioEditar = document.getElementById('formEditarCliente');
    const btnGuardar = document.getElementById('btnGuardarCliente');

    // Cliente que se está editando actualmente
    let clienteEditando = null;

    // -----------------------------------------------
    // UTILIDADES
    // -----------------------------------------------
    function escaparHTML(texto) {
        return String(texto ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    // -----------------------------------------------
    // RENDERIZAR LA TABLA
    // -----------------------------------------------
    function renderizarTabla(clientes) {
        if (!clientes || clientes.length === 0) {
            cuerpoTabla.innerHTML = '';
            estadoVacio.style.display = 'block';
            return;
        }

        estadoVacio.style.display = 'none';

        let filas = '';
        clientes.forEach((cliente) => {
            filas += `
                <tr data-id="${cliente.id}">
                    <td class="td-nombre">${escaparHTML(cliente.nombre)}</td>
                    <td>${escaparHTML(cliente.documento)}</td>
                    <td>${escaparHTML(cliente.telefono || '—')}</td>
                    <td class="td-direccion">${escaparHTML(cliente.direccion || '—')}</td>
                    <td><span class="badge-rol">${escaparHTML(cliente.rol || 'cliente')}</span></td>
                    <td class="td-centro">${Number(cliente.total_pedidos || 0)}</td>
                    <td class="td-centro">${Number(cliente.total_compras || 0)}</td>
                    <td class="td-centro">
                        <button class="btn-editar-cliente"
                            data-id="${cliente.id}"
                            data-nombre="${escaparHTML(cliente.nombre)}"
                            data-telefono="${escaparHTML(cliente.telefono || '')}"
                            data-direccion="${escaparHTML(cliente.direccion || '')}">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        });

        cuerpoTabla.innerHTML = filas;
    }

    // -----------------------------------------------
    // CARGAR CLIENTES DESDE LA API
    // -----------------------------------------------
    async function cargarClientes() {
        try {
            const busqueda = inputBuscar?.value.trim() || '';
            const respuesta = await fetch(`/api/admin/clientes?busqueda=${encodeURIComponent(busqueda)}`);
            if (!respuesta.ok) throw new Error('Error al cargar clientes');

            const clientes = await respuesta.json();
            renderizarTabla(clientes);
        } catch (error) {
            console.error('Error:', error);
            toast('error', 'No se pudo cargar la lista de clientes.');
        }
    }

    // Búsqueda en vivo con debounce para no golpear la API en cada tecla
    let temporizadorBusqueda = null;
    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            clearTimeout(temporizadorBusqueda);
            temporizadorBusqueda = setTimeout(cargarClientes, 300);
        });
    }

    if (btnRefrescar) {
        btnRefrescar.addEventListener('click', () => {
            if (inputBuscar) inputBuscar.value = '';
            cargarClientes();
        });
    }

    // -----------------------------------------------
    // ABRIR / CERRAR MODAL DE EDICIÓN
    // -----------------------------------------------
    function abrirModal(cliente) {
        clienteEditando = cliente;

        document.getElementById('editarNombre').value = cliente.nombre || '';
        document.getElementById('editarTelefono').value = cliente.telefono || '';
        document.getElementById('editarDireccion').value = cliente.direccion || '';

        infoModal.textContent = `Documento: ${cliente.documento}`;
        modalEditar.style.display = 'flex';
    }

    function cerrarModal() {
        clienteEditando = null;
        modalEditar.style.display = 'none';
    }

    cuerpoTabla.addEventListener('click', (e) => {
        const boton = e.target.closest('.btn-editar-cliente');
        if (!boton) return;

        abrirModal({
            id: boton.dataset.id,
            documento: boton.closest('tr').querySelector('.td-nombre')?.nextElementSibling?.textContent || '',
            nombre: boton.dataset.nombre,
            telefono: boton.dataset.telefono,
            direccion: boton.dataset.direccion
        });
    });

    if (btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

    window.addEventListener('click', (evento) => {
        if (evento.target === modalEditar) cerrarModal();
    });

    // -----------------------------------------------
    // GUARDAR CAMBIOS DEL CLIENTE
    // -----------------------------------------------
    formularioEditar.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        if (!clienteEditando) return;

        const nombre = document.getElementById('editarNombre').value.trim();
        const telefono = document.getElementById('editarTelefono').value.trim();
        const direccion = document.getElementById('editarDireccion').value.trim();

        if (!nombre) {
            toast('advertencia', 'El nombre no puede estar vacío.');
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        try {
            const respuesta = await fetch(`/api/admin/clientes/${clienteEditando.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, telefono, direccion })
            });

            let data = {};
            try {
                data = await respuesta.json();
            } catch (errorJSON) {
                console.error('Respuesta no JSON:', errorJSON);
            }

            if (respuesta.ok && data.ok) {
                toast('exito', data.mensaje || 'Cliente actualizado correctamente.');
                cerrarModal();
                cargarClientes();
            } else {
                toast('error', data.mensaje || 'No se pudo actualizar el cliente.');
            }
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            toast('error', 'Error de conexión con el servidor.');
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar cambios';
        }
    });

    // Carga inicial
    cargarClientes();

});
