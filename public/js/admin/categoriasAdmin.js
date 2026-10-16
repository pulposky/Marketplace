// =============================================
// GESTIÓN DE CATEGORÍAS - JAVASCRIPT
// =============================================
// Lista, crea, renombra y elimina categorías de
// productos contra /api/admin/categorias.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const cuerpoTabla = document.getElementById('cuerpoTablaCategorias');
    const estadoVacio = document.getElementById('estadoVacioCategorias');
    const inputNueva = document.getElementById('inputNuevaCategoria');
    const btnCrear = document.getElementById('btnCrearCategoria');

    const modalCategoria = document.getElementById('modalCategoria');
    const formCategoria = document.getElementById('formCategoria');
    const categoriaId = document.getElementById('categoriaId');
    const campoNombreCategoria = document.getElementById('campoNombreCategoria');
    const btnCancelarCategoria = document.getElementById('btnCancelarCategoria');

    function escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto === null || texto === undefined ? '' : String(texto);
        return div.innerHTML;
    }

    // -----------------------------------------------
    // CARGAR
    // -----------------------------------------------
    async function cargarCategorias() {
        try {
            const resp = await fetch('/api/admin/categorias');
            const data = await resp.json();

            if (resp.ok && data.ok) {
                dibujarTabla(data.categorias || []);
            } else {
                toast('error', (data && data.mensaje) || 'No se pudieron cargar las categorías.');
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
            toast('error', 'Error de conexión al cargar las categorías.');
        }
    }

    function dibujarTabla(categorias) {
        if (!categorias.length) {
            cuerpoTabla.innerHTML = '';
            estadoVacio.style.display = 'block';
            return;
        }
        estadoVacio.style.display = 'none';

        cuerpoTabla.innerHTML = categorias.map((c) => `
            <tr>
                <td>${escaparHTML(c.nombre)}</td>
                <td>${escaparHTML(c.total_productos)}</td>
                <td>
                    <div class="acciones-fila">
                        <button type="button" class="btn btn-secundario btn-mini" data-accion="renombrar" data-id="${c.id}" data-nombre="${escaparHTML(c.nombre)}">Renombrar</button>
                        <button type="button" class="btn btn-peligro btn-mini" data-accion="eliminar" data-id="${c.id}" data-nombre="${escaparHTML(c.nombre)}">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // -----------------------------------------------
    // CREAR
    // -----------------------------------------------
    btnCrear.addEventListener('click', async () => {
        const nombre = inputNueva.value.trim();
        if (!nombre) {
            toast('advertencia', 'Escribe un nombre para la categoría.');
            return;
        }

        btnCrear.disabled = true;
        try {
            const resp = await fetch('/api/admin/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                toast('exito', data.mensaje || 'Categoría creada.');
                inputNueva.value = '';
                cargarCategorias();
            } else {
                toast('error', (data && data.mensaje) || 'No se pudo crear la categoría.');
            }
        } catch (error) {
            console.error('Error creando categoría:', error);
            toast('error', 'Error de conexión al crear la categoría.');
        } finally {
            btnCrear.disabled = false;
        }
    });

    inputNueva.addEventListener('keydown', (evento) => {
        if (evento.key === 'Enter') {
            evento.preventDefault();
            btnCrear.click();
        }
    });

    // -----------------------------------------------
    // RENOMBRAR (MODAL)
    // -----------------------------------------------
    function abrirModalRenombrar(id, nombre) {
        categoriaId.value = id;
        campoNombreCategoria.value = nombre;
        modalCategoria.classList.add('activo');
        campoNombreCategoria.focus();
    }

    btnCancelarCategoria.addEventListener('click', () => modalCategoria.classList.remove('activo'));

    formCategoria.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        const id = categoriaId.value;
        const nombre = campoNombreCategoria.value.trim();
        if (!nombre) return;

        try {
            const resp = await fetch(`/api/admin/categorias/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                toast('exito', data.mensaje || 'Categoría renombrada.');
                modalCategoria.classList.remove('activo');
                cargarCategorias();
            } else {
                toast('error', (data && data.mensaje) || 'No se pudo renombrar.');
            }
        } catch (error) {
            console.error('Error renombrando categoría:', error);
            toast('error', 'Error de conexión al renombrar.');
        }
    });

    // -----------------------------------------------
    // ELIMINAR
    // -----------------------------------------------
    async function eliminarCategoria(id, nombre) {
        if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;

        try {
            const resp = await fetch(`/api/admin/categorias/${id}`, { method: 'DELETE' });
            const data = await resp.json();

            if (resp.ok && data.ok) {
                toast('exito', data.mensaje || 'Categoría eliminada.');
                cargarCategorias();
            } else {
                toast('error', (data && data.mensaje) || 'No se pudo eliminar.');
            }
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            toast('error', 'Error de conexión al eliminar.');
        }
    }

    // Delegación de eventos.
    cuerpoTabla.addEventListener('click', (evento) => {
        const boton = evento.target.closest('button[data-accion]');
        if (!boton) return;

        const { accion, id, nombre } = boton.dataset;
        if (accion === 'renombrar') abrirModalRenombrar(id, nombre);
        else if (accion === 'eliminar') eliminarCategoria(id, nombre);
    });

    cargarCategorias();
});
