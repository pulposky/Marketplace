// =============================================
// AVISO DE RECUPERACION ADMINISTRADA
// =============================================
// Abro el aviso que explica cómo solicitar una
// contraseña temporal al Administrador del sitio.
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalOlvide');
    const modalLogin = document.getElementById('modalLogin');
    const contacto = document.getElementById('contactoRecuperacion');

    // Consulto el teléfono configurable cuando se abre el aviso.
    async function cargarContactoRecuperacion() {
        if (!contacto) return;
        contacto.textContent = 'Cargando número de contacto…';
        try {
            const respuesta = await fetch('/api/recuperacion/contacto', { cache: 'no-store' });
            const datos = await respuesta.json();
            if (!respuesta.ok || !datos.ok) throw new Error('No se pudo consultar el número.');
            contacto.replaceChildren();
            if (datos.telefono) {
                const enlace = document.createElement('a');
                enlace.textContent = datos.telefono;
                enlace.href = `tel:${datos.telefono.replace(/[^+\d]/g, '')}`;
                contacto.appendChild(enlace);
            } else {
                contacto.textContent = 'El número de contacto aún no está configurado. Comunícate con el punto de atención.';
            }
        } catch (error) {
            contacto.textContent = 'No se pudo cargar el número de contacto. Comunícate con el punto de atención.';
        }
    }

    // Muestro el aviso y oculto el login mientras el cliente lo consulta.
    document.querySelectorAll('.enlace-olvide').forEach((enlace) => {
        enlace.addEventListener('click', (evento) => {
            evento.preventDefault();
            if (modalLogin) modalLogin.style.display = 'none';
            if (modal) modal.style.display = 'flex';
            cargarContactoRecuperacion();
        });
    });

    // Cierro el aviso y regreso al formulario de login.
    document.getElementById('cerrarModalOlvide')?.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
    document.getElementById('volverLoginOlvide')?.addEventListener('click', (evento) => {
        evento.preventDefault();
        if (modal) modal.style.display = 'none';
        if (modalLogin) modalLogin.style.display = 'flex';
    });
    window.addEventListener('click', (evento) => {
        if (evento.target === modal) modal.style.display = 'none';
    });
});
