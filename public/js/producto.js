document.addEventListener('DOMContentLoaded', () => {
    const modalLogin = document.getElementById('modalLogin');
    const cerrarModal = document.getElementById('cerrarModal');
    const formLogin = document.getElementById('formLogin');
    const mensajeError = document.getElementById('mensaje');

    // 1. Abrir modal al hacer clic en cualquier boton-apartar
    document.addEventListener('click', (e) => {
        if (e.target.matches('.boton-apartar')) {
            e.preventDefault();
            modalLogin.style.display = 'flex';
        }
    });

    // 2. Cerrar al pulsar la X
    cerrarModal.addEventListener('click', () => {
        modalLogin.style.display = 'none';
    });

    // 3. Cerrar al pulsar fuera del modal
    window.addEventListener('click', (e) => {
        if (e.target === modalLogin) {
            modalLogin.style.display = 'none';
        }
    });

    // 4. Enviar formulario por AJAX (fetch) sin recargar la página
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;

        try {
            const respuesta = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario, password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // Si el login fue correcto, recargamos la página o redirigimos
                window.location.reload(); 
            } else {
                // Mostrar mensaje de error devuelto por la API
                mensajeError.textContent = datos.mensaje || 'Credenciales incorrectas';
            }
        } catch (error) {
            mensajeError.textContent = 'Error al conectar con el servidor';
        }
    });
});