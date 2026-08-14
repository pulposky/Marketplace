document.addEventListener('DOMContentLoaded', () => {

    document.addEventListener('click', async (e) => {
        const boton = e.target.closest('.btn-accion-cancelar');

        if (!boton) return;

        e.preventDefault();

        const idApartado = boton.dataset.id || boton.getAttribute('data-id');

        if (!idApartado) {
            alert('Error: El botón no tiene un ID asociado (data-id está vacío).');
            return;
        }

        const confirmar = confirm(`¿Deseas cancelar el apartado #${idApartado}?`);
        if (!confirmar) return;

        try {
            // Revisa si tu ruta en Express es POST o DELETE
            const respuesta = await fetch(`/api/apartados/cancelar/${idApartado}`, {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json'
                }
            });

            console.log('Status HTTP:', respuesta.status);

            // Intentamos parsear la respuesta como JSON
            let data;
            try {
                data = await respuesta.json();
            } catch (jsonErr) {
                data = {};
            }

            if (respuesta.ok) {
                alert(data.mensaje || 'Apartado cancelado correctamente.');
                window.location.reload();
            } else {
                // Alerta con el error exacto que envía el servidor o el status HTTP
                alert(`Error ${respuesta.status}: ${data.error || data.mensaje || 'No se pudo procesar la solicitud en el servidor.'}`);
            }
        } catch (error) {
            console.error('Error de red o ejecución:', error);
            alert('Error de conexión con el servidor (Revisa la consola con F12).');
        }
    });

});