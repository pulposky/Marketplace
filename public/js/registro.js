// =============================================
// REGISTRO - JAVASCRIPT
// =============================================
// Maneja el formulario de registro de usuarios.
// Abre el modal de registro, valida campos,
// envía los datos al servidor y muestra mensajes.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const ventanaRegistro = document.getElementById('modalRegistro');
    const ventanaLogin = document.getElementById('modalLogin');
    const formularioRegistro = document.getElementById('formRegistro');
    const botonCerrarRegistro = document.getElementById('cerrarModalRegistro');
    const mensajeRegistro = document.getElementById('mensajeRegistro');

    // Enlaces "Regístrate" que abren el modal de registro
    const enlacesRegistro = document.querySelectorAll('.enlace-registro');

    // Enlace "Volver al login" dentro del modal de registro
    const enlaceVolverLogin = document.getElementById('volverLogin');

    // -----------------------------------------------
    // ABRIR MODAL DE REGISTRO
    // -----------------------------------------------
    enlacesRegistro.forEach(enlace => {
        enlace.addEventListener('click', (evento) => {
            evento.preventDefault();
            // Cerrar modal de login si está abierto
            if (ventanaLogin) ventanaLogin.style.display = 'none';
            // Abrir modal de registro
            if (ventanaRegistro) ventanaRegistro.style.display = 'flex';
        });
    });

    // -----------------------------------------------
    // CERRAR MODAL DE REGISTRO
    // -----------------------------------------------
    if (botonCerrarRegistro) {
        botonCerrarRegistro.addEventListener('click', () => {
            ventanaRegistro.style.display = 'none';
        });
    }

    // Cerrar al hacer click fuera del modal
    window.addEventListener('click', (evento) => {
        if (evento.target === ventanaRegistro) {
            ventanaRegistro.style.display = 'none';
        }
    });

    // -----------------------------------------------
    // VOLVER AL LOGIN
    // -----------------------------------------------
    if (enlaceVolverLogin) {
        enlaceVolverLogin.addEventListener('click', (evento) => {
            evento.preventDefault();
            if (ventanaRegistro) ventanaRegistro.style.display = 'none';
            if (ventanaLogin) ventanaLogin.style.display = 'flex';
        });
    }

    // -----------------------------------------------
    // ENVÍO DEL FORMULARIO DE REGISTRO
    // -----------------------------------------------
    if (formularioRegistro) {
        formularioRegistro.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const nombre = document.getElementById('regNombre')?.value?.trim() || '';
            const documento = document.getElementById('regDocumento')?.value?.trim() || '';
            const direccion = document.getElementById('regDireccion')?.value?.trim() || '';
            const telefono = document.getElementById('regTelefono')?.value?.trim() || '';
            const rol = document.getElementById('regRol')?.value || '';
            const password = document.getElementById('regPassword')?.value || '';
            const confirmarPassword = document.getElementById('regConfirmarPassword')?.value || '';

            // Validación básica
            if (!nombre || !documento || !direccion || !telefono || !rol) {
                mostrarMensajeRegistro('Por favor completa todos los campos.', 'error');
                return;
            }

            // Validar la contraseña
            if (!password) {
                mostrarMensajeRegistro('La contraseña es obligatoria.', 'error');
                return;
            }
            if (password.length < 6) {
                mostrarMensajeRegistro('La contraseña debe tener al menos 6 caracteres.', 'error');
                return;
            }
            if (password !== confirmarPassword) {
                mostrarMensajeRegistro('Las contraseñas no coinciden.', 'error');
                return;
            }

            try {
                const respuesta = await fetch('/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ nombre, documento, direccion, telefono, rol, password })
                });

                const datos = await respuesta.json();

                if (datos.ok) {
                    mostrarMensajeRegistro(datos.mensaje || 'Registro exitoso. Ya puedes iniciar sesión.', 'exito');
                    formularioRegistro.reset();
                    // Redirigir al login después de 2 segundos
                    setTimeout(() => {
                        if (ventanaRegistro) ventanaRegistro.style.display = 'none';
                        if (ventanaLogin) ventanaLogin.style.display = 'flex';
                    }, 2000);
                } else {
                    mostrarMensajeRegistro(datos.mensaje || 'Error al registrar. Inténtalo de nuevo.', 'error');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                mostrarMensajeRegistro('Error de conexión con el servidor.', 'error');
            }
        });
    }

    // -----------------------------------------------
    // MOSTRAR MENSAJE
    // -----------------------------------------------
    function mostrarMensajeRegistro(texto, tipo) {
        if (!mensajeRegistro) return;
        mensajeRegistro.textContent = texto;
        mensajeRegistro.className = 'mensaje-registro ' + tipo;
    }
});
