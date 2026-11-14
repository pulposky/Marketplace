// =============================================
// FICHA DE PRODUCTO - JAVASCRIPT
// =============================================
// Permite apartar el producto desde la ficha.
// Valida la cantidad, envía la petición a
// /api/apartar-producto y muestra el resultado.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    const botonApartar = document.getElementById('btnApartarDetalle');
    const inputCantidad = document.getElementById('cantidadDetalle');

    if (!botonApartar || !inputCantidad) return;

    // Stock en unidades mínimas; la presentación elegida (si hay) define el factor
    const stockUnidades = Number(botonApartar.dataset.limite) || 0;
    const precioUnitario = Number(botonApartar.dataset.precioUnitario) || 0;
    // Presentación elegida (botones de radio); sin presentaciones se vende por unidad mínima
    const elegida = () => document.querySelector('input[name="presentacionDetalle"]:checked');
    const textoCantidad = document.getElementById('cantDisponiblesDetalle');
    const textoUnidad = document.getElementById('unidadDisponiblesDetalle');
    const textoPrecio = document.getElementById('fichaPrecio');
    const textoEtiqueta = document.getElementById('fichaEtiqueta');
    let maximo = stockUnidades;

    // Recalcula máximo, disponibles y precio según la presentación elegida.
    // El precio es solo informativo: el servidor lo recalcula al apartar.
    const actualizarPresentacion = () => {
        const opcion = elegida();
        const factor = opcion ? Number(opcion.dataset.factor) || 1 : 1;
        const nombre = opcion ? opcion.dataset.nombre : (botonApartar.dataset.unidad || 'unidad');
        maximo = Math.floor(stockUnidades / factor);
        inputCantidad.max = maximo;
        if (Number(inputCantidad.value) > maximo) inputCantidad.value = Math.max(1, maximo);
        if (textoCantidad) textoCantidad.textContent = maximo;
        if (textoUnidad) textoUnidad.textContent = nombre;
        if (textoPrecio) textoPrecio.textContent = `$${(precioUnitario * factor).toLocaleString('es-CO')}`;
        if (textoEtiqueta) textoEtiqueta.textContent = `/ ${nombre}`;
    };
    document.querySelectorAll('input[name="presentacionDetalle"]').forEach((radio) => {
        radio.addEventListener('change', actualizarPresentacion);
    });
    actualizarPresentacion();

    botonApartar.addEventListener('click', async () => {

        const cantidad = Math.max(1, Math.floor(Number(inputCantidad.value) || 1));

        if (maximo > 0 && cantidad > maximo) {
            toast('advertencia', `Solo hay ${maximo} disponibles para apartar.`);
            return;
        }

        botonApartar.disabled = true;
        botonApartar.textContent = 'Apartando...';

        try {
            const respuesta = await fetch('/api/apartar-producto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productoId: botonApartar.dataset.id,
                    cantidad,
                    presentacionId: elegida() ? Number(elegida().value) : undefined
                })
            });

            let data = {};
            try {
                data = await respuesta.json();
            } catch (errorJSON) {
                console.error('Respuesta no JSON:', errorJSON);
            }

            if (respuesta.ok) {
                toast('exito', data.mensaje || '¡Producto apartado con éxito!');
                setTimeout(() => {
                    window.location.href = '/verApartados';
                }, 1600);
            } else {
                botonApartar.disabled = false;
                botonApartar.textContent = 'Apartar';
                toast('error', data.error || data.mensaje || 'No se pudo apartar el producto.');
            }
        } catch (error) {
            console.error('Error al apartar:', error);
            botonApartar.disabled = false;
            botonApartar.textContent = 'Apartar';
            toast('error', 'Error de conexión con el servidor.');
        }
    });
});