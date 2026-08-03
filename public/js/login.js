// Login.js controla el inicio de sesión desde los modales de la vista
// Se usa en main.ejs y productos.ejs para autenticar al usuario
window.resultadoLoginUltimo = null;

async function procesarLogin(documento) {
    const etiquetaMensaje = document.getElementById('mensaje');

    try {
        const respuesta = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documento })
        });

        const datos = await respuesta.json();
        window.resultadoLoginUltimo = datos;

        if (datos.ok) {
            // Oculta cualquier mensaje anterior y reporta éxito
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'none';
                etiquetaMensaje.textContent = '';
                etiquetaMensaje.className = 'mensaje-error';
            }
            return true;
        } else {
            // Muestra el mensaje de error en el modal
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'block';
                etiquetaMensaje.textContent = datos.mensaje;
                etiquetaMensaje.className = datos.tipo === 'vacio' ? 'mensaje-error mensaje-naranja' : 'mensaje-error mensaje-rojo';
            }
            document.getElementById('doc').value = '';
            return false;
        }
    } catch (error) {
        console.error('Error en login:', error);
        if (etiquetaMensaje) {
            etiquetaMensaje.style.display = 'block';
            etiquetaMensaje.textContent = 'Error de conexión con el servidor';
            etiquetaMensaje.className = 'mensaje-error mensaje-rojo';
        }
        return false;
    }
}