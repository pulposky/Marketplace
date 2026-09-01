// =============================================
// OLVIDÉ CONTRASEÑA - JAVASCRIPT
// =============================================
// Maneja el modal de "Olvidé mi contraseña".
// Abre/cierra el modal igual que el de registro,
// y envía el restablecimiento al backend.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const ventanaOlvide = document.getElementById('modalOlvide');
    const ventanaLogin = document.getElementById('modalLogin');
    const formularioOlvide = document.getElementById('formOlvide');
    const botonCerrarOlvide = document.getElementById('cerrarModalOlvide');
    const mensajeOlvide = document.getElementById('mensajeOlvide');

    // Enlaces "Recupérala" que abren el modal de olvidé contraseña
    const enlacesOlvide = document.querySelectorAll('.enlace-olvide');

    // Enlace "Volver al login" dentro del modal
    const enlaceVolverLogin = document.getElementById('volverLoginOlvide');

    // -----------------------------------------------
    // ABRIR MODAL OLVIDÉ CONTRASEÑA
    // -----------------------------------------------
    enlacesOlvide.forEach(enlace => {
        enlace.addEventListener('click', (evento) => {
            evento.preventDefault();
            // Cerrar modal de login si está abierto
            if (ventanaLogin) ventanaLogin.style.display = 'none';
            // Abrir modal de olvidé contraseña
            if (ventanaOlvide) ventanaOlvide.style.display = 'flex';
        });
    });

    // -----------------------------------------------
    // CERRAR MODAL OLVIDÉ CONTRASEÑA
    // -----------------------------------------------
    if (botonCerrarOlvide) {
        botonCerrarOlvide.addEventListener('click', () => {
            ventanaOlvide.style.display = 'none';
        });
    }

    // Cerrar al hacer click fuera del modal
    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaOlvide) {
            ventanaOlvide.style.display = 'none';
        }
    });

    // -----------------------------------------------
    // VOLVER AL LOGIN
    // -----------------------------------------------
    if (enlaceVolverLogin) {
        enlaceVolverLogin.addEventListener('click', (evento) => {
            evento.preventDefault();
            if (ventanaOlvide) ventanaOlvide.style.display = 'none';
            if (ventanaLogin) ventanaLogin.style.display = 'flex';
        });
    }

    // -----------------------------------------------
    // ENVÍO DEL FORMULARIO - RESTABLECER CONTRASEÑA
    // -----------------------------------------------
    if (formularioOlvide) {
        formularioOlvide.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const documento = document.getElementById('olvDocumento')?.value?.trim();
            const nuevaPassword = document.getElementById('olvNuevaPassword')?.value;
            const confirmarPassword = document.getElementById('olvConfirmarPassword')?.value;

            if (!documento) {
                mostrarMensajeOlvide('Ingresa tu número de documento.', 'error');
                return;
            }
            if (!nuevaPassword) {
                mostrarMensajeOlvide('Ingresa una nueva contraseña.', 'error');
                return;
            }
            if (nuevaPassword.length < 6) {
                mostrarMensajeOlvide('La contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }
            if (nuevaPassword !== confirmarPassword) {
                mostrarMensajeOlvide('Las contraseñas no coinciden.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/restablecer-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documento, nuevaPassword })
                });

                const data = await response.json();

                if (data.ok) {
                    mostrarMensajeOlvide(data.mensaje, 'exito');
                    formularioOlvide.reset();
                    // Después de 2 segundos, volver al login
                    setTimeout(() => {
                        if (ventanaOlvide) ventanaOlvide.style.display = 'none';
                        if (ventanaLogin) ventanaLogin.style.display = 'flex';
                    }, 2000);
                } else {
                    mostrarMensajeOlvide(data.mensaje || 'Error al restablecer la contraseña.', 'error');
                }
            } catch (error) {
                console.error(error);
                mostrarMensajeOlvide('Error de conexión con el servidor.', 'error');
            }
        });
    }

    // -----------------------------------------------
    // MOSTRAR MENSAJE
    // -----------------------------------------------
    function mostrarMensajeOlvide(texto, tipo) {
        if (!mensajeOlvide) return;
        mensajeOlvide.textContent = texto;
        mensajeOlvide.className = 'mensaje-registro ' + tipo;
    }
});
