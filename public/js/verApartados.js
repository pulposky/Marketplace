// =============================================
// VER APARTADOS - JAVASCRIPT (CLIENTE)
// =============================================
// Maneja la vista "mis apartados" del cliente.
// Permite cancelar un apartado propio haciendo
// click en el botón de cancelar. Se confirma
// con un confirm() antes de enviar a la API.
// =============================================

document.addEventListener('DOMContentLoaded', () => {

    // -----------------------------------------------
    // CANCELAR UN APARTADO
    // -----------------------------------------------
    // Uso delegación de events: un solo listener en
    // el document y busco el botón con closest()
    document.addEventListener('click', async (e) => {
        const boton = e.target.closest('.btn-accion-cancelar');

        if (!boton) return;

        e.preventDefault();

        const idApartado = boton.dataset.id || boton.getAttribute('data-id');

        if (!idApartado) {
            toast('error', 'El botón no tiene un ID asociado (data-id está vacío).');
            return;
        }

        // Pregunto si está seguro antes de cancelar
        const confirmar = confirm(`¿Deseas cancelar el apartado?`);
        if (!confirmar) return;

        try {
            const respuesta = await fetch(`/api/apartados/cancelar/${idApartado}`, {
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json'
                }
            });

            console.log('Status HTTP:', respuesta.status);

            // Intento parsear la respuesta como JSON
            let data;
            try {
                data = await respuesta.json();
            } catch (jsonErr) {
                data = {};
            }

            if (respuesta.ok) {
                toast('exito', data.mensaje || 'Apartado cancelado correctamente.');
                window.location.reload(); // Recargo para que se actualice la lista
            } else {
                toast('error', `Error ${respuesta.status}: ${data.error || data.mensaje || 'No se pudo procesar la solicitud en el servidor.'}`);
            }
        } catch (error) {
            console.error('Error de red o ejecución:', error);
            toast('error', 'Error de conexión con el servidor (Revisa la consola con F12).');
        }
    });

    // -----------------------------------------------
    // BOTÓN DE CERRAR/DISMISS (si existe)
    // -----------------------------------------------
    // Animación de salida cuando se cierra una card
    document.addEventListener('click', (e) => {
        const btnDismiss = e.target.closest('.btn-dismiss');
        if (!btnDismiss) return;

        const id = btnDismiss.dataset.id;
        const card = document.getElementById(`apartado-${id}`);

        if (card) {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => card.remove(), 300);
        }
    });

    // -----------------------------------------------
    // TEMPORIZADOR DE EXPIRACIÓN POR APARTADO
    // -----------------------------------------------
    const temporizadores = document.querySelectorAll('.temporizador-apartado');
    const procesados = new Set();

    function actualizarTemporizadores() {
        const ahora = new Date();

        temporizadores.forEach((el) => {
            const expiraStr = el.getAttribute('data-expira');
            const expira = new Date(expiraStr);
            const restante = expira - ahora;

            if (restante <= 0) {
                if (procesados.has(expiraStr)) return;
                procesados.add(expiraStr);

                el.classList.add('expirado');
                el.querySelector('.texto-temporizador').textContent = 'Apartado expirado';

                const tarjeta = el.closest('.tarjeta-producto');
                const idApartado = tarjeta ? tarjeta.id.replace('apartado-', '') : null;

                if (idApartado) {
                    fetch(`/api/apartados/cancelar/${idApartado}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    }).then(() => {
                        if (tarjeta) {
                            tarjeta.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                            tarjeta.style.opacity = '0';
                            tarjeta.style.transform = 'scale(0.9)';
                            setTimeout(() => tarjeta.remove(), 500);
                        }
                    });
                }
                return;
            }

            const horas = Math.floor(restante / (1000 * 60 * 60));
            const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
            const segundos = Math.floor((restante % (1000 * 60)) / 1000);

            const texto = `${horas}h ${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
            el.querySelector('.texto-temporizador').textContent = `Expira en: ${texto}`;

            if (restante < 10 * 60 * 1000) {
                el.classList.add('urgente');
            }
        });
    }

    if (temporizadores.length > 0) {
        actualizarTemporizadores();
        setInterval(actualizarTemporizadores, 1000);
    }

});
