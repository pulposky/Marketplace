// Login.js controla el inicio de sesión desde los modales de la vista.
// Se usa en main.ejs y productos.ejs para autenticar al usuario.
window.resultadoLoginUltimo = null;

// payload: { documento }  OR { usuario, password }
async function procesarLogin(payload) {
    const etiquetaMensaje = document.getElementById('mensaje');

    try {
        const respuesta = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });

        const datos = await respuesta.json();
        window.resultadoLoginUltimo = datos;

        if (datos.ok) {
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'none';
                etiquetaMensaje.textContent = '';
                etiquetaMensaje.className = 'mensaje-error';
            }
            return datos;
        } else {
            if (etiquetaMensaje) {
                etiquetaMensaje.style.display = 'block';
                etiquetaMensaje.textContent = datos.mensaje;
                etiquetaMensaje.className = datos.tipo === 'vacio' ? 'mensaje-error mensaje-naranja' : 'mensaje-error mensaje-rojo';
            }
            const docInput = document.getElementById('doc');
            const pwdInput = document.getElementById('pwd');
            const userInput = document.getElementById('user');
            if (docInput) docInput.value = '';
            if (pwdInput) pwdInput.value = '';
            if (userInput) userInput.value = '';
            return datos;
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