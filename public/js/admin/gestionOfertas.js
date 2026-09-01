// =============================================
// GESTIÓN DE OFERTAS - JAVASCRIPT
// =============================================
// Panel admin para configurar el precio y el descuento
// de cada producto. Cada tarjeta tiene su propio botón
// "Guardar" (bajo las fechas) que guarda precio +
// descuento + fechas de vigencia de ese producto.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const inputBuscar = document.getElementById('busqueda-oferta');
    const tarjetas = document.querySelectorAll('.tarjeta-producto');

    // -----------------------------------------------
    // FILTROS: BÚSQUEDA + SOLO EN OFERTA
    // -----------------------------------------------
    function aplicarFiltros() {
        const texto = (inputBuscar?.value || '').trim().toLowerCase();
        const soloOferta = filtroSoloOferta?.checked;

        tarjetas.forEach((tarjeta) => {
            const nombre = tarjeta.dataset.nombre || '';
            const enOferta = tarjeta.dataset.enOferta === 'true';

            let visible = nombre.includes(texto);
            // Si está activo el filtro de ofertas, solo se muestran las que están en oferta
            if (visible && soloOferta) {
                visible = enOferta;
            }
            tarjeta.style.display = visible ? '' : 'none';
        });
    }

    const filtroSoloOferta = document.getElementById('filtro-solo-oferta');

    if (inputBuscar) {
        inputBuscar.addEventListener('input', aplicarFiltros);
    }
    if (filtroSoloOferta) {
        filtroSoloOferta.addEventListener('change', aplicarFiltros);
    }

    // -----------------------------------------------
    // GUARDAR PRODUCTO (precio + oferta)
    // -----------------------------------------------
    function guardarProducto(idProducto, boton) {
        const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${idProducto}"]`);
        const inputPrecio = document.querySelector(`.campo-precio[data-id="${idProducto}"]`);
        const inputDescuento = document.querySelector(`.campo-descuento[data-id="${idProducto}"]`);
        const inputInicio = document.querySelector(`.campo-fecha[data-id="${idProducto}"][data-tipo="inicio"]`);
        const inputFin = document.querySelector(`.campo-fecha[data-id="${idProducto}"][data-tipo="fin"]`);
        const nombreProducto = tarjeta?.dataset?.nombre || 'este producto';
        const esHuevo = tarjeta?.dataset?.esHuevo === 'true';

        // --- Precio ---
        const precioMostrado = parseFloat(inputPrecio?.value);
        if (isNaN(precioMostrado) || precioMostrado < 0) {
            toast('advertencia', 'Pon un precio válido.');
            return;
        }
        // Si es huevo, el campo muestra precio por cubeta; se divide entre 30
        const precioReal = esHuevo ? precioMostrado / 30 : precioMostrado;

        // --- Descuento ---
        const descuento = parseFloat(inputDescuento?.value ?? 0) || 0;
        if (isNaN(descuento) || descuento < 0 || descuento > 99.99) {
            toast('advertencia', 'El descuento debe estar entre 0 y 99.99.');
            return;
        }

        // --- Fechas ---
        const convertirFecha = (valor) => {
            if (!valor) return '';
            const d = new Date(valor);
            if (isNaN(d.getTime())) return '';
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };
        const fechaInicio = convertirFecha(inputInicio?.value);
        const fechaFin = convertirFecha(inputFin?.value);

        if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
            toast('advertencia', 'La fecha de inicio no puede ser posterior a la de fin.');
            return;
        }

        const textoPrecio = `$${precioMostrado.toLocaleString('es-CO')}`;
        const confirmar = confirm(
            `Guardar los cambios de "${nombreProducto}"?\n\n` +
            `Precio: ${textoPrecio}\n` +
            `Descuento: ${descuento}%\n` +
            (fechaInicio || fechaFin ? 'Con fechas de vigencia configuradas.' : 'Oferta sin fecha límite.')
        );
        if (!confirmar) {
            toast('info', 'Cambios cancelados.');
            return;
        }

        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Guardando...';
        }

        const guardarPrecio = fetch(`/api/admin/ofertas/precio/${idProducto}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ precio: precioReal })
        });
        const guardarOferta = fetch(`/api/admin/ofertas/${idProducto}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descuento, fechaInicio, fechaFin })
        });

        Promise.all([guardarPrecio, guardarOferta])
            .then(async (respuestas) => {
                for (const respuesta of respuestas) {
                    const data = await respuesta.json().catch(() => ({}));
                    if (!respuesta.ok) {
                        throw new Error(data.error || 'Error al guardar los cambios.');
                    }
                }
                toast('exito', 'Cambios guardados correctamente.');
                setTimeout(() => window.location.reload(), 900);
            })
            .catch((error) => {
                console.error('Error guardando:', error);
                if (boton) {
                    boton.disabled = false;
                    boton.textContent = 'Guardar';
                }
                toast('error', error.message || 'Error de conexión con el servidor.');
            });
    }

    // -----------------------------------------------
    // CANCELAR OFERTA
    // -----------------------------------------------
    // Quita la oferta de un producto: deja el descuento en 0
    // y limpia las fechas (sin tocar el precio).
    function cancelarOferta(idProducto, boton) {
        const tarjeta = document.querySelector(`.tarjeta-producto[data-id="${idProducto}"]`);
        const nombreProducto = tarjeta?.dataset?.nombre || 'este producto';

        const confirmar = confirm(`¿Cancelar la oferta de "${nombreProducto}"?`);
        if (!confirmar) {
            toast('info', 'Cancelado.');
            return;
        }

        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Cancelando...';
        }

        fetch(`/api/admin/ofertas/${idProducto}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descuento: 0, fechaInicio: '', fechaFin: '' })
        })
            .then(async (respuesta) => {
                const data = await respuesta.json().catch(() => ({}));
                if (!respuesta.ok) {
                    throw new Error(data.error || 'Error al cancelar la oferta.');
                }
                toast('exito', data.mensaje || 'Oferta cancelada correctamente.');
                setTimeout(() => window.location.reload(), 900);
            })
            .catch((error) => {
                console.error('Error cancelando oferta:', error);
                if (boton) {
                    boton.disabled = false;
                    boton.textContent = 'Cancelar oferta';
                }
                toast('error', error.message || 'Error de conexión con el servidor.');
            });
    }

    // Botón de guardar de cada tarjeta
    document.querySelectorAll('.btn-guardar-oferta').forEach((boton) => {
        boton.addEventListener('click', () => guardarProducto(boton.dataset.id, boton));
    });

    // Botón de cancelar oferta de cada tarjeta
    document.querySelectorAll('.btn-cancelar-oferta').forEach((boton) => {
        boton.addEventListener('click', () => cancelarOferta(boton.dataset.id, boton));
    });
});
