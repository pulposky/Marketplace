// =============================================
// PANEL DE ADMINISTRACIÓN - JAVASCRIPT PRINCIPAL
// =============================================
// Este archivo maneja todo lo relacionado con las
// notificaciones del admin:
//   - Sonido cuando llega una notificación nueva
//   - Campana con badge de conteo
//   - Dropdown con lista de notificaciones
//   - Toast que aparece en pantalla
//   - Polling cada 10 segundos para buscar nuevas
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos del DOM
    const campanaBoton = document.getElementById('campanaBoton');
    const campanaBadge = document.getElementById('campanaBadge');
    const campanaDropdown = document.getElementById('campanaDropdown');
    const dropdownLista = document.getElementById('dropdownLista');
    const btnMarcarTodas = document.getElementById('btnMarcarTodas');
    const toast = document.getElementById('toastNotificacion');
    const toastTitulo = toast.querySelector('.toast-titulo');
    const toastMensaje = toast.querySelector('.toast-mensaje');
    const toastCerrar = toast.querySelector('.toast-cerrar');

    let notificacionesVistas = new Set(); // Guardo los IDs que ya vi para no repetir toasts
    let dropdownAbierto = false;
    let toastTimeout = null;

    // -----------------------------------------------
    // SONIDO DE NOTIFICACIÓN
    // -----------------------------------------------
    // Genero un acorde ascendente (C5, E5, G5) con la
    // Web Audio API. No necesito archivos de audio,
    // el sonido se crea directamente en el navegador.
    function reproducirSonidoNotificacion() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notas = [523.25, 659.25, 783.99]; // C5, E5, G5
            notas.forEach((frecuencia, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = frecuencia;
                // Cada nota empieza con volumen 0.3 y se apaga gradualmente
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 0.4);
            });
        } catch (e) {
            console.warn('No se pudo reproducir sonido de notificación:', e);
        }
    }

    // -----------------------------------------------
    // ABRIR / CERRAR DROPDOWN DE LA CAMPANA
    // -----------------------------------------------
    campanaBoton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownAbierto = !dropdownAbierto;
        campanaDropdown.classList.toggle('abierto', dropdownAbierto);
    });

    // Si hago click afuera del dropdown, se cierra
    document.addEventListener('click', () => {
        dropdownAbierto = false;
        campanaDropdown.classList.remove('abierto');
    });

    // Que el click dentro del dropdown no lo cierre
    campanaDropdown.addEventListener('click', (e) => e.stopPropagation());

    // -----------------------------------------------
    // TOAST DE NOTIFICACIÓN
    // -----------------------------------------------
    // Muestra el toast con el título y mensaje, y lo oculta
    // automáticamente después de 5 segundos
    function mostrarToast(titulo, mensaje) {
        toastTitulo.textContent = titulo;
        toastMensaje.textContent = mensaje;
        toast.classList.add('visible');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 5000);
    }

    // Botón X para cerrar el toast manualmente
    toastCerrar.addEventListener('click', () => {
        toast.classList.remove('visible');
        if (toastTimeout) clearTimeout(toastTimeout);
    });

    // -----------------------------------------------
    // RENDERIZAR LISTA DE NOTIFICACIONES EN EL DROPDOWN
    // -----------------------------------------------
    function renderizarNotificaciones(notificaciones) {
        if (!notificaciones || notificaciones.length === 0) {
            dropdownLista.innerHTML = '<p class="dropdown-vacio">Sin notificaciones nuevas</p>';
            return;
        }

        let html = '';
        notificaciones.forEach((n) => {
            const fecha = new Date(n.fecha);
            const hora = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
            const fechaStr = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
            html += `
                <div class="notificacion-item" data-id="${n.id}">
                    <div class="notif-titulo">${n.titulo}</div>
                    <p class="notif-mensaje">${n.mensaje}</p>
                    <div class="notif-hora">${fechaStr} ${hora}</div>
                </div>
            `;
        });
        dropdownLista.innerHTML = html;
    }

    // -----------------------------------------------
    // ACTUALIZAR BADGE (conteo de no leídas)
    // -----------------------------------------------
    function actualizarBadge(total) {
        if (total > 0) {
            campanaBadge.textContent = total > 99 ? '99+' : total;
            campanaBadge.classList.add('visible');
        } else {
            campanaBadge.classList.remove('visible');
        }
    }

    // -----------------------------------------------
    // CONSULTAR NOTIFICACIONES (polling cada 10s)
    // -----------------------------------------------
    // Hace fetch al endpoint de notificaciones, actualiza
    // el badge, renderiza la lista, y si hay alguna nueva
    // muestra el toast + suena el sonido.
    async function consultarNotificaciones() {
        try {
            const resp = await fetch('/api/admin/notificaciones');
            if (!resp.ok) return;
            const data = await resp.json();

            actualizarBadge(data.total);
            renderizarNotificaciones(data.notificaciones);

            // Detecto si hay notificaciones nuevas que no había visto antes
            let notificacionNueva = false;
            data.notificaciones.forEach((n) => {
                if (!notificacionesVistas.has(n.id)) {
                    notificacionesVistas.add(n.id);
                    // En la primera carga no muestro toast (para que no salten todas las que ya estaban)
                    if (notificacionesVistas.size > 1) {
                        mostrarToast(n.titulo, n.mensaje);
                        notificacionNueva = true;
                    }
                }
            });
            // Si llegaron notificaciones nuevas, suena el sonido
            if (notificacionNueva) reproducirSonidoNotificacion();

            // Marco las de la primera carga como vistas sin mostrar toast
            if (data.notificaciones.length > 0 && notificacionesVistas.size === 0) {
                data.notificaciones.forEach((n) => notificacionesVistas.add(n.id));
            }
        } catch (error) {
            console.error('Error consultando notificaciones:', error);
        }
    }

    // -----------------------------------------------
    // MARCAR COMO LEÍDA AL HACER CLICK EN UNA NOTIFICACIÓN
    // -----------------------------------------------
    dropdownLista.addEventListener('click', async (e) => {
        const item = e.target.closest('.notificacion-item');
        if (!item) return;

        const id = item.dataset.id;
        try {
            await fetch(`/api/admin/notificaciones/${id}/leida`, { method: 'PATCH' });
            // Atenuo visualmente la notificación para que se vea que ya la leí
            item.style.opacity = '0.5';
            item.style.transition = 'opacity 0.3s';
        } catch (err) {
            console.error('Error:', err);
        }
    });

    // -----------------------------------------------
    // MARCAR TODAS COMO LEÍDAS
    // -----------------------------------------------
    btnMarcarTodas.addEventListener('click', async () => {
        try {
            await fetch('/api/admin/notificaciones/todas-leidas', { method: 'PATCH' });
            // Limpio el badge y la lista
            campanaBadge.classList.remove('visible');
            dropdownLista.innerHTML = '<p class="dropdown-vacio">Sin notificaciones nuevas</p>';
            notificacionesVistas.clear();
        } catch (err) {
            console.error('Error:', err);
        }
    });

    // -----------------------------------------------
    // MÉTRICAS EN VIVO DEL DASHBOARD
    // -----------------------------------------------
    // Consulta los endpoints y actualiza las tarjetas
    // de estadísticas de la vista principal.
    async function cargarMetricas() {
        // Productos activos (catálogo público /api/productos).
        // Solo cuento los que están activos (estado === 'activo'),
        // para no inflar el número con productos desactivados.
        try {
            const resp = await fetch('/api/productos');
            if (resp.ok) {
                const datos = await resp.json();
                const activos = Array.isArray(datos)
                    ? datos.filter((p) => String(p.estado).toLowerCase() === 'activo').length
                    : 0;
                const el = document.getElementById('statProductos');
                if (el) el.textContent = activos;
            }
        } catch (e) { /* silencioso */ }

        // Pedidos pendientes
        try {
            const resp = await fetch('/api/admin/apartados?estado=pendiente');
            if (resp.ok) {
                const datos = await resp.json();
                const el = document.getElementById('statPedidos');
                if (el) el.textContent = Array.isArray(datos) ? datos.length : 0;
            }
        } catch (e) { /* silencioso */ }

        // Ofertas activas (solo productos activos con oferta vigente)
        try {
            const resp = await fetch('/api/admin/ofertas');
            if (resp.ok) {
                const datos = await resp.json();
                const activas = Array.isArray(datos)
                    ? datos.filter((p) => String(p.estado).toLowerCase() === 'activo').length
                    : 0;
                const el = document.getElementById('statOfertas');
                if (el) el.textContent = activas;
            }
        } catch (e) { /* silencioso */ }

        // Notificaciones sin leer
        try {
            const resp = await fetch('/api/admin/notificaciones');
            if (resp.ok) {
                const datos = await resp.json();
                const el = document.getElementById('statNotificaciones');
                if (el) el.textContent = datos.total != null ? datos.total : 0;
            }
        } catch (e) { /* silencioso */ }
    }

    // -----------------------------------------------
    // INICIO: Primera carga + polling cada 10 segundos
    // -----------------------------------------------
    cargarMetricas();
    consultarNotificaciones();
    setInterval(consultarNotificaciones, 10000);
    setInterval(cargarMetricas, 30000);
});
