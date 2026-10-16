// =============================================
// AUDITORÍA - JAVASCRIPT
// =============================================
// Carga el registro de acciones del panel con
// filtros (texto y tipo) y paginación desde
// /api/admin/auditoria.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const cuerpoTabla = document.getElementById('cuerpoTablaAuditoria');
    const estadoVacio = document.getElementById('estadoVacioAuditoria');
    const inputBuscar = document.getElementById('inputBuscarAuditoria');
    const selectAccion = document.getElementById('selectAccion');
    const btnAnterior = document.getElementById('btnPaginaAnterior');
    const btnSiguiente = document.getElementById('btnPaginaSiguiente');
    const textoPagina = document.getElementById('textoPagina');

    let paginaActual = 1;
    let totalPaginas = 1;
    let accionesCargadas = false;

    function escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto === null || texto === undefined ? '' : String(texto);
        return div.innerHTML;
    }

    // Formatea la fecha que llega de MySQL (ISO) a algo legible.
    function formatearFecha(valor) {
        if (!valor) return '';
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) return valor;
        return fecha.toLocaleString('es-CO', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // -----------------------------------------------
    // CARGAR
    // -----------------------------------------------
    async function cargarAuditoria() {
        const params = new URLSearchParams();
        if (inputBuscar.value.trim()) params.set('buscar', inputBuscar.value.trim());
        if (selectAccion.value) params.set('accion', selectAccion.value);
        params.set('pagina', paginaActual);

        try {
            const resp = await fetch('/api/admin/auditoria?' + params.toString());
            const data = await resp.json();

            if (!resp.ok || !data.ok) {
                toast('error', (data && data.mensaje) || 'No se pudo cargar la auditoría.');
                return;
            }

            // Lleno el filtro de acciones una sola vez.
            if (!accionesCargadas && Array.isArray(data.acciones)) {
                data.acciones.forEach((accion) => {
                    const opcion = document.createElement('option');
                    opcion.value = accion;
                    opcion.textContent = accion;
                    selectAccion.appendChild(opcion);
                });
                accionesCargadas = true;
            }

            totalPaginas = data.totalPaginas || 1;
            dibujarTabla(data.registros || []);
            actualizarPaginacion();
        } catch (error) {
            console.error('Error cargando auditoría:', error);
            toast('error', 'Error de conexión al cargar la auditoría.');
        }
    }

    function dibujarTabla(registros) {
        if (!registros.length) {
            cuerpoTabla.innerHTML = '';
            estadoVacio.style.display = 'block';
            return;
        }
        estadoVacio.style.display = 'none';

        cuerpoTabla.innerHTML = registros.map((r) => `
            <tr>
                <td>${escaparHTML(formatearFecha(r.fecha))}</td>
                <td>${escaparHTML(r.usuario || 'sistema')}</td>
                <td><span class="badge badge-accion">${escaparHTML(r.accion)}</span></td>
                <td>${escaparHTML(r.detalle || '')}</td>
            </tr>
        `).join('');
    }

    function actualizarPaginacion() {
        textoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
        btnAnterior.disabled = paginaActual <= 1;
        btnSiguiente.disabled = paginaActual >= totalPaginas;
    }

    // -----------------------------------------------
    // FILTROS Y PAGINACIÓN
    // -----------------------------------------------
    let temporizador;
    inputBuscar.addEventListener('input', () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
            paginaActual = 1;
            cargarAuditoria();
        }, 300);
    });

    selectAccion.addEventListener('change', () => {
        paginaActual = 1;
        cargarAuditoria();
    });

    btnAnterior.addEventListener('click', () => {
        if (paginaActual > 1) {
            paginaActual--;
            cargarAuditoria();
        }
    });

    btnSiguiente.addEventListener('click', () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            cargarAuditoria();
        }
    });

    cargarAuditoria();
});
