// =============================================
// OLVIDÉ CONTRASEÑA - JAVASCRIPT
// =============================================
// Maneja el modal de "Olvidé mi contraseña".
// Abre/cierra el modal igual que el de registro,
// y muestra mensajes. (Por ahora solo la parte
// visual / estructural, sin restablecimiento real).
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
    // ENVÍO DEL FORMULARIO (por ahora solo visual)
    // -----------------------------------------------
    if (formularioOlvide) {
        formularioOlvide.addEventListener('submit', (evento) => {
            evento.preventDefault();
            mostrarMensajeOlvide('El restablecimiento de contraseña estará disponible pronto.', 'error');
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
