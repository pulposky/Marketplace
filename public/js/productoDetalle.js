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

    // Limito el input según el stock disponible
    const maximo = Number(botonApartar.dataset.limite);
    const esHuevo = botonApartar.dataset.esHuevo === 'true';

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
                    cantidad
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