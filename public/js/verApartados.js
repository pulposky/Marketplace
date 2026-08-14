document.addEventListener('DOMContentLoaded', () => {
    const botonesCancelar = document.querySelectorAll('.btn-accion-cancelar');

    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', async (e) => {
            const idApartado = boton.dataset.id || boton.getAttribute('data-id');

            if (!idApartado) return;

            const confirmar = confirm('¿Deseas cancelar este apartado?');
            if (!confirmar) return;

            try {
                const respuesta = await fetch(`/api/apartados/cancelar/${idApartado}`, {
                    method: 'POST', // o 'DELETE' según tu API
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await respuesta.json();

                if (respuesta.ok) {
                    alert(data.mensaje || 'Apartado cancelado correctamente.');
                    const tarjeta = document.getElementById(`apartado-${idApartado}`);
                    if (tarjeta) tarjeta.remove();

                    if (document.querySelectorAll('.tarjeta-producto').length === 0) {
                        window.location.reload();
                    }
                } else {
                    alert(data.error || 'Error al cancelar el apartado.');
                }
            } catch (error) {
                console.error('Error al cancelar el apartado:', error);
            }
        });
    });
});